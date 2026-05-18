from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_booking_confirmation(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        logger.warning(f'Booking {booking_id} not found for confirmation email')
        return

    host = booking.event_type.host
    subject = f'Booking confirmed: {booking.event_type.name}'

    invitee_body = f"""Hi {booking.invitee_name},

Your meeting has been confirmed!

Event: {booking.event_type.name}
With: {host.get_full_name() or host.username}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Duration: {booking.event_type.duration} minutes
Location: {booking.event_type.location_type.upper()}

Need to cancel? Visit: {settings.BASE_URL}/api/bookings/{booking.id}/cancel/?token={booking.cancel_token}

See you soon!
"""
    send_mail(subject, invitee_body, settings.DEFAULT_FROM_EMAIL, [booking.invitee_email], fail_silently=True)

    host_body = f"""Hi {host.get_full_name() or host.username},

New booking received!

From: {booking.invitee_name} ({booking.invitee_email})
Event: {booking.event_type.name}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Notes: {booking.notes or 'None'}
"""
    send_mail(f'New booking: {booking.invitee_name}', host_body, settings.DEFAULT_FROM_EMAIL, [host.email], fail_silently=True)


@shared_task
def send_booking_reminder(booking_id: str, hours_before: int = 24):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    if booking.status != 'confirmed':
        return

    subject = f'Reminder: {booking.event_type.name} in {hours_before} hour{"s" if hours_before != 1 else ""}'
    body = f"""Hi {booking.invitee_name},

Just a reminder about your upcoming meeting.

Event: {booking.event_type.name}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Location: {booking.event_type.location_type.upper()}

See you soon!
"""
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [booking.invitee_email], fail_silently=True)


@shared_task
def send_cancellation_email(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    subject = f'Cancelled: {booking.event_type.name}'
    body = f"""Hi {booking.invitee_name},

Your booking has been cancelled.

Event: {booking.event_type.name}
Original time: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC

To book again: {settings.BASE_URL}/book/{booking.event_type.host.username}/{booking.event_type.slug}/
"""
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [booking.invitee_email], fail_silently=True)
