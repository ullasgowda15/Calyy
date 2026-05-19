import pytest
import json
from unittest.mock import patch, MagicMock
from decimal import Decimal


class TestCreatePaymentIntent:

    @patch('payments.views.stripe.PaymentIntent.create')
    def test_create_intent_for_paid_event(self, mock_create,
                                           anon_client, paid_event_type,
                                           full_week_availability, future_monday):
        mock_create.return_value = MagicMock(
            client_secret='pi_test_secret_123',
            id='pi_test_123',
        )
        res = anon_client.post('/api/payments/create-intent/', {
            'event_type_id': str(paid_event_type.id),
            'booking_data': {
                'invitee_name': 'John',
                'invitee_email': 'john@test.com',
                'start_datetime': future_monday.isoformat(),
            }
        }, format='json')
        assert res.status_code == 200
        assert 'client_secret' in res.data
        assert 'publishable_key' in res.data

        call_kwargs = mock_create.call_args[1]
        assert call_kwargs['amount'] == 5000
        assert call_kwargs['currency'] == 'usd'

    def test_create_intent_for_free_event_fails(self, anon_client, free_event_type,
                                                  future_monday):
        res = anon_client.post('/api/payments/create-intent/', {
            'event_type_id': str(free_event_type.id),
            'booking_data': {}
        }, format='json')
        assert res.status_code == 400

    def test_create_intent_nonexistent_event_type(self, anon_client, db):
        res = anon_client.post('/api/payments/create-intent/', {
            'event_type_id': '00000000-0000-0000-0000-000000000000',
            'booking_data': {}
        }, format='json')
        assert res.status_code == 404


class TestStripeWebhook:

    @patch('payments.views.stripe.Webhook.construct_event')
    @patch('payments.views.send_booking_confirmation.delay')
    def test_webhook_payment_succeeded_creates_booking(
        self, mock_email, mock_construct,
        anon_client, paid_event_type, full_week_availability, future_monday
    ):
        from datetime import timedelta
        booking_data = {
            'event_type_id': str(paid_event_type.id),
            'invitee_name': 'Webhook User',
            'invitee_email': 'webhook@test.com',
            'invitee_timezone': 'UTC',
            'start_datetime': (future_monday + timedelta(hours=4)).isoformat(),
        }
        mock_construct.return_value = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_test_webhook_123',
                    'metadata': {
                        'event_type_id': str(paid_event_type.id),
                        'booking_data': json.dumps(booking_data),
                    }
                }
            }
        }
        res = anon_client.post(
            '/api/payments/webhook/',
            data=json.dumps({'type': 'payment_intent.succeeded'}),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        assert res.status_code == 200

        from bookings.models import Booking
        booking = Booking.objects.filter(
            stripe_payment_intent_id='pi_test_webhook_123'
        ).first()
        assert booking is not None
        assert booking.status == 'confirmed'
        assert booking.payment_status == 'paid'

    @patch('payments.views.stripe.Webhook.construct_event')
    def test_webhook_idempotent_duplicate_ignored(
        self, mock_construct,
        anon_client, paid_booking
    ):
        mock_construct.return_value = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_test_123456789',
                    'metadata': {
                        'event_type_id': str(paid_booking.event_type.id),
                        'booking_data': json.dumps({}),
                    }
                }
            }
        }
        from bookings.models import Booking
        count_before = Booking.objects.count()

        anon_client.post(
            '/api/payments/webhook/',
            data=json.dumps({}),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        assert Booking.objects.count() == count_before

    def test_webhook_invalid_signature_rejected(self, anon_client, db):
        res = anon_client.post(
            '/api/payments/webhook/',
            data=json.dumps({'type': 'test'}),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='bad_sig',
        )
        assert res.status_code == 400


class TestRefund:

    @patch('payments.views.stripe.Refund.create')
    @patch('payments.views.send_cancellation_email.delay')
    def test_refund_paid_booking(self, mock_email, mock_refund,
                                  auth_client, paid_booking):
        mock_refund.return_value = MagicMock(id='re_test_123')
        res = auth_client.post(f'/api/payments/{paid_booking.id}/refund/')
        assert res.status_code == 200
        paid_booking.refresh_from_db()
        assert paid_booking.payment_status == 'refunded'
        assert paid_booking.status == 'cancelled'
        assert mock_email.called

    def test_refund_unpaid_booking_fails(self, auth_client, confirmed_booking):
        res = auth_client.post(f'/api/payments/{confirmed_booking.id}/refund/')
        assert res.status_code == 400

    def test_refund_unauthenticated(self, anon_client, paid_booking):
        res = anon_client.post(f'/api/payments/{paid_booking.id}/refund/')
        assert res.status_code == 401

    def test_cannot_refund_other_hosts_booking(self, second_auth_client, paid_booking):
        res = second_auth_client.post(f'/api/payments/{paid_booking.id}/refund/')
        assert res.status_code == 404
