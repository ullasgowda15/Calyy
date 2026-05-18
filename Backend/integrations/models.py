import uuid
from django.db import models
from django.conf import settings


class GoogleCalendarToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_token')
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField(null=True, blank=True)
    calendar_id = models.CharField(max_length=200, default='primary')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} Google Calendar'


class WebhookSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='webhooks')
    url = models.URLField()
    event = models.CharField(max_length=30, choices=[
        ('booking.created', 'Booking created'),
        ('booking.cancelled', 'Booking cancelled'),
        ('booking.rescheduled', 'Booking rescheduled'),
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} webhook -> {self.url} on {self.event}'
