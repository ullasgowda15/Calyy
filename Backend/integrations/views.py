import json
import requests
import secrets
from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
from google_auth_oauthlib.flow import Flow
from .models import GoogleCalendarToken, WebhookSubscription
from .serializers import WebhookSubscriptionSerializer
from bookings.tasks import sync_google_calendar_event

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
]


def _make_flow(state=None):
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
    return flow


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def google_auth_url(request):
    flow = _make_flow(state=str(request.user.id))
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    request.session['google_code_verifier'] = flow.code_verifier
    return Response({'auth_url': auth_url})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def google_register_url(request):
    nonce = secrets.token_urlsafe(32)
    flow = _make_flow(state=f'register:{nonce}')
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    request.session['google_code_verifier'] = flow.code_verifier
    request.session['google_register_nonce'] = nonce
    return Response({'auth_url': auth_url})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', method='GET')
def google_callback(request):
    code = request.query_params.get('code')
    state = request.query_params.get('state', '')
    error = request.query_params.get('error')

    if error:
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        return redirect(f'{frontend_url}/login?error=google_auth_denied')

    code_verifier = request.session.pop('google_code_verifier', None)
    flow = _make_flow(state=state)

    try:
        flow.fetch_token(code=code, code_verifier=code_verifier)
    except Exception as e:
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        return redirect(f'{frontend_url}/login?error=google_auth_failed')

    credentials = flow.credentials

    from accounts.models import User

    if state.startswith('register:'):
        nonce = request.session.pop('google_register_nonce', None)
        reg_state = state[len('register:'):]
        if not nonce or nonce != reg_state:
            return Response({'error': 'Invalid state'}, status=400)

        userinfo_resp = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {credentials.token}'},
            timeout=10,
        )
        if userinfo_resp.status_code != 200:
            return Response({'error': 'Failed to fetch Google profile'}, status=400)
        userinfo = userinfo_resp.json()
        google_email = userinfo.get('email')
        if not google_email:
            return Response({'error': 'No email returned from Google'}, status=400)

        user = User.objects.filter(email=google_email).first()
        created = False
        if not user:
            base_username = google_email.split('@')[0].lower()[:30]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username}{counter}'
                counter += 1
            user = User.objects.create(
                email=google_email,
                username=username,
                password=secrets.token_urlsafe(32),
                timezone='UTC',
                bio='',
            )
            created = True

        GoogleCalendarToken.objects.update_or_create(
            user=user,
            defaults={
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token or '',
                'token_expiry': credentials.expiry,
            }
        )

        if not created:
            from bookings.models import Booking
            for booking in Booking.objects.filter(
                event_type__host=user,
                status__in=['confirmed', 'pending'],
            ).exclude(google_calendar_event_id__gt=''):
                sync_google_calendar_event.delay(str(booking.id))

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        params = urlencode({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'new_user': 'true' if created else 'false',
        })
        return redirect(f'{frontend_url}/auth/google-redirect?{params}')

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

    from bookings.models import Booking
    for booking in Booking.objects.filter(
        event_type__host=user,
        status__in=['confirmed', 'pending'],
    ).exclude(google_calendar_event_id__gt=''):
        sync_google_calendar_event.delay(str(booking.id))

    return redirect(f"{settings.FRONTEND_URL}/settings?google=connected")


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def google_disconnect(request):
    GoogleCalendarToken.objects.filter(user=request.user).delete()
    return Response({'message': 'Google Calendar disconnected'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def google_status(request):
    token = GoogleCalendarToken.objects.filter(user=request.user).first()
    return Response({'connected': bool(token)})


class WebhookSubscriptionViewSet(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WebhookSubscriptionSerializer

    def get_queryset(self):
        return WebhookSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


from bookings.tasks import sync_google_calendar_event
