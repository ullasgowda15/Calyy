from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from datetime import date, timedelta
from .models import EventType, Availability, BlockedTime
from accounts.models import User


class EventTypeTests(APITestCase):
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

    def test_create_event_type(self):
        resp = self.client.post('/api/events/event-types/', {
            'name': 'Test Meeting', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['slug'], 'test-meeting')
        self.assertEqual(resp.data['host_username'], 'host')

    def test_create_event_type_with_custom_slug(self):
        resp = self.client.post('/api/events/event-types/', {
            'name': 'Test Meeting', 'slug': 'my-custom-slug', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['slug'], 'my-custom-slug')

    def test_list_event_types(self):
        self.client.post('/api/events/event-types/', {
            'name': 'Meeting 1', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        resp = self.client.get('/api/events/event-types/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_get_event_type(self):
        resp = self.client.post('/api/events/event-types/', {
            'name': 'Meeting', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        et_id = resp.data['id']
        resp = self.client.get(f'/api/events/event-types/{et_id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['name'], 'Meeting')

    def test_update_event_type(self):
        resp = self.client.post('/api/events/event-types/', {
            'name': 'Meeting', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        et_id = resp.data['id']
        resp = self.client.patch(f'/api/events/event-types/{et_id}/', {
            'description': 'Updated'
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['description'], 'Updated')

    def test_delete_event_type(self):
        resp = self.client.post('/api/events/event-types/', {
            'name': 'Meeting', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        et_id = resp.data['id']
        resp = self.client.delete(f'/api/events/event-types/{et_id}/')
        self.assertEqual(resp.status_code, 204)

    def test_booking_url(self):
        resp = self.client.post('/api/events/event-types/', {
            'name': 'Meeting', 'duration': 30, 'location_type': 'zoom'
        }, format='json')
        self.assertIn('/book/host/meeting/', resp.data['booking_url'])

    def test_unauthenticated_access(self):
        self.client.credentials()
        resp = self.client.get('/api/events/event-types/')
        self.assertEqual(resp.status_code, 401)


class AvailabilityTests(APITestCase):
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

    def test_create_availability(self):
        resp = self.client.post('/api/events/availability/', {
            'weekday': 0, 'start_time': '09:00', 'end_time': '17:00'
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['weekday'], 0)

    def test_list_availability(self):
        self.client.post('/api/events/availability/', {
            'weekday': 0, 'start_time': '09:00', 'end_time': '17:00'
        }, format='json')
        resp = self.client.get('/api/events/availability/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_delete_availability(self):
        resp = self.client.post('/api/events/availability/', {
            'weekday': 0, 'start_time': '09:00', 'end_time': '17:00'
        }, format='json')
        avail_id = resp.data['id']
        resp = self.client.delete(f'/api/events/availability/{avail_id}/')
        self.assertEqual(resp.status_code, 204)


class BlockedTimeTests(APITestCase):
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

    def test_create_blocked_time(self):
        resp = self.client.post('/api/events/blocked-times/', {
            'start_datetime': '2026-06-01T10:00:00Z',
            'end_datetime': '2026-06-01T11:00:00Z',
            'reason': 'Lunch'
        }, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_list_blocked_times(self):
        self.client.post('/api/events/blocked-times/', {
            'start_datetime': '2026-06-01T10:00:00Z',
            'end_datetime': '2026-06-01T11:00:00Z',
        }, format='json')
        resp = self.client.get('/api/events/blocked-times/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)


class PublicEventTests(APITestCase):
    def setUp(self):
        self.client = APIClient(SERVER_NAME='localhost')
        from django.utils import timezone
        self.user = User.objects.create_user(
            email='host@test.com', username='host', password='testpass123',
            timezone='America/New_York',
            trial_started_at=timezone.now(),
        )
        self.event_type = EventType.objects.create(
            host=self.user, name='Public Meeting', slug='public-meeting',
            duration=30, location_type='zoom'
        )
        Availability.objects.create(
            user=self.user, weekday=0, start_time='09:00', end_time='17:00'
        )

    def test_public_event_type_list(self):
        resp = self.client.get('/api/events/public/host/event-types/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['slug'], 'public-meeting')

    def test_public_event_type_detail(self):
        resp = self.client.get(f'/api/events/public/host/event-types/{self.event_type.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['name'], 'Public Meeting')

    def test_public_slots(self):
        today = date.today()
        days_ahead = (0 - today.weekday()) % 7
        next_monday = today + timedelta(days=days_ahead if days_ahead > 0 else 7)
        resp = self.client.get(
            f'/api/events/public/host/event-types/{self.event_type.id}/slots/?date={next_monday.isoformat()}'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertGreater(len(resp.data['slots']), 0)

    def test_public_slots_inactive_event(self):
        self.event_type.is_active = False
        self.event_type.save()
        today = date.today()
        days_ahead = (0 - today.weekday()) % 7
        next_monday = today + timedelta(days=days_ahead if days_ahead > 0 else 7)
        resp = self.client.get(
            f'/api/events/public/host/event-types/{self.event_type.id}/slots/?date={next_monday.isoformat()}'
        )
        self.assertEqual(resp.status_code, 404)

    def test_public_slots_missing_date(self):
        resp = self.client.get(
            f'/api/events/public/host/event-types/{self.event_type.id}/slots/'
        )
        self.assertEqual(resp.status_code, 400)
