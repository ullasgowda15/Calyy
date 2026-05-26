import pytest
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock


class TestFreeBookingCreation:

    @patch('bookings.views.send_booking_confirmation.delay')
    def test_create_free_booking_success(self, mock_task, anon_client,
                                          free_event_type, full_week_availability,
                                          future_monday):
        res = anon_client.post('/api/bookings/', {
            'event_type_id': str(free_event_type.id),
            'invitee_name': 'Jane Doe',
            'invitee_email': 'jane@test.com',
            'invitee_timezone': 'UTC',
            'start_datetime': future_monday.isoformat(),
            'notes': 'Looking forward to it',
        })
        assert res.status_code == 201
        assert res.data['status'] == 'confirmed'
        assert res.data['invitee_name'] == 'Jane Doe'
        assert res.data['invitee_email'] == 'jane@test.com'
        assert mock_task.called

    @patch('bookings.views.send_booking_confirmation.delay')
    def test_create_booking_slot_taken(self, mock_task, anon_client,
                                        free_event_type, full_week_availability,
                                        confirmed_booking, future_monday):
        res = anon_client.post('/api/bookings/', {
            'event_type_id': str(free_event_type.id),
            'invitee_name': 'Another Person',
            'invitee_email': 'another@test.com',
            'invitee_timezone': 'UTC',
            'start_datetime': future_monday.isoformat(),
        })
        assert res.status_code in [400, 409]

    def test_create_booking_invalid_event_type(self, anon_client, db, future_monday):
        res = anon_client.post('/api/bookings/', {
            'event_type_id': '00000000-0000-0000-0000-000000000000',
            'invitee_name': 'Jane Doe',
            'invitee_email': 'jane@test.com',
            'start_datetime': future_monday.isoformat(),
        })
        assert res.status_code == 400

    def test_create_booking_inactive_event_type(self, anon_client, inactive_event_type,
                                                  full_week_availability, future_monday):
        res = anon_client.post('/api/bookings/', {
            'event_type_id': str(inactive_event_type.id),
            'invitee_name': 'Jane Doe',
            'invitee_email': 'jane@test.com',
            'start_datetime': future_monday.isoformat(),
        })
        assert res.status_code == 400

    def test_create_booking_missing_required_fields(self, anon_client,
                                                      free_event_type,
                                                      full_week_availability):
        res = anon_client.post('/api/bookings/', {
            'event_type_id': str(free_event_type.id),
        })
        assert res.status_code == 400

    def test_create_paid_booking_returns_requires_payment(self, anon_client,
                                                            paid_event_type,
                                                            full_week_availability,
                                                            future_monday):
        res = anon_client.post('/api/bookings/', {
            'event_type_id': str(paid_event_type.id),
            'invitee_name': 'John Smith',
            'invitee_email': 'john@test.com',
            'invitee_timezone': 'UTC',
            'start_datetime': (future_monday + timedelta(hours=2)).isoformat(),
        })
        assert res.status_code == 201
        assert res.data.get('status') == 'confirmed'
        assert 'event_type_price' in res.data
        assert 'requires_payment' not in res.data


class TestBookingCancellation:

    @patch('bookings.views.send_cancellation_email.delay')
    def test_cancel_booking_valid_token(self, mock_task, anon_client, confirmed_booking):
        res = anon_client.post(
            f'/api/bookings/{confirmed_booking.id}/cancel/',
            {'token': str(confirmed_booking.cancel_token)}
        )
        assert res.status_code == 200
        confirmed_booking.refresh_from_db()
        assert confirmed_booking.status == 'cancelled'
        assert mock_task.called

    def test_cancel_booking_invalid_token(self, anon_client, confirmed_booking):
        res = anon_client.post(
            f'/api/bookings/{confirmed_booking.id}/cancel/',
            {'token': '00000000-0000-0000-0000-000000000000'}
        )
        assert res.status_code == 403

    @patch('bookings.views.send_cancellation_email.delay')
    def test_cancel_already_cancelled_booking(self, mock_task, anon_client,
                                               confirmed_booking):
        confirmed_booking.status = 'cancelled'
        confirmed_booking.save()
        res = anon_client.post(
            f'/api/bookings/{confirmed_booking.id}/cancel/',
            {'token': str(confirmed_booking.cancel_token)}
        )
        assert res.status_code == 400


class TestHostBookingList:

    def test_host_sees_own_bookings(self, auth_client, confirmed_booking):
        res = auth_client.get('/api/bookings/my/')
        assert res.status_code == 200
        assert len(res.data) >= 1

    def test_host_cannot_see_other_bookings(self, second_auth_client, confirmed_booking):
        res = second_auth_client.get('/api/bookings/my/')
        assert res.status_code == 200
        assert len(res.data) == 0

    def test_unauthenticated_cannot_see_bookings(self, anon_client, confirmed_booking):
        res = anon_client.get('/api/bookings/my/')
        assert res.status_code == 401

    def test_booking_list_hides_cancel_token(self, auth_client, confirmed_booking):
        res = auth_client.get('/api/bookings/my/')
        assert res.status_code == 200
        assert len(res.data) > 0
        assert 'cancel_token' not in res.data[0]

    def test_booking_detail_shows_cancel_token(self, auth_client, confirmed_booking):
        res = auth_client.get(f'/api/bookings/{confirmed_booking.id}/')
        assert res.status_code == 200
        assert 'cancel_token' in res.data


class TestBookingStatusUpdate:

    def test_mark_booking_completed(self, auth_client, confirmed_booking):
        res = auth_client.patch(
            f'/api/bookings/{confirmed_booking.id}/status/',
            {'status': 'completed'}
        )
        assert res.status_code == 200
        assert res.data['status'] == 'completed'

    def test_mark_booking_no_show(self, auth_client, confirmed_booking):
        res = auth_client.patch(
            f'/api/bookings/{confirmed_booking.id}/status/',
            {'status': 'no_show'}
        )
        assert res.status_code == 200
        assert res.data['status'] == 'no_show'

    def test_invalid_status_value(self, auth_client, confirmed_booking):
        res = auth_client.patch(
            f'/api/bookings/{confirmed_booking.id}/status/',
            {'status': 'flying'}
        )
        assert res.status_code == 400

    def test_cannot_update_other_hosts_booking(self, second_auth_client, confirmed_booking):
        res = second_auth_client.patch(
            f'/api/bookings/{confirmed_booking.id}/status/',
            {'status': 'completed'}
        )
        assert res.status_code == 404


class TestRescheduling:

    @patch('bookings.views.send_booking_confirmation.delay')
    def test_reschedule_to_valid_slot(self, mock_task, anon_client,
                                      confirmed_booking, full_week_availability,
                                      future_monday):
        new_slot = future_monday + timedelta(hours=3)
        res = anon_client.post(
            f'/api/bookings/reschedule/{confirmed_booking.reschedule_token}/',
            {'start_datetime': new_slot.isoformat()}
        )
        assert res.status_code == 200
        confirmed_booking.refresh_from_db()
        assert confirmed_booking.start_datetime.hour == new_slot.hour

    def test_reschedule_cancelled_booking_fails(self, anon_client, confirmed_booking):
        confirmed_booking.status = 'cancelled'
        confirmed_booking.save()
        res = anon_client.post(
            f'/api/bookings/reschedule/{confirmed_booking.reschedule_token}/',
            {'start_datetime': (confirmed_booking.start_datetime + timedelta(hours=2)).isoformat()}
        )
        assert res.status_code == 400

    def test_reschedule_missing_datetime(self, anon_client, confirmed_booking):
        res = anon_client.post(
            f'/api/bookings/reschedule/{confirmed_booking.reschedule_token}/',
            {}
        )
        assert res.status_code == 400


class TestDoubleBookingPrevention:

    @patch('bookings.views.send_booking_confirmation.delay')
    def test_concurrent_booking_same_slot(self, mock_task, anon_client,
                                           free_event_type, full_week_availability,
                                           future_monday):
        payload = {
            'event_type_id': str(free_event_type.id),
            'invitee_name': 'Person One',
            'invitee_email': 'one@test.com',
            'invitee_timezone': 'UTC',
            'start_datetime': future_monday.isoformat(),
        }
        res1 = anon_client.post('/api/bookings/', payload)
        assert res1.status_code == 201

        payload['invitee_name'] = 'Person Two'
        payload['invitee_email'] = 'two@test.com'
        res2 = anon_client.post('/api/bookings/', payload)
        assert res2.status_code in [400, 409]
