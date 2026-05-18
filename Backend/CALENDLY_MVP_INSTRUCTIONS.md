# Calendly Standard Plan MVP — Full Implementation Instructions

> Feed this file to Claude Code and execute end-to-end.
> Stack: Django 4.2 + DRF + PostgreSQL + Redis + Celery + Stripe + Google Calendar OAuth2
> Target: a fully working Calendly Standard plan clone, deployable to Railway.

---

## 0. Project setup

Create a new directory and initialize the project.

```
mkdir caly
cd caly
```

Create a Python virtual environment and install all dependencies:

```
python -m venv calyenv
calyenv\Scripts\activate        # Windows cmd
pip install django==4.2 djangorestframework==3.15 djangorestframework-simplejwt==5.3 \
  django-cors-headers psycopg2-binary celery==5.3 redis django-celery-beat \
  stripe google-auth google-auth-oauthlib google-api-python-client \
  django-environ Pillow drf-spectacular gunicorn whitenoise requests python-dateutil \
  django-filter
```

Start the Django project and core app:

```
django-admin startproject core .
python manage.py startapp accounts
python manage.py startapp events
python manage.py startapp bookings
python manage.py startapp integrations
python manage.py startapp payments
```

---

## 1. Environment & settings

### 1.1 Create `.env` file in project root

```
SECRET_KEY=your-secret-key-change-this
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgres://postgres:postgres@localhost:5432/calendly_mvp

REDIS_URL=redis://localhost:6379/0

STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/integrations/google/callback/

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your@gmail.com

FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8000
```

### 1.2 Replace `core/settings.py` entirely with the following

```python
import os
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_celery_beat',
    'drf_spectacular',
    'accounts',
    'events',
    'bookings',
    'integrations',
    'payments',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
}

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Calendly MVP API',
    'VERSION': '1.0.0',
}

CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TIMEZONE = 'UTC'

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://localhost:6379/0'),
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@calendly-mvp.com')

STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')

GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:8000/api/integrations/google/callback/')

FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')
BASE_URL = env('BASE_URL', default='http://localhost:8000')

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

---

## 2. Celery configuration

### 2.1 Create `core/celery.py`

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### 2.2 Update `core/__init__.py`

```python
from .celery import app as celery_app
__all__ = ('celery_app',)
```

---

## 3. Accounts app

### 3.1 `accounts/models.py`

```python
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.SlugField(unique=True, max_length=60)
    timezone = models.CharField(max_length=64, default='UTC')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
```

### 3.2 `accounts/serializers.py`

```python
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'timezone')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            timezone=validated_data.get('timezone', 'UTC'),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'timezone', 'bio', 'avatar', 'first_name', 'last_name')
        read_only_fields = ('id', 'email')
```

### 3.3 `accounts/views.py`

```python
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer
from .models import User


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'username'
    queryset = User.objects.all()
```

### 3.4 `accounts/urls.py`

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView, PublicProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('users/<slug:username>/', PublicProfileView.as_view(), name='public_profile'),
]
```

---

## 4. Events app

### 4.1 `events/models.py`

```python
import uuid
from django.db import models
from django.conf import settings


class EventType(models.Model):
    DURATION_CHOICES = [
        (15, '15 min'), (30, '30 min'), (45, '45 min'),
        (60, '1 hour'), (90, '90 min'), (120, '2 hours'),
    ]
    LOCATION_CHOICES = [
        ('zoom', 'Zoom'), ('google_meet', 'Google Meet'),
        ('phone', 'Phone call'), ('in_person', 'In person'),
        ('custom', 'Custom'),
    ]
    COLOR_CHOICES = [
        ('#0069FF', 'Blue'), ('#00A2FF', 'Cyan'),
        ('#33C17E', 'Green'), ('#FF6B6B', 'Red'),
        ('#FF9500', 'Orange'), ('#9B51E0', 'Purple'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_types')
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120)
    description = models.TextField(blank=True)
    duration = models.PositiveIntegerField(choices=DURATION_CHOICES, default=30)
    location_type = models.CharField(max_length=20, choices=LOCATION_CHOICES, default='zoom')
    location_details = models.CharField(max_length=300, blank=True)
    color = models.CharField(max_length=10, choices=COLOR_CHOICES, default='#0069FF')
    is_active = models.BooleanField(default=True)

    # Booking controls
    buffer_before = models.PositiveIntegerField(default=0, help_text='Minutes buffer before meeting')
    buffer_after = models.PositiveIntegerField(default=0, help_text='Minutes buffer after meeting')
    min_notice = models.PositiveIntegerField(default=120, help_text='Minimum minutes notice required')
    max_advance_days = models.PositiveIntegerField(default=60, help_text='How many days ahead can be booked')
    max_bookings_per_day = models.PositiveIntegerField(null=True, blank=True)

    # Payment
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')

    # Custom questions (JSON list of {label, type, required})
    custom_questions = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('host', 'slug')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.host.username} / {self.name}'


class Availability(models.Model):
    WEEKDAY_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availability')
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'weekday', 'start_time')
        ordering = ['weekday', 'start_time']

    def __str__(self):
        return f'{self.user.username} {self.get_weekday_display()} {self.start_time}-{self.end_time}'


class BlockedTime(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_times')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['start_datetime']

    def __str__(self):
        return f'{self.user.username} blocked {self.start_datetime} - {self.end_datetime}'
```

### 4.2 `events/availability.py` — The availability engine

```python
from datetime import datetime, timedelta, date, time
import pytz
from django.utils import timezone
from .models import Availability, BlockedTime
from bookings.models import Booking


def get_available_slots(event_type, target_date: date, host_timezone: str = 'UTC') -> list:
    """
    Returns a list of available datetime slots (UTC) for a given event_type on target_date.
    """
    host_tz = pytz.timezone(host_timezone)

    # Check if target_date is within booking window
    now = timezone.now()
    min_dt = now + timedelta(minutes=event_type.min_notice)
    max_dt = now + timedelta(days=event_type.max_advance_days)

    # Get the weekday of target_date (Monday=0, Sunday=6)
    weekday = target_date.weekday()

    # Fetch availability windows for this weekday
    availability_windows = Availability.objects.filter(
        user=event_type.host,
        weekday=weekday,
        is_active=True,
    )

    if not availability_windows.exists():
        return []

    slots = []
    slot_duration = timedelta(minutes=event_type.duration)
    buffer_before = timedelta(minutes=event_type.buffer_before)
    buffer_after = timedelta(minutes=event_type.buffer_after)

    # Get existing bookings for this host on target_date (UTC range for that day in host TZ)
    day_start_host = host_tz.localize(datetime.combine(target_date, time.min))
    day_end_host = host_tz.localize(datetime.combine(target_date, time.max))
    day_start_utc = day_start_host.astimezone(pytz.utc)
    day_end_utc = day_end_host.astimezone(pytz.utc)

    existing_bookings = Booking.objects.filter(
        event_type__host=event_type.host,
        start_datetime__date=target_date,
        status__in=['confirmed', 'pending'],
    ).values('start_datetime', 'end_datetime')

    blocked_times = BlockedTime.objects.filter(
        user=event_type.host,
        start_datetime__lt=day_end_utc,
        end_datetime__gt=day_start_utc,
    ).values('start_datetime', 'end_datetime')

    # Check bookings per day cap
    if event_type.max_bookings_per_day:
        confirmed_today = Booking.objects.filter(
            event_type__host=event_type.host,
            start_datetime__date=target_date,
            status='confirmed',
        ).count()
        if confirmed_today >= event_type.max_bookings_per_day:
            return []

    for window in availability_windows:
        # Build slot start/end in host timezone, then convert to UTC
        window_start = host_tz.localize(datetime.combine(target_date, window.start_time))
        window_end = host_tz.localize(datetime.combine(target_date, window.end_time))

        current = window_start
        while current + slot_duration <= window_end:
            slot_start_utc = current.astimezone(pytz.utc)
            slot_end_utc = (current + slot_duration).astimezone(pytz.utc)
            effective_start = slot_start_utc - buffer_before
            effective_end = slot_end_utc + buffer_after

            # Check min notice
            if slot_start_utc < min_dt:
                current += timedelta(minutes=15)
                continue

            # Check max advance
            if slot_start_utc > max_dt:
                break

            # Check against existing bookings (with buffers)
            conflict = False
            for booking in existing_bookings:
                b_start = booking['start_datetime']
                b_end = booking['end_datetime']
                if b_start < effective_end and b_end > effective_start:
                    conflict = True
                    break

            if not conflict:
                for block in blocked_times:
                    b_start = block['start_datetime']
                    b_end = block['end_datetime']
                    if b_start < effective_end and b_end > effective_start:
                        conflict = True
                        break

            if not conflict:
                slots.append({
                    'start': slot_start_utc.isoformat(),
                    'end': slot_end_utc.isoformat(),
                })

            current += timedelta(minutes=15)  # 15-min granularity

    return slots
```

### 4.3 `events/serializers.py`

```python
from rest_framework import serializers
from django.utils.text import slugify
from .models import EventType, Availability, BlockedTime


class EventTypeSerializer(serializers.ModelSerializer):
    host_username = serializers.CharField(source='host.username', read_only=True)
    booking_url = serializers.SerializerMethodField()

    class Meta:
        model = EventType
        fields = '__all__'
        read_only_fields = ('id', 'host', 'created_at', 'updated_at', 'host_username', 'booking_url')

    def get_booking_url(self, obj):
        from django.conf import settings
        return f"{settings.BASE_URL}/book/{obj.host.username}/{obj.slug}/"

    def validate(self, data):
        if 'name' in data and 'slug' not in data:
            data['slug'] = slugify(data['name'])
        return data

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = '__all__'
        read_only_fields = ('id', 'user')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BlockedTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedTime
        fields = '__all__'
        read_only_fields = ('id', 'user')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
```

### 4.4 `events/views.py`

```python
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from datetime import date
from .models import EventType, Availability, BlockedTime
from .serializers import EventTypeSerializer, AvailabilitySerializer, BlockedTimeSerializer
from .availability import get_available_slots
from accounts.models import User


class EventTypeViewSet(viewsets.ModelViewSet):
    serializer_class = EventTypeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return EventType.objects.filter(host=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def slots(self, request, pk=None):
        """
        GET /api/events/<id>/slots/?date=YYYY-MM-DD
        Returns available slots for a given date.
        """
        event_type = get_object_or_404(EventType, pk=pk, is_active=True)
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date parameter required (YYYY-MM-DD)'}, status=400)
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=400)

        slots = get_available_slots(event_type, target_date, event_type.host.timezone)
        return Response({'date': date_str, 'slots': slots})


class PublicEventTypeView(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventTypeSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        return EventType.objects.filter(host=user, is_active=True)


class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)


class BlockedTimeViewSet(viewsets.ModelViewSet):
    serializer_class = BlockedTimeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return BlockedTime.objects.filter(user=self.request.user)
```

### 4.5 `events/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventTypeViewSet, AvailabilityViewSet, BlockedTimeViewSet, PublicEventTypeView

router = DefaultRouter()
router.register('event-types', EventTypeViewSet, basename='event-types')
router.register('availability', AvailabilityViewSet, basename='availability')
router.register('blocked-times', BlockedTimeViewSet, basename='blocked-times')

urlpatterns = [
    path('', include(router.urls)),
    path('public/<slug:username>/event-types/', PublicEventTypeView.as_view({'get': 'list'})),
    path('public/<slug:username>/event-types/<uuid:pk>/', PublicEventTypeView.as_view({'get': 'retrieve'})),
    path('public/<slug:username>/event-types/<uuid:pk>/slots/', EventTypeViewSet.as_view({'get': 'slots'})),
]
```

---

## 5. Bookings app

### 5.1 `bookings/models.py`

```python
import uuid
from django.db import models
from django.conf import settings


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.ForeignKey('events.EventType', on_delete=models.CASCADE, related_name='bookings')
    invitee_name = models.CharField(max_length=120)
    invitee_email = models.EmailField()
    invitee_timezone = models.CharField(max_length=64, default='UTC')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    custom_answers = models.JSONField(default=dict, blank=True)
    cancel_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    reschedule_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Payment reference
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    payment_status = models.CharField(max_length=20, default='unpaid')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_datetime']

    def __str__(self):
        return f'{self.invitee_name} with {self.event_type.host.username} at {self.start_datetime}'
```

### 5.2 `bookings/serializers.py`

```python
from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from events.models import EventType
from events.availability import get_available_slots
from datetime import datetime
import pytz


class BookingCreateSerializer(serializers.ModelSerializer):
    event_type_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Booking
        fields = (
            'event_type_id', 'invitee_name', 'invitee_email',
            'invitee_timezone', 'start_datetime', 'notes', 'custom_answers',
        )

    def validate(self, data):
        try:
            event_type = EventType.objects.get(id=data['event_type_id'], is_active=True)
        except EventType.DoesNotExist:
            raise serializers.ValidationError('Event type not found or inactive.')

        start = data['start_datetime']
        if timezone.is_naive(start):
            start = pytz.utc.localize(start)

        # Verify the requested slot is still available
        target_date = start.date()
        available_slots = get_available_slots(event_type, target_date, event_type.host.timezone)
        slot_starts = [s['start'] for s in available_slots]
        if start.isoformat() not in slot_starts:
            raise serializers.ValidationError('This time slot is no longer available.')

        from datetime import timedelta
        data['event_type'] = event_type
        data['end_datetime'] = start + timedelta(minutes=event_type.duration)
        data['start_datetime'] = start
        return data

    def create(self, validated_data):
        validated_data.pop('event_type_id', None)
        booking = Booking.objects.create(**validated_data)
        return booking


class BookingSerializer(serializers.ModelSerializer):
    event_type_name = serializers.CharField(source='event_type.name', read_only=True)
    host_username = serializers.CharField(source='event_type.host.username', read_only=True)
    cancel_url = serializers.SerializerMethodField()
    reschedule_url = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('id', 'cancel_token', 'reschedule_token', 'created_at', 'updated_at')

    def get_cancel_url(self, obj):
        from django.conf import settings
        return f"{settings.BASE_URL}/api/bookings/{obj.id}/cancel/?token={obj.cancel_token}"

    def get_reschedule_url(self, obj):
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/reschedule/{obj.reschedule_token}/"
```

### 5.3 `bookings/tasks.py`

```python
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_booking_confirmation(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        logger.warning(f'Booking {booking_id} not found for confirmation email')
        return

    host = booking.event_type.host
    subject = f'Booking confirmed: {booking.event_type.name}'

    # Email to invitee
    invitee_body = f"""Hi {booking.invitee_name},

Your meeting has been confirmed!

Event: {booking.event_type.name}
With: {host.get_full_name() or host.username}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Duration: {booking.event_type.duration} minutes
Location: {booking.event_type.location_type.upper()}

Need to cancel? Visit: {settings.BASE_URL}/api/bookings/{booking.id}/cancel/?token={booking.cancel_token}

See you soon!
"""
    send_mail(subject, invitee_body, settings.DEFAULT_FROM_EMAIL, [booking.invitee_email], fail_silently=True)

    # Email to host
    host_body = f"""Hi {host.get_full_name() or host.username},

New booking received!

From: {booking.invitee_name} ({booking.invitee_email})
Event: {booking.event_type.name}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Notes: {booking.notes or 'None'}
"""
    send_mail(f'New booking: {booking.invitee_name}', host_body, settings.DEFAULT_FROM_EMAIL, [host.email], fail_silently=True)


@shared_task
def send_booking_reminder(booking_id: str, hours_before: int = 24):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    if booking.status != 'confirmed':
        return

    subject = f'Reminder: {booking.event_type.name} in {hours_before} hour{"s" if hours_before != 1 else ""}'
    body = f"""Hi {booking.invitee_name},

Just a reminder about your upcoming meeting.

Event: {booking.event_type.name}
When: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC
Location: {booking.event_type.location_type.upper()}

See you soon!
"""
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [booking.invitee_email], fail_silently=True)


@shared_task
def send_cancellation_email(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    subject = f'Cancelled: {booking.event_type.name}'
    body = f"""Hi {booking.invitee_name},

Your booking has been cancelled.

Event: {booking.event_type.name}
Original time: {booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')} UTC

To book again: {settings.BASE_URL}/book/{booking.event_type.host.username}/{booking.event_type.slug}/
"""
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [booking.invitee_email], fail_silently=True)
```

### 5.4 `bookings/views.py`

```python
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer
from .tasks import send_booking_confirmation, send_booking_reminder, send_cancellation_email


class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        booking = serializer.save(status='confirmed')

        # Schedule confirmation email immediately
        send_booking_confirmation.delay(str(booking.id))

        # Schedule 24h reminder
        reminder_24h = booking.start_datetime - timedelta(hours=24)
        if reminder_24h > timezone.now():
            send_booking_reminder.apply_async(
                args=[str(booking.id), 24],
                eta=reminder_24h,
            )

        # Schedule 1h reminder
        reminder_1h = booking.start_datetime - timedelta(hours=1)
        if reminder_1h > timezone.now():
            send_booking_reminder.apply_async(
                args=[str(booking.id), 1],
                eta=reminder_1h,
            )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event_type = serializer.validated_data.get('event_type')

        # If paid event type, redirect to payment
        if event_type and event_type.price and float(event_type.price) > 0:
            return Response({
                'requires_payment': True,
                'event_type_id': str(event_type.id),
                'price': str(event_type.price),
                'currency': event_type.currency,
                'booking_data': request.data,
            }, status=status.HTTP_200_OK)

        self.perform_create(serializer)
        return Response(BookingSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)


class HostBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Booking.objects.filter(event_type__host=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.select_related('event_type')


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Booking.objects.filter(event_type__host=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def cancel_booking(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    token = request.query_params.get('token') or request.data.get('token')

    if str(booking.cancel_token) != str(token):
        return Response({'error': 'Invalid cancellation token'}, status=403)

    if booking.status == 'cancelled':
        return Response({'error': 'Booking already cancelled'}, status=400)

    booking.status = 'cancelled'
    booking.save()
    send_cancellation_email.delay(str(booking.id))
    return Response({'message': 'Booking cancelled successfully'})
```

### 5.5 `bookings/urls.py`

```python
from django.urls import path
from .views import CreateBookingView, HostBookingListView, BookingDetailView, cancel_booking

urlpatterns = [
    path('', CreateBookingView.as_view(), name='create_booking'),
    path('my/', HostBookingListView.as_view(), name='host_bookings'),
    path('<uuid:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    path('<uuid:booking_id>/cancel/', cancel_booking, name='cancel_booking'),
]
```

---

## 6. Payments app (Stripe)

### 6.1 `payments/views.py`

```python
import stripe
import json
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from events.models import EventType
from bookings.models import Booking
from bookings.serializers import BookingCreateSerializer, BookingSerializer
from bookings.tasks import send_booking_confirmation, send_booking_reminder
from django.utils import timezone
from datetime import timedelta

stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    """
    Create a Stripe PaymentIntent for a paid event type.
    POST body: { event_type_id, booking_data: {...} }
    """
    event_type_id = request.data.get('event_type_id')
    booking_data = request.data.get('booking_data', {})

    try:
        event_type = EventType.objects.get(id=event_type_id, is_active=True)
    except EventType.DoesNotExist:
        return Response({'error': 'Event type not found'}, status=404)

    if not event_type.price:
        return Response({'error': 'This event type is free'}, status=400)

    intent = stripe.PaymentIntent.create(
        amount=int(float(event_type.price) * 100),  # Convert to cents
        currency=event_type.currency.lower(),
        metadata={
            'event_type_id': str(event_type.id),
            'booking_data': json.dumps(booking_data),
        }
    )

    return Response({
        'client_secret': intent.client_secret,
        'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
    })


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        metadata = intent.get('metadata', {})
        event_type_id = metadata.get('event_type_id')
        booking_data_str = metadata.get('booking_data', '{}')

        try:
            booking_data = json.loads(booking_data_str)
            booking_data['event_type_id'] = event_type_id
            serializer = BookingCreateSerializer(data=booking_data)
            if serializer.is_valid():
                booking = serializer.save(
                    status='confirmed',
                    stripe_payment_intent_id=intent['id'],
                    payment_status='paid',
                )
                send_booking_confirmation.delay(str(booking.id))
                reminder_24h = booking.start_datetime - timedelta(hours=24)
                if reminder_24h > timezone.now():
                    send_booking_reminder.apply_async(args=[str(booking.id), 24], eta=reminder_24h)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'Stripe webhook booking creation failed: {e}')

    return HttpResponse(status=200)
```

### 6.2 `payments/urls.py`

```python
from django.urls import path
from .views import create_payment_intent, stripe_webhook

urlpatterns = [
    path('create-intent/', create_payment_intent, name='create_payment_intent'),
    path('webhook/', stripe_webhook, name='stripe_webhook'),
]
```

---

## 7. Integrations app (Google Calendar OAuth2)

### 7.1 `integrations/models.py`

```python
import uuid
from django.db import models
from django.conf import settings


class GoogleCalendarToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_token')
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField(null=True, blank=True)
    calendar_id = models.CharField(max_length=200, default='primary')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} Google Calendar'


class WebhookSubscription(models.Model):
    """For outgoing webhooks on booking events (Zapier integration)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='webhooks')
    url = models.URLField()
    event = models.CharField(max_length=30, choices=[
        ('booking.created', 'Booking created'),
        ('booking.cancelled', 'Booking cancelled'),
        ('booking.rescheduled', 'Booking rescheduled'),
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} webhook → {self.url} on {self.event}'
```

### 7.2 `integrations/google_calendar.py`

```python
import json
from datetime import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings
from django.utils import timezone


SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_credentials(google_token) -> Credentials:
    creds = Credentials(
        token=google_token.access_token,
        refresh_token=google_token.refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        google_token.access_token = creds.token
        google_token.token_expiry = creds.expiry
        google_token.save()
    return creds


def get_busy_slots(google_token, date_min: datetime, date_max: datetime) -> list:
    """Returns list of {start, end} busy periods from Google Calendar."""
    try:
        creds = get_credentials(google_token)
        service = build('calendar', 'v3', credentials=creds)
        body = {
            'timeMin': date_min.isoformat(),
            'timeMax': date_max.isoformat(),
            'items': [{'id': google_token.calendar_id}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result.get('calendars', {}).get(google_token.calendar_id, {}).get('busy', [])
        return busy
    except Exception:
        return []


def create_calendar_event(google_token, booking) -> str:
    """Creates a Google Calendar event for a confirmed booking. Returns event ID."""
    try:
        creds = get_credentials(google_token)
        service = build('calendar', 'v3', credentials=creds)
        event = {
            'summary': f'{booking.event_type.name} with {booking.invitee_name}',
            'description': f'Booking ID: {booking.id}\nInvitee email: {booking.invitee_email}',
            'start': {'dateTime': booking.start_datetime.isoformat(), 'timeZone': 'UTC'},
            'end': {'dateTime': booking.end_datetime.isoformat(), 'timeZone': 'UTC'},
            'attendees': [
                {'email': booking.invitee_email},
            ],
        }
        result = service.events().insert(calendarId=google_token.calendar_id, body=event).execute()
        return result.get('id', '')
    except Exception:
        return ''


def delete_calendar_event(google_token, event_id: str):
    """Deletes a Google Calendar event (for cancellations)."""
    try:
        creds = get_credentials(google_token)
        service = build('calendar', 'v3', credentials=creds)
        service.events().delete(calendarId=google_token.calendar_id, eventId=event_id).execute()
    except Exception:
        pass
```

### 7.3 `integrations/views.py`

```python
import json
import requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from google_auth_oauthlib.flow import Flow
from .models import GoogleCalendarToken, WebhookSubscription
from .serializers import WebhookSubscriptionSerializer


SCOPES = ['https://www.googleapis.com/auth/calendar']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def google_auth_url(request):
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
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=str(request.user.id),
    )
    return Response({'auth_url': auth_url})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def google_callback(request):
    code = request.query_params.get('code')
    state = request.query_params.get('state')  # user id

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
    flow.fetch_token(code=code)

    credentials = flow.credentials
    from accounts.models import User
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
    return redirect(f"{settings.FRONTEND_URL}/settings/integrations?google=connected")


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def google_disconnect(request):
    GoogleCalendarToken.objects.filter(user=request.user).delete()
    return Response({'message': 'Google Calendar disconnected'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def google_status(request):
    connected = GoogleCalendarToken.objects.filter(user=request.user).exists()
    return Response({'connected': connected})


class WebhookSubscriptionViewSet(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WebhookSubscriptionSerializer

    def get_queryset(self):
        return WebhookSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def fire_webhooks(user, event: str, payload: dict):
    """Called after booking create/cancel to fire registered webhooks."""
    subs = WebhookSubscription.objects.filter(user=user, event=event, is_active=True)
    for sub in subs:
        try:
            requests.post(sub.url, json=payload, timeout=5)
        except Exception:
            pass
```

### 7.4 `integrations/serializers.py`

```python
from rest_framework import serializers
from .models import WebhookSubscription


class WebhookSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookSubscription
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at')
```

### 7.5 `integrations/urls.py`

```python
from django.urls import path
from .views import (
    google_auth_url, google_callback, google_disconnect,
    google_status, WebhookSubscriptionViewSet,
)

urlpatterns = [
    path('google/auth/', google_auth_url, name='google_auth'),
    path('google/callback/', google_callback, name='google_callback'),
    path('google/disconnect/', google_disconnect, name='google_disconnect'),
    path('google/status/', google_status, name='google_status'),
    path('webhooks/', WebhookSubscriptionViewSet.as_view(), name='webhooks'),
]
```

---

## 8. Root URL configuration

### 8.1 Replace `core/urls.py` entirely

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/events/', include('events.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 9. Admin registrations

### 9.1 `accounts/admin.py`

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'timezone', 'is_staff')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('timezone', 'bio', 'avatar')}),
    )
```

### 9.2 `events/admin.py`

```python
from django.contrib import admin
from .models import EventType, Availability, BlockedTime

@admin.register(EventType)
class EventTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'host', 'duration', 'is_active', 'price')
    list_filter = ('is_active', 'location_type')

admin.site.register(Availability)
admin.site.register(BlockedTime)
```

### 9.3 `bookings/admin.py`

```python
from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('invitee_name', 'invitee_email', 'event_type', 'start_datetime', 'status', 'payment_status')
    list_filter = ('status', 'payment_status')
    search_fields = ('invitee_name', 'invitee_email')
```

### 9.4 `integrations/admin.py`

```python
from django.contrib import admin
from .models import GoogleCalendarToken, WebhookSubscription

admin.site.register(GoogleCalendarToken)
admin.site.register(WebhookSubscription)
```

---

## 10. Migrations & database

Run these commands after all models are in place:

```
python manage.py makemigrations accounts
python manage.py makemigrations events
python manage.py makemigrations bookings
python manage.py makemigrations integrations
python manage.py makemigrations payments
python manage.py migrate
python manage.py createsuperuser
```

---

## 11. Seed data (optional but useful for testing)

Create `seed.py` in the project root:

```python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from events.models import EventType, Availability
from datetime import time

# Create test host user
user, created = User.objects.get_or_create(
    email='host@test.com',
    defaults={
        'username': 'testhost',
        'timezone': 'America/New_York',
        'first_name': 'Test',
        'last_name': 'Host',
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print('Created test user: host@test.com / testpass123')

# Create event types
et1, _ = EventType.objects.get_or_create(
    host=user, slug='30-min-call',
    defaults={
        'name': '30 Minute Call',
        'duration': 30,
        'buffer_after': 10,
        'min_notice': 120,
        'max_advance_days': 30,
        'location_type': 'zoom',
        'color': '#0069FF',
    }
)

et2, _ = EventType.objects.get_or_create(
    host=user, slug='60-min-consultation',
    defaults={
        'name': '60 Minute Consultation',
        'duration': 60,
        'buffer_after': 15,
        'min_notice': 240,
        'max_advance_days': 30,
        'location_type': 'zoom',
        'price': '99.00',
        'currency': 'USD',
        'color': '#9B51E0',
    }
)

# Add Mon-Fri 9am-5pm availability (weekdays 0-4)
for weekday in range(5):
    Availability.objects.get_or_create(
        user=user, weekday=weekday,
        start_time=time(9, 0),
        end_time=time(17, 0),
    )

print('Seed complete. Event types and availability created.')
print(f'Booking URL: /book/testhost/30-min-call/')
```

Run it:

```
python seed.py
```

---

## 12. Docker setup

### 12.1 `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
```

### 12.2 `docker-compose.yml`

```yaml
version: '3.9'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: calendly_mvp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 2 --reload
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db
      - redis

  celery:
    build: .
    command: celery -A core worker --loglevel=info
    volumes:
      - .:/app
    env_file: .env
    depends_on:
      - db
      - redis

  celery-beat:
    build: .
    command: celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    volumes:
      - .:/app
    env_file: .env
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
```

### 12.3 `requirements.txt`

Generate with:

```
pip freeze > requirements.txt
```

Or write manually to match the install command from section 0.

---

## 13. Railway deployment

### 13.1 `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "bash entrypoint.sh",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 13.2 `entrypoint.sh`

```bash
#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

Make it executable: `chmod +x entrypoint.sh`

### 13.3 Set these Railway environment variables

Copy all keys from your `.env` file. Set `DEBUG=False` and `ALLOWED_HOSTS=your-railway-domain.up.railway.app` in production. Set `DATABASE_URL` and `REDIS_URL` from Railway's provisioned PostgreSQL and Redis services.

---

## 14. API reference — all endpoints

```
Auth
  POST   /api/auth/register/              Register new host account
  POST   /api/auth/login/                 Login (returns JWT access + refresh)
  POST   /api/auth/token/refresh/         Refresh access token
  GET    /api/auth/me/                    Get/update own profile
  GET    /api/auth/users/<username>/      Public profile

Event types (authenticated)
  GET    /api/events/event-types/         List own event types
  POST   /api/events/event-types/         Create event type
  GET    /api/events/event-types/<id>/    Get event type
  PATCH  /api/events/event-types/<id>/    Update event type
  DELETE /api/events/event-types/<id>/    Delete event type
  GET    /api/events/event-types/<id>/slots/?date=YYYY-MM-DD  Get available slots

Availability (authenticated)
  GET    /api/events/availability/        List availability windows
  POST   /api/events/availability/        Create availability window
  PATCH  /api/events/availability/<id>/   Update
  DELETE /api/events/availability/<id>/   Delete

Blocked times (authenticated)
  GET    /api/events/blocked-times/       List blocked times
  POST   /api/events/blocked-times/       Block a time range
  DELETE /api/events/blocked-times/<id>/  Unblock

Public booking (no auth)
  GET    /api/events/public/<username>/event-types/              List public event types
  GET    /api/events/public/<username>/event-types/<id>/         Get event type
  GET    /api/events/public/<username>/event-types/<id>/slots/?date=YYYY-MM-DD

Bookings (no auth to create, auth to view)
  POST   /api/bookings/                   Create booking
  GET    /api/bookings/my/                Host: list own bookings (?status=confirmed)
  GET    /api/bookings/<id>/              Host: booking detail
  POST   /api/bookings/<id>/cancel/       Cancel booking (token required)

Payments
  POST   /api/payments/create-intent/     Create Stripe PaymentIntent
  POST   /api/payments/webhook/           Stripe webhook (no auth, CSRF exempt)

Integrations
  GET    /api/integrations/google/auth/       Get Google OAuth2 URL
  GET    /api/integrations/google/callback/   OAuth2 callback
  DELETE /api/integrations/google/disconnect/ Disconnect Google Calendar
  GET    /api/integrations/google/status/     Check if connected
  GET    /api/integrations/webhooks/          List Zapier webhooks
  POST   /api/integrations/webhooks/          Register webhook

Docs
  GET    /api/docs/    Swagger UI (auto-generated via drf-spectacular)
  GET    /api/schema/  OpenAPI schema JSON
```

---

## 15. Running locally (step by step)

```bash
# Terminal 1 — Start Django
docker-compose up db redis -d
python manage.py migrate
python manage.py runserver

# Terminal 2 — Start Celery worker
celery -A core worker --loglevel=info

# Terminal 3 — Start Celery Beat (for scheduled reminders)
celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler

# Optionally seed test data
python seed.py
```

Open `http://localhost:8000/api/docs/` for the full Swagger UI.

---

## 16. Key implementation notes

1. **Availability engine** — the `get_available_slots()` function in `events/availability.py` is the core brain. It respects buffer times, min notice, max advance days, and existing bookings. Test this thoroughly before testing the booking API.

2. **Timezones** — all datetimes are stored in UTC in the database. The availability engine converts host timezone to UTC when computing slots. The frontend should display times in the invitee's local timezone using the `invitee_timezone` field.

3. **Paid bookings flow** — when `POST /api/bookings/` returns `requires_payment: true`, the frontend should call `POST /api/payments/create-intent/` to get a Stripe `client_secret`, complete payment on the frontend using Stripe.js, then Stripe fires the webhook which creates the booking automatically.

4. **Google Calendar sync** — after connecting Google Calendar via OAuth2, the availability engine should be extended to also call `get_busy_slots()` from `integrations/google_calendar.py` and block those times. Wire this into `get_available_slots()` by importing it when `GoogleCalendarToken` exists for the host.

5. **Zapier webhooks** — after every `Booking` create or cancel, call `fire_webhooks(booking.event_type.host, 'booking.created', {...})` from `integrations/views.py`. This gives instant Zapier compatibility without building a full Zapier app.

6. **Install pytz** — the availability engine uses `pytz`. Make sure it is in `requirements.txt`: `pip install pytz`.

7. **The `payments` app has no `models.py`** — that is intentional. Stripe is the source of truth for payment state. The `stripe_payment_intent_id` field on `Booking` is sufficient for MVP.

---

## 17. Testing the booking flow end to end

```bash
# 1. Register a host
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"host@test.com","username":"testhost","password":"testpass123","timezone":"America/New_York"}'

# 2. Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"host@test.com","password":"testpass123"}'
# Save the access token

# 3. Set availability (Mon-Fri 9am-5pm)
curl -X POST http://localhost:8000/api/events/availability/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"weekday":0,"start_time":"09:00:00","end_time":"17:00:00"}'

# 4. Create an event type
curl -X POST http://localhost:8000/api/events/event-types/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"30 Minute Call","duration":30,"location_type":"zoom","min_notice":60,"max_advance_days":30}'

# 5. Get available slots (no auth needed)
curl "http://localhost:8000/api/events/public/testhost/event-types/<event_type_id>/slots/?date=2026-05-20"

# 6. Create a booking
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Content-Type: application/json" \
  -d '{"event_type_id":"<id>","invitee_name":"Jane Doe","invitee_email":"jane@example.com","start_datetime":"2026-05-20T14:00:00+00:00","invitee_timezone":"America/Chicago"}'
```

---

That's the complete MVP. All Standard plan features are covered: unlimited event types, availability engine with buffers and controls, multi-calendar sync (Google Calendar OAuth2), workflow automation (Celery reminders), payment collection (Stripe), Zapier-compatible webhooks, and full JWT auth. Deploy to Railway using the entrypoint and environment variables in section 13.
