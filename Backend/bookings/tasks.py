from celery import shared_task
from django.conf import settings
import logging
import resend

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY

HTML_WRAP = """<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0">
<h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e">Caly</h1>
<hr style="border:none;border-top:1px solid #eee;margin:16px 0 24px">
</td></tr>
<tr><td style="padding:0 32px 32px;font-size:15px;line-height:1.6;color:#333">{body}</td></tr>
<tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #eee;font-size:13px;color:#888;text-align:center">
Caly &mdash; Modern Scheduling</td></tr></table></td></tr></table></body></html>"""


@shared_task
def send_booking_confirmation(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        logger.warning(f'Booking {booking_id} not found for confirmation email')
        return

    host = booking.event_type.host
    host_name = host.get_full_name() or host.username
    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')

    invitee_body = f"""<p style="margin:0 0 16px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 16px">Your meeting has been confirmed!</p>
<table cellpadding="8" cellspacing="0" style="width:100%;font-size:14px;margin:0 0 16px">
<tr><td style="color:#888;width:100px;vertical-align:top">Event</td><td style="font-weight:600">{booking.event_type.name}</td></tr>
<tr><td style="color:#888;vertical-align:top">With</td><td style="font-weight:600">{host_name}</td></tr>
<tr><td style="color:#888;vertical-align:top">When</td><td style="font-weight:600">{dt} UTC</td></tr>
<tr><td style="color:#888;vertical-align:top">Duration</td><td style="font-weight:600">{booking.event_type.duration} min</td></tr>
<tr><td style="color:#888;vertical-align:top">Location</td><td style="font-weight:600">{booking.event_type.location_type.upper()}</td></tr>
</table>
<p style="margin:0;font-size:13px;color:#888">Need to cancel? <a href="{settings.BASE_URL}/api/bookings/{booking.id}/cancel/?token={booking.cancel_token}" style="color:#7C3AED">Cancel here</a></p>"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Booking confirmed: {booking.event_type.name}',
            'html': HTML_WRAP.replace('{body}', invitee_body),
        })
    except Exception as e:
        logger.error(f'Failed to send invitee confirmation email: {e}')

    host_body = f"""<p style="margin:0 0 16px">Hi {host_name},</p>
<p style="margin:0 0 16px">New booking received!</p>
<table cellpadding="8" cellspacing="0" style="width:100%;font-size:14px;margin:0 0 16px">
<tr><td style="color:#888;width:100px;vertical-align:top">From</td><td style="font-weight:600">{booking.invitee_name} ({booking.invitee_email})</td></tr>
<tr><td style="color:#888;vertical-align:top">Event</td><td style="font-weight:600">{booking.event_type.name}</td></tr>
<tr><td style="color:#888;vertical-align:top">When</td><td style="font-weight:600">{dt} UTC</td></tr>
<tr><td style="color:#888;vertical-align:top">Notes</td><td style="font-weight:600">{booking.notes or 'None'}</td></tr>
</table>"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [host.email],
            'subject': f'New booking: {booking.invitee_name}',
            'html': HTML_WRAP.replace('{body}', host_body),
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

    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')
    body = f"""<p style="margin:0 0 16px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 16px">Just a reminder about your upcoming meeting.</p>
<table cellpadding="8" cellspacing="0" style="width:100%;font-size:14px;margin:0 0 16px">
<tr><td style="color:#888;width:100px;vertical-align:top">Event</td><td style="font-weight:600">{booking.event_type.name}</td></tr>
<tr><td style="color:#888;vertical-align:top">When</td><td style="font-weight:600">{dt} UTC</td></tr>
<tr><td style="color:#888;vertical-align:top">Location</td><td style="font-weight:600">{booking.event_type.location_type.upper()}</td></tr>
</table>"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Reminder: {booking.event_type.name} in {hours_before} hour{"s" if hours_before != 1 else ""}',
            'html': HTML_WRAP.replace('{body}', body),
        })
    except Exception as e:
        logger.error(f'Failed to send reminder email: {e}')


@shared_task
def send_cancellation_email(booking_id: str, reason: str = ''):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')
    reason_html = f'<tr><td style="color:#888;vertical-align:top">Reason</td><td style="font-weight:600">{reason}</td></tr>' if reason else ''
    body = f"""<p style="margin:0 0 16px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 16px">Your booking has been cancelled.</p>
<table cellpadding="8" cellspacing="0" style="width:100%;font-size:14px;margin:0 0 16px">
<tr><td style="color:#888;width:100px;vertical-align:top">Event</td><td style="font-weight:600">{booking.event_type.name}</td></tr>
<tr><td style="color:#888;vertical-align:top">Original time</td><td style="font-weight:600">{dt} UTC</td></tr>
{reason_html}</table>
<p style="margin:0;font-size:13px;color:#888">To book again: <a href="{settings.BASE_URL}/book/{booking.event_type.host.username}/{booking.event_type.slug}/" style="color:#7C3AED">Schedule a new meeting</a></p>"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Cancelled: {booking.event_type.name}',
            'html': HTML_WRAP.replace('{body}', body),
        })
    except Exception as e:
        logger.error(f'Failed to send cancellation email: {e}')


@shared_task
def send_no_show_email(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    host = booking.event_type.host
    host_name = host.get_full_name() or host.username
    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')
    body = f"""<p style="margin:0 0 16px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 16px">You were marked as a <strong>no-show</strong> for the following meeting.</p>
<table cellpadding="8" cellspacing="0" style="width:100%;font-size:14px;margin:0 0 16px">
<tr><td style="color:#888;width:100px;vertical-align:top">Event</td><td style="font-weight:600">{booking.event_type.name}</td></tr>
<tr><td style="color:#888;vertical-align:top">With</td><td style="font-weight:600">{host_name}</td></tr>
<tr><td style="color:#888;vertical-align:top">Scheduled</td><td style="font-weight:600">{dt} UTC</td></tr>
</table>
<p style="margin:0 0 8px;font-size:13px;color:#888">If you believe this is an error, please contact the host directly.</p>
<p style="margin:0;font-size:13px;color:#888">To reschedule: <a href="{settings.BASE_URL}/book/{booking.event_type.host.username}/{booking.event_type.slug}/" style="color:#7C3AED">Book a new time</a></p>"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Missed meeting: {booking.event_type.name}',
            'html': HTML_WRAP.replace('{body}', body),
        })
    except Exception as e:
        logger.error(f'Failed to send no-show email: {e}')


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
