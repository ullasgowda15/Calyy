from rest_framework import serializers
from django.contrib.auth import get_user_model
from events.models import EventType
from bookings.models import Booking

User = get_user_model()

class AdminUserListSerializer(serializers.ModelSerializer):
    event_types_count = serializers.IntegerField(read_only=True)
    bookings_count = serializers.IntegerField(read_only=True)
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'timezone',
                  'is_active', 'is_staff', 'is_superuser', 'email_verified',
                  'date_joined', 'last_login', 'event_types_count', 'bookings_count', 'total_revenue')

class AdminUserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'timezone',
                  'bio', 'is_active', 'is_staff', 'is_superuser', 'email_verified',
                  'date_joined', 'last_login')
        read_only_fields = ('id', 'is_staff', 'is_superuser', 'date_joined', 'last_login')

class AdminBookingSerializer(serializers.ModelSerializer):
    event_type_name = serializers.CharField(source='event_type.name', read_only=True)
    host_username = serializers.CharField(source='event_type.host.username', read_only=True)
    host_email = serializers.EmailField(source='event_type.host.email', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'event_type', 'event_type_name', 'host_username', 'host_email',
            'invitee_name', 'invitee_email', 'invitee_timezone',
            'start_datetime', 'end_datetime', 'status', 'payment_status',
            'notes', 'custom_answers',
            'created_at', 'updated_at',
        )

class AdminEventTypeSerializer(serializers.ModelSerializer):
    host_username = serializers.CharField(source='host.username', read_only=True)
    host_email = serializers.EmailField(source='host.email', read_only=True)
    bookings_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = EventType
        fields = (
            'id', 'host', 'host_username', 'host_email',
            'name', 'slug', 'description', 'duration', 'location_type', 'location_details',
            'color', 'is_active', 'buffer_before', 'buffer_after',
            'min_notice', 'max_advance_days', 'max_bookings_per_day',
            'price', 'currency', 'custom_questions', 'bookings_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'host', 'host_username', 'host_email', 'created_at', 'updated_at')

class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_event_types = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    bookings_today = serializers.IntegerField()
