import stripe
import json
import logging
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from events.models import EventType
from bookings.models import Booking
from bookings.serializers import BookingCreateSerializer, BookingSerializer
from bookings.tasks import send_booking_confirmation, send_booking_reminder, send_cancellation_email
from bookings.views import finalize_booking
from django.utils import timezone
from datetime import timedelta
from integrations.views import fire_webhooks
from integrations.models import GoogleCalendarToken
from integrations.google_calendar import create_calendar_event, delete_calendar_event

stripe.api_key = settings.STRIPE_SECRET_KEY

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


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    event_type_id = request.data.get('event_type_id')
    booking_data = request.data.get('booking_data', {})
    booking_id = request.data.get('booking_id')

    try:
        event_type = EventType.objects.get(id=event_type_id, is_active=True)
    except EventType.DoesNotExist:
        return Response({'error': 'Event type not found'}, status=404)

    if not event_type.price:
        return Response({'error': 'This event type is free'}, status=400)

    metadata = {
        'event_type_id': str(event_type.id),
        'booking_data': json.dumps(booking_data),
    }
    if booking_id:
        metadata['booking_id'] = str(booking_id)

    intent = stripe.PaymentIntent.create(
        amount=int(float(event_type.price) * 100),
        currency=event_type.currency.lower(),
        metadata=metadata,
    )

    return Response({
        'client_secret': intent.client_secret,
        'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, booking_id):
    booking = Booking.objects.filter(id=booking_id, event_type__host=request.user).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)
    return Response({
        'booking_id': str(booking.id),
        'payment_status': booking.payment_status,
        'stripe_payment_intent_id': booking.stripe_payment_intent_id,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_booking_payment(request):
    booking_id = request.data.get('booking_id')
    stripe_payment_intent_id = request.data.get('stripe_payment_intent_id')

    if not booking_id:
        return Response({'error': 'booking_id required'}, status=400)

    booking = Booking.objects.filter(id=booking_id).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    if booking.status == 'confirmed':
        return Response(BookingSerializer(booking).data, status=200)

    booking.status = 'confirmed'
    booking.payment_status = 'paid'
    if stripe_payment_intent_id:
        booking.stripe_payment_intent_id = stripe_payment_intent_id
    booking.save(update_fields=['status', 'payment_status', 'stripe_payment_intent_id'])

    finalize_booking(booking)

    return Response(BookingSerializer(booking).data, status=200)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'payment_intent.succeeded':
        _handle_payment_succeeded(event['data']['object'])

    return HttpResponse(status=200)


def _handle_payment_succeeded(intent):
    metadata = intent.get('metadata', {})
    booking_id = metadata.get('booking_id')
    stripe_pi_id = intent['id']

    booking = None
    if booking_id:
        booking = Booking.objects.filter(id=booking_id).first()
    if not booking and stripe_pi_id:
        booking = Booking.objects.filter(stripe_payment_intent_id=stripe_pi_id).first()

    if booking:
        booking.status = 'confirmed'
        booking.payment_status = 'paid'
        booking.stripe_payment_intent_id = stripe_pi_id
        booking.save(update_fields=['status', 'payment_status', 'stripe_payment_intent_id'])
        try:
            finalize_booking(booking)
        except Exception as e:
            logging.getLogger(__name__).error(f'Stripe webhook finalize_booking failed: {e}')
        return

    event_type_id = metadata.get('event_type_id')
    booking_data_str = metadata.get('booking_data', '{}')

    try:
        booking_data = json.loads(booking_data_str)
        booking_data['event_type_id'] = event_type_id
        serializer = BookingCreateSerializer(data=booking_data)
        if serializer.is_valid():
            booking = serializer.save(
                status='confirmed',
                stripe_payment_intent_id=stripe_pi_id,
                payment_status='paid',
            )
            finalize_booking(booking)
        else:
            logging.getLogger(__name__).error(f'Stripe webhook booking serializer errors: {serializer.errors}')
    except Exception as e:
        logging.getLogger(__name__).error(f'Stripe webhook booking creation failed: {e}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_booking(request, booking_id):
    booking = Booking.objects.filter(id=booking_id, event_type__host=request.user).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    if booking.payment_status != 'paid' or not booking.stripe_payment_intent_id:
        return Response({'error': 'Booking is not paid'}, status=400)

    try:
        refund = stripe.Refund.create(payment_intent=booking.stripe_payment_intent_id)
        booking.payment_status = 'refunded'
        booking.save(update_fields=['payment_status'])
        booking.status = 'cancelled'
        booking.save(update_fields=['status'])
        host = booking.event_type.host
        if hasattr(host, 'google_token') and booking.google_calendar_event_id:
            delete_calendar_event(host.google_token, booking.google_calendar_event_id)
        _safe_delay(send_cancellation_email, str(booking.id))
        fire_webhooks(host, 'booking.cancelled', BookingSerializer(booking).data)
        return Response({'message': 'Booking refunded', 'refund_id': refund.id})
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=400)
