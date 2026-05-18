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
        send_booking_confirmation.delay(str(booking.id))

        reminder_24h = booking.start_datetime - timedelta(hours=24)
        if reminder_24h > timezone.now():
            send_booking_reminder.apply_async(
                args=[str(booking.id), 24],
                eta=reminder_24h,
            )

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
