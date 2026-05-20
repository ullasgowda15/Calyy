import pytest
import json
import hmac
import hashlib
from unittest.mock import patch, MagicMock
from django.conf import settings
from datetime import timedelta


def make_razorpay_signature(order_id, payment_id, secret):
    message = f'{order_id}|{payment_id}'
    return hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def make_webhook_signature(payload_bytes, secret):
    return hmac.new(
        secret.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()


class TestCreateRazorpayOrder:

    @patch('payments.views.razorpay.Client')
    def test_create_order_for_paid_event(self, mock_client_class,
                                          anon_client, paid_event_type,
                                          full_week_availability, future_monday):
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.order.create.return_value = {
            'id': 'order_test_123',
            'amount': 5000,
            'currency': 'INR',
        }

        res = anon_client.post('/api/payments/create-order/', {
            'event_type_id': str(paid_event_type.id),
            'booking_data': {
                'invitee_name': 'Test User',
                'invitee_email': 'test@test.com',
                'start_datetime': future_monday.isoformat(),
            }
        }, format='json')

        assert res.status_code == 200
        assert 'order_id' in res.data
        assert 'key_id' in res.data
        assert res.data['order_id'] == 'order_test_123'

        call_args = mock_client.order.create.call_args[0][0]
        assert call_args['amount'] == 5000

    def test_create_order_for_free_event_fails(self, anon_client, free_event_type):
        res = anon_client.post('/api/payments/create-order/', {
            'event_type_id': str(free_event_type.id),
            'booking_data': {}
        }, format='json')
        assert res.status_code == 400

    def test_create_order_nonexistent_event_type(self, anon_client, db):
        res = anon_client.post('/api/payments/create-order/', {
            'event_type_id': '00000000-0000-0000-0000-000000000000',
            'booking_data': {}
        }, format='json')
        assert res.status_code == 404

    def test_create_order_missing_event_type_id(self, anon_client, db):
        res = anon_client.post('/api/payments/create-order/', {
            'booking_data': {}
        }, format='json')
        assert res.status_code == 400


class TestVerifyPayment:

    @patch('bookings.views.send_booking_confirmation.delay')
    def test_verify_payment_valid_signature_creates_booking(
        self, mock_email,
        anon_client, paid_event_type, full_week_availability, future_monday
    ):
        order_id = 'order_test_abc'
        payment_id = 'pay_test_xyz'
        signature = make_razorpay_signature(
            order_id, payment_id, settings.RAZORPAY_KEY_SECRET
        )

        res = anon_client.post('/api/payments/verify/', {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature,
            'event_type_id': str(paid_event_type.id),
            'booking_data': {
                'invitee_name': 'Paid User',
                'invitee_email': 'paid@test.com',
                'invitee_timezone': 'UTC',
                'start_datetime': (future_monday + timedelta(hours=5)).isoformat(),
            }
        }, format='json')

        assert res.status_code == 201
        assert res.data['status'] == 'confirmed'
        assert res.data['payment_status'] == 'paid'

        from bookings.models import Booking
        booking = Booking.objects.get(id=res.data['id'])
        assert booking.razorpay_payment_id == payment_id
        assert booking.razorpay_order_id == order_id

    def test_verify_payment_invalid_signature_rejected(
        self, anon_client, paid_event_type, full_week_availability, future_monday
    ):
        res = anon_client.post('/api/payments/verify/', {
            'razorpay_order_id': 'order_test_abc',
            'razorpay_payment_id': 'pay_test_xyz',
            'razorpay_signature': 'completely_wrong_signature',
            'event_type_id': str(paid_event_type.id),
            'booking_data': {}
        }, format='json')

        assert res.status_code == 400

        from bookings.models import Booking
        assert not Booking.objects.filter(razorpay_payment_id='pay_test_xyz').exists()

    @patch('bookings.views.send_booking_confirmation.delay')
    def test_verify_payment_idempotent(
        self, mock_email,
        anon_client, paid_booking
    ):
        order_id = paid_booking.razorpay_order_id or 'order_test_dup'
        payment_id = paid_booking.razorpay_payment_id
        signature = make_razorpay_signature(
            order_id, payment_id, settings.RAZORPAY_KEY_SECRET
        )

        from bookings.models import Booking
        count_before = Booking.objects.count()

        res = anon_client.post('/api/payments/verify/', {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature,
            'event_type_id': str(paid_booking.event_type.id),
            'booking_data': {}
        }, format='json')

        assert res.status_code == 200
        assert Booking.objects.count() == count_before

    def test_verify_payment_missing_fields(self, anon_client, db):
        res = anon_client.post('/api/payments/verify/', {
            'razorpay_order_id': 'order_test',
        }, format='json')
        assert res.status_code == 400


class TestRazorpayWebhook:

    @patch('payments.views.send_booking_confirmation.delay')
    def test_webhook_payment_captured_creates_booking(
        self, mock_email,
        anon_client, paid_event_type, full_week_availability, future_monday
    ):
        booking_data = {
            'invitee_name': 'Webhook User',
            'invitee_email': 'webhook@test.com',
            'invitee_timezone': 'UTC',
            'start_datetime': (future_monday + timedelta(hours=6)).isoformat(),
        }
        payload = {
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_webhook_test_123',
                        'order_id': 'order_webhook_test_456',
                        'notes': {
                            'event_type_id': str(paid_event_type.id),
                            'booking_data': json.dumps(booking_data),
                        }
                    }
                }
            }
        }
        payload_bytes = json.dumps(payload).encode('utf-8')
        signature = make_webhook_signature(
            payload_bytes, settings.RAZORPAY_WEBHOOK_SECRET
        )

        res = anon_client.post(
            '/api/payments/webhook/',
            data=payload_bytes,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )
        assert res.status_code == 200

        from bookings.models import Booking
        booking = Booking.objects.filter(
            razorpay_payment_id='pay_webhook_test_123'
        ).first()
        assert booking is not None
        assert booking.payment_status == 'paid'

    def test_webhook_invalid_signature_rejected(self, anon_client, db):
        payload = json.dumps({'event': 'payment.captured'}).encode('utf-8')
        res = anon_client.post(
            '/api/payments/webhook/',
            data=payload,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE='bad_signature',
        )
        assert res.status_code == 400

    def test_webhook_missing_signature_rejected(self, anon_client, db):
        payload = json.dumps({'event': 'payment.captured'}).encode('utf-8')
        res = anon_client.post(
            '/api/payments/webhook/',
            data=payload,
            content_type='application/json',
        )
        assert res.status_code == 400

    @patch('payments.views.send_booking_confirmation.delay')
    def test_webhook_idempotent(self, mock_email, anon_client, paid_booking):
        payload = {
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': paid_booking.razorpay_payment_id,
                        'order_id': paid_booking.razorpay_order_id,
                        'notes': {}
                    }
                }
            }
        }
        payload_bytes = json.dumps(payload).encode('utf-8')
        signature = make_webhook_signature(
            payload_bytes, settings.RAZORPAY_WEBHOOK_SECRET
        )

        from bookings.models import Booking
        count_before = Booking.objects.count()

        anon_client.post(
            '/api/payments/webhook/',
            data=payload_bytes,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )
        assert Booking.objects.count() == count_before


class TestRazorpayRefund:

    @patch('payments.views.razorpay.Client')
    @patch('payments.views.send_cancellation_email.delay')
    def test_refund_paid_booking(self, mock_email, mock_client_class,
                                  auth_client, paid_booking):
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.payment.refund.return_value = {'id': 'rfnd_test_123'}

        res = auth_client.post(f'/api/payments/{paid_booking.id}/refund/')
        assert res.status_code == 200
        assert 'refund_id' in res.data

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
