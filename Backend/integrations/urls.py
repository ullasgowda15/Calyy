from django.urls import path
from .views import (
    google_auth_url, google_callback, google_disconnect,
    google_status, WebhookSubscriptionViewSet,
)

urlpatterns = [
    path('google/auth/', google_auth_url, name='google_auth'),
    path('google/callback/', google_callback, name='google_callback'),
    path('google/disconnect/', google_disconnect, name='google_disconnect'),
    path('google/status/', google_status, name='google_status'),
    path('webhooks/', WebhookSubscriptionViewSet.as_view(), name='webhooks'),
]
