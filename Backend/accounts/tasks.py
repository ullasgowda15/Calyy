from celery import shared_task
from django.conf import settings
import logging
import resend

from bookings.email_templates import HTML_WRAP

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def send_verification_otp(user_id: str, otp: str):
    from .models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    subject = 'Verify your YourCaly email'
    html_body = f'''<p style="margin:0 0 16px">Hi <strong>{user.username}</strong>,</p>
<p style="margin:0 0 20px">Please use the code below to verify your email address.</p>
<div style="background:#f4f0ff;border-radius:12px;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:10px;color:#7C3AED;margin:0 0 16px;font-family:monospace">{otp}</div>
<p style="margin:0 0 4px;font-size:13px;color:#999">This code expires in <strong>10 minutes</strong>.</p>
<p style="margin:16px 0 0;font-size:13px;color:#999">If you did not create an account, you can ignore this email.</p>'''
    try:
        resend.Emails.send({
            'from': settings.NOREPLY_EMAIL,
            'to': [user.email],
            'subject': subject,
            'html': HTML_WRAP.replace('{body}', html_body),
        })
        logger.info(f'Verification OTP sent to {user.email}')
    except Exception as e:
        logger.error(f'Failed to send verification OTP: {e}')
        raise


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def send_password_reset_email(email: str, reset_link: str):
    html_body = f'''<p style="margin:0 0 16px">Hi,</p>
<p style="margin:0 0 20px">We received a request to reset your YourCaly password. Click the button below to proceed.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="background:#7C3AED;border-radius:8px;padding:12px 28px">
<a href="{reset_link}" style="color:#fff;text-decoration:none;font-size:15px;font-weight:600">Reset password</a>
</td></tr></table>
<p style="margin:0 0 4px;font-size:13px;color:#999">Or copy this link into your browser:</p>
<p style="margin:0 0 16px;font-size:12px;color:#7C3AED;word-break:break-all">{reset_link}</p>
<p style="margin:16px 0 0;font-size:13px;color:#999">If you did not request this, you can safely ignore this email.</p>'''
    subject = 'Reset your YourCaly password'
    try:
        resend.Emails.send({
            'from': settings.NOREPLY_EMAIL,
            'to': [email],
            'subject': subject,
            'html': HTML_WRAP.replace('{body}', html_body),
        })
        logger.info(f'Password reset email sent to {email}')
    except Exception as e:
        logger.error(f'Failed to send password reset email: {e}')
        raise
