import pytest
from datetime import time, timedelta, date
from django.utils import timezone
import pytz


class TestEventTypeCRUD:

    def test_create_event_type(self, auth_client, host_user):
        res = auth_client.post('/api/events/event-types/', {
            'name': 'My Meeting',
            'duration': 30,
            'location_type': 'zoom',
            'min_notice': 60,
            'max_advance_days': 30,
        })
        assert res.status_code == 201
        assert res.data['name'] == 'My Meeting'
        assert res.data['slug'] == 'my-meeting'
        assert res.data['host'] == str(host_user.id)

    def test_create_event_type_unauthenticated(self, anon_client, db):
        res = anon_client.post('/api/events/event-types/', {
            'name': 'Hack attempt',
            'duration': 30,
        })
        assert res.status_code == 401

    def test_list_event_types_own_only(self, auth_client, second_auth_client,
                                       free_event_type, second_user):
        from events.models import EventType
        EventType.objects.create(
            host=second_user,
            name='Other Event',
            slug='other-event',
            duration=30,
            location_type='zoom',
            min_notice=0,
            max_advance_days=30,
        )
        res = auth_client.get('/api/events/event-types/')
        assert res.status_code == 200
        ids = [et['id'] for et in res.data]
        assert str(free_event_type.id) in ids
        for et in res.data:
            assert et['host'] == str(free_event_type.host.id)

    def test_update_event_type(self, auth_client, free_event_type):
        res = auth_client.patch(f'/api/events/event-types/{free_event_type.id}/', {
            'name': 'Updated Name',
            'duration': 45,
        })
        assert res.status_code == 200
        assert res.data['name'] == 'Updated Name'
        assert res.data['duration'] == 45

    def test_cannot_update_other_hosts_event_type(self, second_auth_client, free_event_type):
        res = second_auth_client.patch(f'/api/events/event-types/{free_event_type.id}/', {
            'name': 'Hacked',
        })
        assert res.status_code == 404

    def test_delete_event_type(self, auth_client, free_event_type):
        res = auth_client.delete(f'/api/events/event-types/{free_event_type.id}/')
        assert res.status_code == 204

    def test_toggle_inactive(self, auth_client, free_event_type):
        res = auth_client.patch(f'/api/events/event-types/{free_event_type.id}/', {
            'is_active': False,
        })
        assert res.status_code == 200
        assert res.data['is_active'] is False


class TestPublicEventTypes:

    def test_list_public_event_types(self, anon_client, host_user, free_event_type):
        res = anon_client.get('/api/events/public/testhost/event-types/')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['name'] == 'Free 30 Min Call'

    def test_inactive_event_type_not_in_public_list(self, anon_client, host_user,
                                                      free_event_type, inactive_event_type):
        res = anon_client.get('/api/events/public/testhost/event-types/')
        assert res.status_code == 200
        names = [et['name'] for et in res.data]
        assert 'Inactive Event' not in names

    def test_unknown_host_public_list(self, anon_client, db):
        res = anon_client.get('/api/events/public/unknownhost/event-types/')
        assert res.status_code == 404


class TestAvailability:

    def test_create_availability(self, auth_client, host_user):
        res = auth_client.post('/api/events/availability/', {
            'weekday': 0,
            'start_time': '09:00:00',
            'end_time': '17:00:00',
        })
        assert res.status_code == 201
        assert res.data['weekday'] == 0

    def test_list_availability(self, auth_client, full_week_availability):
        res = auth_client.get('/api/events/availability/')
        assert res.status_code == 200
        assert len(res.data) == 5

    def test_delete_availability(self, auth_client, monday_availability):
        res = auth_client.delete(f'/api/events/availability/{monday_availability.id}/')
        assert res.status_code == 204

    def test_cannot_see_other_hosts_availability(self, second_auth_client, full_week_availability):
        res = second_auth_client.get('/api/events/availability/')
        assert res.status_code == 200
        assert len(res.data) == 0


class TestAvailabilityEngine:

    def test_slots_returned_on_available_day(self, anon_client, free_event_type,
                                              full_week_availability, future_monday):
        target_date = future_monday.date().isoformat()
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{free_event_type.id}/slots/'
            f'?date={target_date}'
        )
        assert res.status_code == 200
        assert len(res.data['slots']) > 0

    def test_no_slots_on_unavailable_day(self, anon_client, free_event_type,
                                          monday_availability, future_monday):
        next_saturday = future_monday + timedelta(days=5)
        while next_saturday.weekday() != 5:
            next_saturday += timedelta(days=1)
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{free_event_type.id}/slots/'
            f'?date={next_saturday.date().isoformat()}'
        )
        assert res.status_code == 200
        assert res.data['slots'] == []

    def test_slot_blocked_by_existing_booking(self, anon_client, free_event_type,
                                               full_week_availability,
                                               confirmed_booking, future_monday):
        target_date = future_monday.date().isoformat()
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{free_event_type.id}/slots/'
            f'?date={target_date}'
        )
        assert res.status_code == 200
        slot_starts = [s['start'] for s in res.data['slots']]
        booked_start = confirmed_booking.start_datetime.isoformat()
        assert booked_start not in slot_starts

    def test_slots_require_date_param(self, anon_client, free_event_type):
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{free_event_type.id}/slots/'
        )
        assert res.status_code == 400

    def test_slots_invalid_date_format(self, anon_client, free_event_type):
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{free_event_type.id}/slots/'
            f'?date=not-a-date'
        )
        assert res.status_code == 400

    def test_buffer_after_blocks_adjacent_slot(self, anon_client, host_user,
                                                full_week_availability,
                                                confirmed_booking, future_monday):
        from events.models import EventType
        from bookings.models import Booking
        from datetime import timedelta

        event_with_buffer = EventType.objects.create(
            host=host_user,
            name='Buffered Event',
            slug='buffered-event',
            duration=30,
            location_type='zoom',
            buffer_before=0,
            buffer_after=30,
            min_notice=0,
            max_advance_days=60,
            is_active=True,
        )
        target_date = future_monday.date().isoformat()
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{event_with_buffer.id}/slots/'
            f'?date={target_date}'
        )
        assert res.status_code == 200
        slot_starts = [s['start'] for s in res.data['slots']]
        blocked_slot = (future_monday + timedelta(minutes=30)).isoformat()
        assert blocked_slot not in slot_starts

    def test_inactive_event_type_has_no_public_slots(self, anon_client,
                                                       inactive_event_type,
                                                       full_week_availability,
                                                       future_monday):
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{inactive_event_type.id}/slots/'
            f'?date={future_monday.date().isoformat()}'
        )
        assert res.status_code == 404

    def test_max_advance_days_blocks_far_future(self, anon_client, host_user,
                                                 full_week_availability):
        from events.models import EventType
        from datetime import timedelta

        restricted_event = EventType.objects.create(
            host=host_user,
            name='Restricted Event',
            slug='restricted-event',
            duration=30,
            location_type='zoom',
            min_notice=0,
            max_advance_days=1,
            is_active=True,
        )
        far_future = (timezone.now() + timedelta(days=10)).date().isoformat()
        res = anon_client.get(
            f'/api/events/public/testhost/event-types/{restricted_event.id}/slots/'
            f'?date={far_future}'
        )
        assert res.status_code == 200
        assert res.data['slots'] == []
