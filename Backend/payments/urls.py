from django.urls import path
from .views import create_payment_intent, payment_status, confirm_booking_payment, stripe_webhook, refund_booking

urlpatterns = [
    path('create-intent/', create_payment_intent, name='create_payment_intent'),
    path('confirm-payment/', confirm_booking_payment, name='confirm_booking_payment'),
    path('webhook/', stripe_webhook, name='stripe_webhook'),
    path('<uuid:booking_id>/status/', payment_status, name='payment_status'),
    path('<uuid:booking_id>/refund/', refund_booking, name='refund_booking'),
]
