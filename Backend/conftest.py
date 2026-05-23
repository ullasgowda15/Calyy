import pytest
from django.utils import timezone
from datetime import timedelta, time, datetime
import pytz
from decimal import Decimal


@pytest.fixture
def create_user(db):
    from accounts.models import User
    from django.utils import timezone as dj_tz

    def _create_user(
        email='host@test.com',
        username='testhost',
        password='testpass123',
        timezone='UTC',
        **kwargs
    ):
        kwargs.setdefault('subscription_status', 'free_trial')
        kwargs.setdefault('trial_started_at', dj_tz.now())
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            timezone=timezone,
            **kwargs
        )
        return user

    return _create_user


@pytest.fixture
def host_user(create_user):
    return create_user(
        email='host@test.com',
        username='testhost',
        timezone='UTC',
    )


@pytest.fixture
def second_user(create_user):
    return create_user(
        email='host2@test.com',
        username='testhost2',
        timezone='UTC',
    )


@pytest.fixture
def auth_client(host_user):
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(host_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def anon_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def second_auth_client(second_user):
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(second_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def free_event_type(host_user):
    from events.models import EventType
    return EventType.objects.create(
        host=host_user,
        name='Free 30 Min Call',
        slug='free-30-min-call',
        duration=30,
        location_type='zoom',
        min_notice=0,
        max_advance_days=60,
        buffer_before=0,
        buffer_after=0,
        is_active=True,
        price=None,
    )


@pytest.fixture
def paid_event_type(host_user):
    from events.models import EventType
    return EventType.objects.create(
        host=host_user,
        name='Paid 60 Min Consultation',
        slug='paid-60-min',
        duration=60,
        location_type='zoom',
        min_notice=0,
        max_advance_days=60,
        buffer_before=0,
        buffer_after=0,
        is_active=True,
        price=Decimal('50.00'),
        currency='INR',
    )


@pytest.fixture
def inactive_event_type(host_user):
    from events.models import EventType
    return EventType.objects.create(
        host=host_user,
        name='Inactive Event',
        slug='inactive-event',
        duration=30,
        location_type='zoom',
        min_notice=0,
        max_advance_days=60,
        is_active=False,
    )


@pytest.fixture
def full_week_availability(host_user):
    from events.models import Availability
    windows = []
    for weekday in range(5):
        window = Availability.objects.create(
            user=host_user,
            weekday=weekday,
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_active=True,
        )
        windows.append(window)
    return windows


@pytest.fixture
def monday_availability(host_user):
    from events.models import Availability
    return Availability.objects.create(
        user=host_user,
        weekday=0,
        start_time=time(9, 0),
        end_time=time(17, 0),
        is_active=True,
    )


@pytest.fixture
def future_monday():
    now = timezone.now()
    days_until_monday = (7 - now.weekday()) % 7 or 7
    next_monday = now + timedelta(days=days_until_monday)
    return next_monday.replace(hour=10, minute=0, second=0, microsecond=0)


@pytest.fixture
def confirmed_booking(free_event_type, full_week_availability, future_monday):
    from bookings.models import Booking
    return Booking.objects.create(
        event_type=free_event_type,
        invitee_name='Jane Doe',
        invitee_email='jane@test.com',
        invitee_timezone='UTC',
        start_datetime=future_monday,
        end_datetime=future_monday + timedelta(minutes=30),
        status='confirmed',
        payment_status='unpaid',
    )


@pytest.fixture
def paid_booking(paid_event_type, full_week_availability, future_monday):
    from bookings.models import Booking
    return Booking.objects.create(
        event_type=paid_event_type,
        invitee_name='John Smith',
        invitee_email='john@test.com',
        invitee_timezone='UTC',
        start_datetime=future_monday + timedelta(hours=2),
        end_datetime=future_monday + timedelta(hours=3),
        status='confirmed',
        payment_status='paid',
        razorpay_order_id='order_test_123456789',
        razorpay_payment_id='pay_test_123456789',
        razorpay_signature='test_signature_abc',
    )
