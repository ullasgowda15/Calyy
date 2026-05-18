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
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def get_booking_url(self, obj):
        from django.conf import settings
        return f"{settings.BASE_URL}/book/{obj.host.username}/{obj.slug}/"

    def validate(self, data):
        if 'name' in data and not data.get('slug'):
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
