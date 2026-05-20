from celery import shared_task
from django.conf import settings
import logging
import resend

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY


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
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': subject,
            'text': invitee_body,
        })
    except Exception as e:
        logger.error(f'Failed to send invitee confirmation email: {e}')

    host_body = f"""Hi {host.get_full_name() or host.username},

New booking received!

From: {booking.invitee_name} ({booking.invitee_email})
Event: {booking.event_type.name}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Notes: {booking.notes or 'None'}
"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [host.email],
            'subject': f'New booking: {booking.invitee_name}',
            'text': host_body,
        })
    except Exception as e:
        logger.error(f'Failed to send host confirmation email: {e}')


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
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': subject,
            'text': body,
        })
    except Exception as e:
        logger.error(f'Failed to send reminder email: {e}')


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
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': subject,
            'text': body,
        })
    except Exception as e:
        logger.error(f'Failed to send cancellation email: {e}')


@shared_task
def release_expired_pending_bookings():
    from django.utils import timezone
    from .models import Booking

    now = timezone.now()
    expired = Booking.objects.filter(
        status='pending',
        pending_until__isnull=False,
        pending_until__lt=now,
    )

    count = expired.count()
    if count:
        expired.update(status='cancelled', pending_until=None)
        logger.info(f'Released {count} expired pending booking(s)')
    return count
