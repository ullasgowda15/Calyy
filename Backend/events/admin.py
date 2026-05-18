from django.contrib import admin
from .models import EventType, Availability, BlockedTime

@admin.register(EventType)
class EventTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'host', 'duration', 'is_active', 'price')
    list_filter = ('is_active', 'location_type')

admin.site.register(Availability)
admin.site.register(BlockedTime)
