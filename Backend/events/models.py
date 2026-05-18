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

    buffer_before = models.PositiveIntegerField(default=0, help_text='Minutes buffer before meeting')
    buffer_after = models.PositiveIntegerField(default=0, help_text='Minutes buffer after meeting')
    min_notice = models.PositiveIntegerField(default=120, help_text='Minimum minutes notice required')
    max_advance_days = models.PositiveIntegerField(default=60, help_text='How many days ahead can be booked')
    max_bookings_per_day = models.PositiveIntegerField(null=True, blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')

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
