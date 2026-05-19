from django.urls import path
from .views import CreateBookingView, HostBookingListView, BookingDetailView, cancel_booking, reschedule_booking, reschedule_by_token, update_booking_status

urlpatterns = [
    path('', CreateBookingView.as_view(), name='create_booking'),
    path('my/', HostBookingListView.as_view(), name='host_bookings'),
    path('<uuid:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    path('<uuid:booking_id>/cancel/', cancel_booking, name='cancel_booking'),
    path('<uuid:booking_id>/reschedule/', reschedule_booking, name='reschedule_booking'),
    path('reschedule/<uuid:reschedule_token>/', reschedule_by_token, name='reschedule_by_token'),
    path('<uuid:booking_id>/status/', update_booking_status, name='update_booking_status'),
]
