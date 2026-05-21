from celery import shared_task
from django.conf import settings
import logging
import resend
import random

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
def send_verification_otp(user_id: str, otp: str):
    from .models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    subject = 'Verify your Caly email'
    html_body = f"""<p style="margin:0 0 16px">Hi <strong>{user.username}</strong>,</p>
<p style="margin:0 0 16px">Your verification code is:</p>
<div style="background:#f0f0f6;border-radius:8px;padding:16px;text-align:center;font-size:28px;font-weight:700;letter-spacing:8px;color:#7C3AED;margin:0 0 16px">{otp}</div>
<p style="margin:0 0 8px;font-size:13px;color:#888">This code expires in <strong>10 minutes</strong>.</p>
<p style="margin:16px 0 0;font-size:13px;color:#888">If you did not create an account, you can ignore this email.</p>"""
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [user.email],
            'subject': subject,
            'html': HTML_WRAP.replace('{body}', html_body),
        })
        logger.info(f'Verification OTP sent to {user.email}')
    except Exception as e:
        logger.error(f'Failed to send verification OTP: {e}')
