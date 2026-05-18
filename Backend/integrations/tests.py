from rest_framework.test import APITestCase, APIClient
from .models import WebhookSubscription
from accounts.models import User


class GoogleCalendarTests(APITestCase):
    def setUp(self):
        self.client = APIClient(SERVER_NAME='localhost')
        self.user = User.objects.create_user(
            email='host@test.com', username='host', password='testpass123'
        )
        resp = self.client.post('/api/auth/login/', {
            'email': 'host@test.com', 'password': 'testpass123'
        }, format='json')
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_google_status_not_connected(self):
        resp = self.client.get('/api/integrations/google/status/')
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data['connected'])

    def test_google_auth_url(self):
        resp = self.client.get('/api/integrations/google/auth/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('auth_url', resp.data)

    def test_google_disconnect_no_token(self):
        resp = self.client.delete('/api/integrations/google/disconnect/')
        self.assertEqual(resp.status_code, 200)


class WebhookTests(APITestCase):
    def setUp(self):
        self.client = APIClient(SERVER_NAME='localhost')
        self.user = User.objects.create_user(
            email='host@test.com', username='host', password='testpass123'
        )
        resp = self.client.post('/api/auth/login/', {
            'email': 'host@test.com', 'password': 'testpass123'
        }, format='json')
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_webhook(self):
        resp = self.client.post('/api/integrations/webhooks/', {
            'url': 'https://hooks.example.com/calendly',
            'event': 'booking.created',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['event'], 'booking.created')

    def test_list_webhooks(self):
        WebhookSubscription.objects.create(
            user=self.user, url='https://hooks.example.com/cal',
            event='booking.created'
        )
        resp = self.client.get('/api/integrations/webhooks/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_create_webhook_invalid_event(self):
        resp = self.client.post('/api/integrations/webhooks/', {
            'url': 'https://hooks.example.com/calendly',
            'event': 'invalid.event',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_webhook_isolation(self):
        other_user = User.objects.create_user(
            email='other@test.com', username='other', password='testpass123'
        )
        WebhookSubscription.objects.create(
            user=other_user, url='https://other.example.com/cal',
            event='booking.created'
        )
        resp = self.client.get('/api/integrations/webhooks/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)
