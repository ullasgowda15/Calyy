from django.urls import path
from .views import create_payment_intent, payment_status, stripe_webhook, refund_booking

urlpatterns = [
    path('create-intent/', create_payment_intent, name='create_payment_intent'),
    path('webhook/', stripe_webhook, name='stripe_webhook'),
    path('<uuid:booking_id>/status/', payment_status, name='payment_status'),
    path('<uuid:booking_id>/refund/', refund_booking, name='refund_booking'),
]
