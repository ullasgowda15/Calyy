from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_slots(request, username, pk):
    event_type = get_object_or_404(EventType, pk=pk, is_active=True)
    if event_type.host.username != username:
        return Response({'error': 'Event type not found'}, status=404)
    date_str = request.query_params.get('date')
    if not date_str:
        return Response({'error': 'date parameter required (YYYY-MM-DD)'}, status=400)
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return Response({'error': 'Invalid date format'}, status=400)
    slots = get_available_slots(event_type, target_date, event_type.host.timezone)
    return Response({'date': date_str, 'slots': slots})


class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)


class BlockedTimeViewSet(viewsets.ModelViewSet):
    serializer_class = BlockedTimeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return BlockedTime.objects.filter(user=self.request.user)
