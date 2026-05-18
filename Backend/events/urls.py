from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventTypeViewSet, AvailabilityViewSet, BlockedTimeViewSet, PublicEventTypeView, public_slots

router = DefaultRouter()
router.register('event-types', EventTypeViewSet, basename='event-types')
router.register('availability', AvailabilityViewSet, basename='availability')
router.register('blocked-times', BlockedTimeViewSet, basename='blocked-times')

urlpatterns = [
    path('', include(router.urls)),
    path('public/<slug:username>/event-types/', PublicEventTypeView.as_view({'get': 'list'})),
    path('public/<slug:username>/event-types/<uuid:pk>/', PublicEventTypeView.as_view({'get': 'retrieve'})),
    path('public/<slug:username>/event-types/<uuid:pk>/slots/', public_slots, name='public_slots'),
]
