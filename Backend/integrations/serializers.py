from rest_framework import serializers
from .models import WebhookSubscription


class WebhookSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookSubscription
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at')
