import pytest
from unittest.mock import patch, MagicMock


class TestWebhookSubscriptions:

    def test_create_webhook_subscription(self, auth_client, host_user):
        res = auth_client.post('/api/integrations/webhooks/', {
            'url': 'https://hooks.zapier.com/hooks/catch/test/123/',
            'event': 'booking.created',
        })
        assert res.status_code == 201
        assert res.data['url'] == 'https://hooks.zapier.com/hooks/catch/test/123/'
        assert res.data['event'] == 'booking.created'

    def test_list_webhooks(self, auth_client, host_user):
        auth_client.post('/api/integrations/webhooks/', {
            'url': 'https://example.com/hook/',
            'event': 'booking.created',
        })
        res = auth_client.get('/api/integrations/webhooks/')
        assert res.status_code == 200
        assert len(res.data) >= 1

    def test_unauthenticated_cannot_create_webhook(self, anon_client, db):
        res = anon_client.post('/api/integrations/webhooks/', {
            'url': 'https://example.com/hook/',
            'event': 'booking.created',
        })
        assert res.status_code == 401


class TestGoogleCalendarStatus:

    def test_google_status_not_connected(self, auth_client, host_user):
        res = auth_client.get('/api/integrations/google/status/')
        assert res.status_code == 200
        assert res.data['connected'] is False

    def test_google_status_connected(self, auth_client, host_user):
        from integrations.models import GoogleCalendarToken
        from django.utils import timezone
        import datetime
        GoogleCalendarToken.objects.create(
            user=host_user,
            access_token='test_access',
            refresh_token='test_refresh',
            token_expiry=timezone.now() + datetime.timedelta(hours=1),
        )
        res = auth_client.get('/api/integrations/google/status/')
        assert res.status_code == 200
        assert res.data['connected'] is True

    def test_google_auth_url_returned(self, auth_client, host_user):
        res = auth_client.get('/api/integrations/google/auth/')
        assert res.status_code == 200
        assert 'auth_url' in res.data
        assert 'accounts.google.com' in res.data['auth_url']
