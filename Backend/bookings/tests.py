from rest_framework.test import APITestCase, APIClient
from datetime import date, timedelta
from .models import Booking
from events.models import EventType, Availability
from accounts.models import User


class BookingTests(APITestCase):
    def setUp(self):
        self.client = APIClient(SERVER_NAME='localhost')
        from django.utils import timezone
        self.host = User.objects.create_user(
            email='host@test.com', username='host', password='testpass123',
            timezone='America/New_York',
            trial_started_at=timezone.now(),
        )
        self.event_type = EventType.objects.create(
            host=self.host, name='Test Call', slug='test-call',
            duration=30, location_type='zoom'
        )
        Availability.objects.create(
            user=self.host, weekday=0, start_time='09:00', end_time='17:00'
        )
        # Login for protected endpoints
        resp = self.client.post('/api/auth/login/', {
            'email': 'host@test.com', 'password': 'testpass123'
        }, format='json')
        self.token = resp.data['access']

        # Get a valid slot
        today = date.today()
        days_ahead = (0 - today.weekday()) % 7
        self.next_monday = today + timedelta(days=days_ahead if days_ahead > 0 else 7)
        resp = self.client.get(
            f'/api/events/public/host/event-types/{self.event_type.id}/slots/?date={self.next_monday.isoformat()}'
        )
        self.slots = resp.data.get('slots', [])

    def test_create_booking(self):
        if not self.slots:
            self.skipTest('No available slots')
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane Doe',
            'invitee_email': 'jane@example.com',
            'start_datetime': self.slots[0]['start'],
            'invitee_timezone': 'America/Chicago',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['status'], 'confirmed')
        self.assertIn('cancel_token', resp.data)

    def test_create_booking_invalid_event_type(self):
        resp = self.client.post('/api/bookings/', {
            'event_type_id': '00000000-0000-0000-0000-000000000000',
            'invitee_name': 'Jane Doe',
            'invitee_email': 'jane@example.com',
            'start_datetime': '2026-05-20T14:00:00+00:00',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_create_booking_invalid_slot(self):
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane Doe',
            'invitee_email': 'jane@example.com',
            'start_datetime': '2026-05-20T14:00:00+00:00',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_host_bookings_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        resp = self.client.get('/api/bookings/my/')
        self.assertEqual(resp.status_code, 200)

    def test_host_booking_detail(self):
        if not self.slots:
            self.skipTest('No available slots')
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane',
            'invitee_email': 'jane@test.com',
            'start_datetime': self.slots[0]['start'],
            'invitee_timezone': 'UTC',
        }, format='json')
        booking_id = resp.data['id']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        resp = self.client.get(f'/api/bookings/{booking_id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['invitee_name'], 'Jane')

    def test_cancel_booking(self):
        if not self.slots:
            self.skipTest('No available slots')
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane',
            'invitee_email': 'jane@test.com',
            'start_datetime': self.slots[0]['start'],
            'invitee_timezone': 'UTC',
        }, format='json')
        booking_id = resp.data['id']
        cancel_token = resp.data['cancel_token']
        resp = self.client.post(f'/api/bookings/{booking_id}/cancel/', {
            'token': str(cancel_token)
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['message'], 'Booking cancelled successfully')

    def test_cancel_already_cancelled(self):
        if not self.slots:
            self.skipTest('No available slots')
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane',
            'invitee_email': 'jane@test.com',
            'start_datetime': self.slots[0]['start'],
            'invitee_timezone': 'UTC',
        }, format='json')
        booking_id = resp.data['id']
        cancel_token = resp.data['cancel_token']
        self.client.post(f'/api/bookings/{booking_id}/cancel/', {
            'token': str(cancel_token)
        }, format='json')
        resp = self.client.post(f'/api/bookings/{booking_id}/cancel/', {
            'token': str(cancel_token)
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_cancel_invalid_token(self):
        if not self.slots:
            self.skipTest('No available slots')
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane',
            'invitee_email': 'jane@test.com',
            'start_datetime': self.slots[0]['start'],
            'invitee_timezone': 'UTC',
        }, format='json')
        booking_id = resp.data['id']
        resp = self.client.post(f'/api/bookings/{booking_id}/cancel/', {
            'token': 'bad-token'
        }, format='json')
        self.assertEqual(resp.status_code, 403)


class PaidBookingTests(APITestCase):
    def setUp(self):
        self.client = APIClient(SERVER_NAME='localhost')
        self.host = User.objects.create_user(
            email='host@test.com', username='host', password='testpass123'
        )
        self.event_type = EventType.objects.create(
            host=self.host, name='Paid Call', slug='paid-call',
            duration=60, location_type='zoom',
            price='99.00', currency='INR'
        )
        Availability.objects.create(
            user=self.host, weekday=0, start_time='09:00', end_time='17:00'
        )

    def test_paid_booking_requires_payment(self):
        today = date.today()
        days_ahead = (0 - today.weekday()) % 7
        next_monday = today + timedelta(days=days_ahead if days_ahead > 0 else 7)
        resp = self.client.get(
            f'/api/events/public/host/event-types/{self.event_type.id}/slots/?date={next_monday.isoformat()}'
        )
        slots = resp.data.get('slots', [])
        if not slots:
            self.skipTest('No available slots')
        resp = self.client.post('/api/bookings/', {
            'event_type_id': str(self.event_type.id),
            'invitee_name': 'Jane',
            'invitee_email': 'jane@test.com',
            'start_datetime': slots[0]['start'],
            'invitee_timezone': 'UTC',
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['requires_payment'])
        self.assertEqual(resp.data['price'], '99.00')
