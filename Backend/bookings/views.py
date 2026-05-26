import uuid
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer, BookingListSerializer
from .tasks import send_booking_confirmation, send_booking_reminder, send_cancellation_email, send_no_show_email, send_rescheduled_email, sync_google_calendar_event, delete_google_calendar_event, deliver_webhook_task
from django_ratelimit.decorators import ratelimit
import logging

logger = logging.getLogger(__name__)


def _safe_delay(task, *args, **kwargs):
    try:
        task.delay(*args, **kwargs)
    except Exception as e:
        logger.warning(f'Failed to enqueue task {task.__name__}: {e}')


def _safe_apply_async(task, *args, **kwargs):
    try:
        task.apply_async(*args, **kwargs)
    except Exception as e:
        logger.warning(f'Failed to enqueue task {task.__name__}: {e}')


BOOKING_SELECT = Booking.objects.select_related('event_type__host')


def finalize_booking(booking):
    host = booking.event_type.host
    if hasattr(host, 'google_token'):
        _safe_delay(sync_google_calendar_event, str(booking.id))
    _safe_delay(send_booking_confirmation, str(booking.id))
    reminder_24h = booking.start_datetime - timedelta(hours=24)
    if reminder_24h > timezone.now():
        _safe_apply_async(send_booking_reminder, args=[str(booking.id), 24], eta=reminder_24h)
    reminder_1h = booking.start_datetime - timedelta(hours=1)
    if reminder_1h > timezone.now():
        _safe_apply_async(send_booking_reminder, args=[str(booking.id), 1], eta=reminder_1h)
    _safe_delay(deliver_webhook_task, str(host.id), 'booking.created', BookingSerializer(booking).data)


class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = (permissions.AllowAny,)
    throttle_scope = 'booking-create'

    def perform_create(self, serializer):
        return serializer.save()

    def _finalize_booking(self, booking):
        finalize_booking(booking)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event_type = serializer.validated_data.get('event_type')

        if event_type and not event_type.host.is_subscribed():
            return Response({'error': 'This host\'s subscription has expired. Please contact them directly.'}, status=403)

        with transaction.atomic():
            from events.availability import get_available_slots
            import pytz
            start = serializer.validated_data['start_datetime']
            if timezone.is_naive(start):
                start = pytz.utc.localize(start)
            target_date = start.date()
            available_slots = get_available_slots(event_type, target_date, event_type.host.timezone)
            slot_starts = [s['start'] for s in available_slots]
            if start.isoformat() not in slot_starts:
                return Response({'error': 'This time slot is no longer available.'}, status=409)
            Booking.objects.select_for_update().filter(
                event_type=event_type,
                status__in=['confirmed', 'pending'],
                start_datetime__date=target_date,
            ).first()
            self.perform_create(serializer)

        booking = serializer.instance

        # V2: Host payment collection — disabled until platform is established
        # When re-enabling, uncomment the block below.
        # if event_type and event_type.price and float(event_type.price) > 0:
        #     booking.status = 'pending'
        #     booking.payment_status = 'unpaid'
        #     booking.pending_until = timezone.now() + timedelta(minutes=10)
        #     booking.save(update_fields=['status', 'payment_status', 'pending_until'])
        #     return Response({
        #         'requires_payment': True,
        #         'booking_id': str(booking.id),
        #         'cancel_token': str(booking.cancel_token),
        #         'event_type_id': str(event_type.id),
        #         'price': str(event_type.price),
        #         'currency': event_type.currency,
        #         'booking_data': request.data,
        #     }, status=status.HTTP_200_OK)

        booking.status = 'confirmed'
        booking.save(update_fields=['status'])
        self._finalize_booking(booking)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class HostBookingListView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = BOOKING_SELECT.filter(event_type__host=self.request.user)
        status_filter = self.request.query_params.get('status')
        valid_statuses = [s[0] for s in Booking.STATUS_CHOICES]
        if status_filter:
            if status_filter not in valid_statuses:
                return Booking.objects.none()
            qs = qs.filter(status=status_filter)
        return qs


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return BOOKING_SELECT.filter(event_type__host=self.request.user)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', method='GET')
def cancel_booking(request, booking_id):
    booking = get_object_or_404(BOOKING_SELECT, id=booking_id)
    token = request.query_params.get('token') or request.data.get('token')

    if str(booking.cancel_token) != str(token):
        return Response({'error': 'Invalid cancellation token'}, status=403)

    if booking.status == 'cancelled':
        return Response({'error': 'Booking already cancelled'}, status=400)

    if booking.start_datetime <= timezone.now():
        return Response({'error': 'Cannot cancel a meeting that has already started or ended'}, status=400)

    reason = request.data.get('reason', '') or request.query_params.get('reason', '')
    booking.status = 'cancelled'
    booking.save()
    host = booking.event_type.host
    if hasattr(host, 'google_token') and booking.google_calendar_event_id:
        _safe_delay(delete_google_calendar_event, str(host.id), booking.google_calendar_event_id)
    _safe_delay(send_cancellation_email, str(booking.id), reason)
    _safe_delay(deliver_webhook_task, str(host.id), 'booking.cancelled', BookingSerializer(booking).data)
    if request.method == 'GET':
        return redirect(f'{settings.FRONTEND_URL}/booking-cancelled')
    return Response({'message': 'Booking cancelled successfully'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', method='POST')
def reschedule_booking(request, booking_id, token=None):
    if token is None:
        token = request.query_params.get('token') or request.data.get('token')
    booking = get_object_or_404(BOOKING_SELECT, id=booking_id)
    if str(booking.reschedule_token) != str(token):
        return Response({'error': 'Invalid reschedule token'}, status=403)

    if booking.status == 'cancelled':
        return Response({'error': 'Cannot reschedule cancelled booking'}, status=400)

    if booking.start_datetime <= timezone.now():
        return Response({'error': 'Cannot reschedule a meeting that has already started or ended'}, status=400)

    if booking.reschedule_count >= 3:
        return Response({'error': 'Maximum 3 reschedules allowed per booking'}, status=400)

    new_start = request.data.get('start_datetime')
    if not new_start:
        return Response({'error': 'start_datetime required'}, status=400)

    booking_data = {
        'event_type_id': str(booking.event_type.id),
        'invitee_name': booking.invitee_name,
        'invitee_email': booking.invitee_email,
        'invitee_timezone': booking.invitee_timezone,
        'start_datetime': new_start,
        'notes': booking.notes,
        'custom_answers': booking.custom_answers,
    }
    serializer = BookingCreateSerializer(data=booking_data)
    serializer.is_valid(raise_exception=True)

    new_start_dt = serializer.validated_data['start_datetime']
    new_end_dt = new_start_dt + timedelta(minutes=booking.event_type.duration)

    with transaction.atomic():
        Booking.objects.select_for_update().filter(
            event_type=booking.event_type,
            status__in=['confirmed', 'pending'],
            start_datetime=new_start_dt,
        ).exclude(id=booking.id).first()
        booking.start_datetime = new_start_dt
        booking.end_datetime = new_end_dt
        booking.save(update_fields=['start_datetime', 'end_datetime'])

    booking.refresh_from_db()
    booking.reschedule_count += 1
    booking.reschedule_token = uuid.uuid4()
    booking.save(update_fields=['reschedule_count', 'reschedule_token'])

    host = booking.event_type.host
    if hasattr(host, 'google_token') and booking.google_calendar_event_id:
        _safe_delay(delete_google_calendar_event, str(host.id), booking.google_calendar_event_id)
    _safe_delay(sync_google_calendar_event, str(booking.id))
    _safe_delay(send_rescheduled_email, str(booking.id))
    _safe_delay(deliver_webhook_task, str(host.id), 'booking.rescheduled', BookingSerializer(booking).data)
    return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', method=('GET', 'POST'))
def reschedule_by_token(request, reschedule_token):
    booking = get_object_or_404(BOOKING_SELECT, reschedule_token=reschedule_token)
    if request.method == 'GET':
        return Response({
            'host_username': booking.event_type.host.username,
            'event_type_id': str(booking.event_type.id),
            'event_type_name': booking.event_type.name,
            'event_type_duration': booking.event_type.duration,
            'invitee_name': booking.invitee_name,
            'invitee_email': booking.invitee_email,
            'current_start': booking.start_datetime.isoformat(),
        })
    return reschedule_booking(request._request, booking.id, token=str(reschedule_token))


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_booking_status(request, booking_id):
    booking = get_object_or_404(BOOKING_SELECT, id=booking_id, event_type__host=request.user)
    new_status = request.data.get('status')
    if new_status not in ['completed', 'no_show']:
        return Response({'error': 'Invalid status'}, status=400)
    if booking.status != 'confirmed':
        return Response({'error': 'Can only update confirmed bookings'}, status=400)
    booking.status = new_status
    booking.save()
    if new_status == 'no_show':
        _safe_delay(send_no_show_email, str(booking.id))
    return Response(BookingSerializer(booking).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def host_cancel_booking(request, booking_id):
    booking = get_object_or_404(BOOKING_SELECT, id=booking_id, event_type__host=request.user)
    if booking.status == 'cancelled':
        return Response({'error': 'Booking already cancelled'}, status=400)
    reason = request.data.get('reason', '')
    booking.status = 'cancelled'
    booking.save()
    host = booking.event_type.host
    if hasattr(host, 'google_token') and booking.google_calendar_event_id:
        _safe_delay(delete_google_calendar_event, str(host.id), booking.google_calendar_event_id)
    _safe_delay(send_cancellation_email, str(booking.id), reason)
    _safe_delay(deliver_webhook_task, str(host.id), 'booking.cancelled', BookingSerializer(booking).data)
    return Response({'message': 'Booking cancelled successfully'})
