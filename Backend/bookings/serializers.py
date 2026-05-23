import html
from datetime import timedelta
from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from events.models import EventType
from events.availability import get_available_slots
from django.db import transaction
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
            event_type = EventType.objects.select_related('host').get(id=data['event_type_id'], is_active=True)
        except EventType.DoesNotExist:
            raise serializers.ValidationError('Event type not found or inactive.')
        if event_type.host.email == data.get('invitee_email', ''):
            raise serializers.ValidationError('You cannot book your own event.')

        start = data['start_datetime']
        if timezone.is_naive(start):
            start = pytz.utc.localize(start)

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
    event_type_price = serializers.DecimalField(source='event_type.price', read_only=True, max_digits=10, decimal_places=2)
    event_type_currency = serializers.CharField(source='event_type.currency', read_only=True)
    event_type_duration = serializers.IntegerField(source='event_type.duration', read_only=True)
    host_username = serializers.CharField(source='event_type.host.username', read_only=True)
    cancel_url = serializers.SerializerMethodField()
    reschedule_url = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id', 'event_type', 'event_type_name', 'event_type_price', 'event_type_currency',
            'event_type_duration',
            'host_username', 'invitee_name', 'invitee_email', 'invitee_timezone',
            'start_datetime', 'end_datetime', 'status', 'payment_status',
            'notes', 'custom_answers', 'cancel_url', 'reschedule_url',
            'cancel_token', 'reschedule_token',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'cancel_token', 'reschedule_token', 'created_at', 'updated_at',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'payment_status', 'status',
        )

    def get_cancel_url(self, obj):
        from django.conf import settings
        return f"{settings.BASE_URL}/api/bookings/{obj.id}/cancel/?token={obj.cancel_token}"

    def get_reschedule_url(self, obj):
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/reschedule/{obj.reschedule_token}/"
