from django.contrib import admin
from .models import GoogleCalendarToken, WebhookSubscription

admin.site.register(GoogleCalendarToken)
admin.site.register(WebhookSubscription)
