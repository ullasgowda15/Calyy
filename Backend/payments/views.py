import stripe
import json
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
from django.utils import timezone
from datetime import timedelta
from integrations.views import fire_webhooks
from integrations.models import GoogleCalendarToken
from integrations.google_calendar import create_calendar_event, delete_calendar_event

stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    event_type_id = request.data.get('event_type_id')
    booking_data = request.data.get('booking_data', {})

    try:
        event_type = EventType.objects.get(id=event_type_id, is_active=True)
    except EventType.DoesNotExist:
        return Response({'error': 'Event type not found'}, status=404)

    if not event_type.price:
        return Response({'error': 'This event type is free'}, status=400)

    intent = stripe.PaymentIntent.create(
        amount=int(float(event_type.price) * 100),
        currency=event_type.currency.lower(),
        metadata={
            'event_type_id': str(event_type.id),
            'booking_data': json.dumps(booking_data),
        }
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
    event_type_id = metadata.get('event_type_id')
    booking_data_str = metadata.get('booking_data', '{}')

    try:
        booking_data = json.loads(booking_data_str)
        booking_data['event_type_id'] = event_type_id
        serializer = BookingCreateSerializer(data=booking_data)
        if serializer.is_valid():
            booking = serializer.save(
                status='confirmed',
                stripe_payment_intent_id=intent['id'],
                payment_status='paid',
            )
            event_type = booking.event_type
            host = event_type.host
            if hasattr(host, 'google_token'):
                gc_event_id = create_calendar_event(host.google_token, booking)
                if gc_event_id:
                    booking.google_calendar_event_id = gc_event_id
                    booking.save(update_fields=['google_calendar_event_id'])
            send_booking_confirmation.delay(str(booking.id))
            reminder_24h = booking.start_datetime - timedelta(hours=24)
            if reminder_24h > timezone.now():
                send_booking_reminder.apply_async(args=[str(booking.id), 24], eta=reminder_24h)
            reminder_1h = booking.start_datetime - timedelta(hours=1)
            if reminder_1h > timezone.now():
                send_booking_reminder.apply_async(args=[str(booking.id), 1], eta=reminder_1h)
            fire_webhooks(host, 'booking.created', BookingSerializer(booking).data)
    except Exception as e:
        import logging
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
        send_cancellation_email.delay(str(booking.id))
        fire_webhooks(host, 'booking.cancelled', BookingSerializer(booking).data)
        return Response({'message': 'Booking refunded', 'refund_id': refund.id})
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=400)
