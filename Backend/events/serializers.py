from rest_framework import serializers
from django.utils.text import slugify
from .models import EventType, Availability, BlockedTime


class EventTypeSerializer(serializers.ModelSerializer):
    host = serializers.UUIDField(source='host.id', read_only=True)
    host_username = serializers.CharField(source='host.username', read_only=True)
    host_avatar = serializers.ImageField(source='host.avatar', read_only=True)
    host_bio = serializers.CharField(source='host.bio', read_only=True)
    host_first_name = serializers.CharField(source='host.first_name', read_only=True)
    booking_url = serializers.SerializerMethodField()

    class Meta:
        model = EventType
        fields = (
            'id', 'host', 'host_username', 'host_avatar', 'host_bio', 'host_first_name',
            'name', 'slug', 'description', 'duration', 'location_type', 'location_details',
            'color', 'is_active', 'buffer_before', 'buffer_after',
            'min_notice', 'max_advance_days', 'max_bookings_per_day',
            'price', 'currency', 'custom_questions', 'booking_url',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'host', 'created_at', 'updated_at', 'host_username', 'host_avatar', 'host_bio', 'host_first_name', 'booking_url')
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def get_booking_url(self, obj):
        from django.conf import settings
        return f"{settings.BASE_URL}/book/{obj.host.username}/{obj.slug}/"

    def validate(self, data):
        if 'name' in data and not data.get('slug'):
            data['slug'] = slugify(data['name'])
        if self.instance:
            host = self.instance.host
        else:
            host = self.context['request'].user
        slug = data.get('slug', self.instance.slug if self.instance else '')
        qs = EventType.objects.filter(host=host, slug=slug)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'slug': 'An event type with this name already exists.'})
        return data

    def create(self, validated_data):
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ('id', 'user', 'weekday', 'start_time', 'end_time', 'is_active')
        read_only_fields = ('id', 'user')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BlockedTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedTime
        fields = ('id', 'user', 'start_datetime', 'end_datetime', 'reason')
        read_only_fields = ('id', 'user')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
