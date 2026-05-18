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

    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    payment_status = models.CharField(max_length=20, default='unpaid')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_datetime']

    def __str__(self):
        return f'{self.invitee_name} with {self.event_type.host.username} at {self.start_datetime}'
