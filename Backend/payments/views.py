import razorpay
import json
import hmac
import hashlib
import logging
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from events.models import EventType
from bookings.models import Booking
from bookings.serializers import BookingCreateSerializer, BookingSerializer
from bookings.tasks import (
    send_booking_confirmation,
    send_booking_reminder,
    send_cancellation_email,
)
from integrations.views import fire_webhooks
from integrations.models import GoogleCalendarToken
from integrations.google_calendar import create_calendar_event, delete_calendar_event

logger = logging.getLogger(__name__)


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


# ─────────────────────────────────────────────────────────────
# CREATE RAZORPAY ORDER
# POST /api/payments/create-order/
# Called by frontend before showing payment modal.
# Returns order_id and key_id to frontend.
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def create_razorpay_order(request):
    event_type_id = request.data.get('event_type_id')
    booking_data = request.data.get('booking_data', {})

    if not event_type_id:
        return Response({'error': 'event_type_id is required'}, status=400)

    try:
        event_type = EventType.objects.get(id=event_type_id, is_active=True)
    except EventType.DoesNotExist:
        return Response({'error': 'Event type not found'}, status=404)

    if not event_type.price or float(event_type.price) <= 0:
        return Response({'error': 'This event type is free'}, status=400)

    amount_in_paise = int(float(event_type.price) * 100)
    currency = event_type.currency.upper() if event_type.currency else 'INR'

    try:
        client = get_razorpay_client()
        order = client.order.create({
            'amount': amount_in_paise,
            'currency': currency,
            'notes': {
                'event_type_id': str(event_type.id),
                'booking_data': json.dumps(booking_data),
            }
        })
    except Exception as e:
        logger.error(f'Razorpay order creation failed: {e}')
        return Response({'error': 'Payment initialization failed. Try again.'}, status=500)

    return Response({
        'order_id': order['id'],
        'key_id': settings.RAZORPAY_KEY_ID,
        'amount': amount_in_paise,
        'currency': currency,
        'event_type_name': event_type.name,
        'prefill': {
            'name': booking_data.get('invitee_name', ''),
            'email': booking_data.get('invitee_email', ''),
        }
    })


# ─────────────────────────────────────────────────────────────
# VERIFY PAYMENT AND CONFIRM BOOKING
# POST /api/payments/verify/
# Called by frontend AFTER Razorpay modal closes successfully.
# Verifies signature and creates the booking.
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_payment(request):
    razorpay_order_id = request.data.get('razorpay_order_id')
    razorpay_payment_id = request.data.get('razorpay_payment_id')
    razorpay_signature = request.data.get('razorpay_signature')
    event_type_id = request.data.get('event_type_id')
    booking_data = request.data.get('booking_data', {})
    booking_id = request.data.get('booking_id')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return Response({'error': 'Payment details incomplete'}, status=400)

    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
        f'{razorpay_order_id}|{razorpay_payment_id}'.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != razorpay_signature:
        logger.warning(f'Razorpay signature mismatch for order {razorpay_order_id}')
        return Response({'error': 'Payment verification failed'}, status=400)

    existing = Booking.objects.filter(razorpay_payment_id=razorpay_payment_id).first()
    if existing:
        return Response(BookingSerializer(existing).data, status=200)

    from django.db import transaction
    with transaction.atomic():
        if booking_id:
            booking = Booking.objects.filter(id=booking_id, status='pending').first()
            if booking:
                booking.status = 'confirmed'
                booking.payment_status = 'paid'
                booking.razorpay_order_id = razorpay_order_id
                booking.razorpay_payment_id = razorpay_payment_id
                booking.razorpay_signature = razorpay_signature
                booking.pending_until = None
                booking.save(update_fields=[
                    'status', 'payment_status', 'razorpay_order_id',
                    'razorpay_payment_id', 'razorpay_signature', 'pending_until'
                ])
                booking = Booking.objects.get(id=booking.id)
            else:
                return Response({'error': 'Pending booking not found'}, status=404)
        else:
            booking_data['event_type_id'] = event_type_id
            serializer = BookingCreateSerializer(data=booking_data)
            if not serializer.is_valid():
                logger.error(f'Booking creation failed after payment: {serializer.errors}')
                return Response(
                    {'error': 'Payment successful but booking failed. Contact support.',
                     'details': serializer.errors},
                    status=400
                )
            booking = serializer.save(
                status='confirmed',
                payment_status='paid',
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
            )

    try:
        host = booking.event_type.host
        if hasattr(host, 'google_token'):
            gc_event_id = create_calendar_event(host.google_token, booking)
            if gc_event_id:
                booking.google_calendar_event_id = gc_event_id
                booking.save(update_fields=['google_calendar_event_id'])
    except Exception as e:
        logger.warning(f'Google Calendar push failed: {e}')

    send_booking_confirmation.delay(str(booking.id))

    reminder_24h = booking.start_datetime - timedelta(hours=24)
    if reminder_24h > timezone.now():
        send_booking_reminder.apply_async(
            args=[str(booking.id), 24], eta=reminder_24h
        )
    reminder_1h = booking.start_datetime - timedelta(hours=1)
    if reminder_1h > timezone.now():
        send_booking_reminder.apply_async(
            args=[str(booking.id), 1], eta=reminder_1h
        )

    fire_webhooks(
        booking.event_type.host,
        'booking.created',
        BookingSerializer(booking).data,
    )

    logger.info(f'Booking {booking.id} confirmed via Razorpay payment {razorpay_payment_id}')
    return Response(BookingSerializer(booking).data, status=201)


# ─────────────────────────────────────────────────────────────
# PAYMENT STATUS
# GET /api/payments/<booking_id>/status/
# Frontend polls this to check payment state.
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, booking_id):
    booking = Booking.objects.filter(
        id=booking_id,
        event_type__host=request.user
    ).first()

    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    return Response({
        'booking_id': str(booking.id),
        'payment_status': booking.payment_status,
        'razorpay_order_id': booking.razorpay_order_id,
        'razorpay_payment_id': booking.razorpay_payment_id,
        'status': booking.status,
    })


# ─────────────────────────────────────────────────────────────
# RAZORPAY WEBHOOK
# POST /api/payments/webhook/
# Receives payment.captured events from Razorpay.
# Backup confirmation in case verify_payment was not called.
# ─────────────────────────────────────────────────────────────

@csrf_exempt
def razorpay_webhook(request):
    payload = request.body
    received_signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')

    if not received_signature:
        return HttpResponse('Missing signature', status=400)

    expected_signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, received_signature):
        logger.warning('Razorpay webhook: invalid signature')
        return HttpResponse('Invalid signature', status=400)

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        return HttpResponse('Invalid JSON', status=400)

    event_type = event.get('event')

    if event_type == 'payment.captured':
        _handle_payment_captured(event)

    return HttpResponse(status=200)


def _handle_payment_captured(event):
    try:
        payment = event['payload']['payment']['entity']
        razorpay_payment_id = payment.get('id')
        razorpay_order_id = payment.get('order_id')
        notes = payment.get('notes', {})

        event_type_id = notes.get('event_type_id')
        booking_data_str = notes.get('booking_data', '{}')

        if not razorpay_payment_id:
            logger.error('Razorpay webhook: no payment ID in payload')
            return

        if Booking.objects.filter(razorpay_payment_id=razorpay_payment_id).exists():
            logger.info(f'Booking already exists for payment {razorpay_payment_id}')
            return

        if not event_type_id:
            logger.error('Razorpay webhook: no event_type_id in notes')
            return

        booking_data = json.loads(booking_data_str)
        booking_data['event_type_id'] = event_type_id

        serializer = BookingCreateSerializer(data=booking_data)
        if not serializer.is_valid():
            logger.error(f'Webhook booking validation failed: {serializer.errors}')
            return

        from django.db import transaction
        with transaction.atomic():
            booking = serializer.save(
                status='confirmed',
                payment_status='paid',
                razorpay_order_id=razorpay_order_id or '',
                razorpay_payment_id=razorpay_payment_id,
            )

        send_booking_confirmation.delay(str(booking.id))
        fire_webhooks(
            booking.event_type.host,
            'booking.created',
            BookingSerializer(booking).data,
        )
        logger.info(f'Booking {booking.id} created via webhook for payment {razorpay_payment_id}')

    except Exception as e:
        logger.error(f'Razorpay webhook handler failed: {e}')


# ─────────────────────────────────────────────────────────────
# REFUND BOOKING
# POST /api/payments/<booking_id>/refund/
# Host initiates a refund via Razorpay.
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_booking(request, booking_id):
    booking = Booking.objects.filter(
        id=booking_id,
        event_type__host=request.user
    ).first()

    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    if booking.payment_status != 'paid':
        return Response({'error': 'Booking is not paid'}, status=400)

    if not booking.razorpay_payment_id:
        return Response({'error': 'No payment ID associated with this booking'}, status=400)

    if booking.payment_status == 'refunded':
        return Response({'error': 'Already refunded'}, status=400)

    try:
        client = get_razorpay_client()
        amount_in_paise = int(float(booking.event_type.price) * 100)
        refund = client.payment.refund(
            booking.razorpay_payment_id,
            {'amount': amount_in_paise}
        )

        booking.payment_status = 'refunded'
        booking.status = 'cancelled'
        booking.save(update_fields=['payment_status', 'status'])

        try:
            host = booking.event_type.host
            if hasattr(host, 'google_token') and booking.google_calendar_event_id:
                delete_calendar_event(host.google_token, booking.google_calendar_event_id)
        except Exception as e:
            logger.warning(f'Calendar event deletion failed on refund: {e}')

        send_cancellation_email.delay(str(booking.id))
        fire_webhooks(
            booking.event_type.host,
            'booking.cancelled',
            BookingSerializer(booking).data,
        )

        return Response({
            'message': 'Refund initiated successfully',
            'refund_id': refund.get('id'),
        })

    except Exception as e:
        logger.error(f'Razorpay refund failed for booking {booking_id}: {e}')
        return Response({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────
# CANCEL PENDING BOOKING
# POST /api/payments/cancel-pending/
# Called by frontend when user abandons payment.
# Releases the slot by cancelling the pending booking.
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_pending_booking(request):
    booking_id = request.data.get('booking_id')

    if not booking_id:
        return Response({'error': 'booking_id required'}, status=400)

    booking = Booking.objects.filter(id=booking_id, status='pending').first()
    if not booking:
        return Response({'error': 'Pending booking not found'}, status=404)

    booking.status = 'cancelled'
    booking.pending_until = None
    booking.save(update_fields=['status', 'pending_until'])

    logger.info(f'Pending booking {booking_id} cancelled — slot released')
    return Response({'message': 'Booking cancelled, slot released'})
