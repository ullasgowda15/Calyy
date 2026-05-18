import stripe
import json
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from events.models import EventType
from bookings.models import Booking
from bookings.serializers import BookingCreateSerializer, BookingSerializer
from bookings.tasks import send_booking_confirmation, send_booking_reminder
from django.utils import timezone
from datetime import timedelta

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


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
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
                send_booking_confirmation.delay(str(booking.id))
                reminder_24h = booking.start_datetime - timedelta(hours=24)
                if reminder_24h > timezone.now():
                    send_booking_reminder.apply_async(args=[str(booking.id), 24], eta=reminder_24h)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'Stripe webhook booking creation failed: {e}')

    return HttpResponse(status=200)
