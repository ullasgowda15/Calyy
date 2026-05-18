import json
import requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from google_auth_oauthlib.flow import Flow
from .models import GoogleCalendarToken, WebhookSubscription
from .serializers import WebhookSubscriptionSerializer


SCOPES = ['https://www.googleapis.com/auth/calendar']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def google_auth_url(request):
    flow = Flow.from_client_config(
        {
            'web': {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uris': [settings.GOOGLE_REDIRECT_URI],
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=str(request.user.id),
    )
    return Response({'auth_url': auth_url})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def google_callback(request):
    code = request.query_params.get('code')
    state = request.query_params.get('state')

    flow = Flow.from_client_config(
        {
            'web': {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uris': [settings.GOOGLE_REDIRECT_URI],
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
            }
        },
        scopes=SCOPES,
        state=state,
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    flow.fetch_token(code=code)

    credentials = flow.credentials
    from accounts.models import User
    try:
        user = User.objects.get(id=state)
    except User.DoesNotExist:
        return Response({'error': 'Invalid state'}, status=400)

    GoogleCalendarToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token or '',
            'token_expiry': credentials.expiry,
        }
    )
    return redirect(f"{settings.FRONTEND_URL}/settings/integrations?google=connected")


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def google_disconnect(request):
    GoogleCalendarToken.objects.filter(user=request.user).delete()
    return Response({'message': 'Google Calendar disconnected'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def google_status(request):
    connected = GoogleCalendarToken.objects.filter(user=request.user).exists()
    return Response({'connected': connected})


class WebhookSubscriptionViewSet(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WebhookSubscriptionSerializer

    def get_queryset(self):
        return WebhookSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def fire_webhooks(user, event: str, payload: dict):
    subs = WebhookSubscription.objects.filter(user=user, event=event, is_active=True)
    for sub in subs:
        try:
            requests.post(sub.url, json=payload, timeout=5)
        except Exception:
            pass
