from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('invitee_name', 'invitee_email', 'event_type', 'start_datetime', 'status', 'payment_status')
    list_filter = ('status', 'payment_status')
    search_fields = ('invitee_name', 'invitee_email')
