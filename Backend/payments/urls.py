from django.urls import path
from .views import (
    create_razorpay_order,
    verify_payment,
    payment_status,
    razorpay_webhook,
    refund_booking,
    cancel_pending_booking,
    create_subscription_order,
    verify_subscription,
    subscription_status,
)

urlpatterns = [
    path('create-order/', create_razorpay_order, name='create_razorpay_order'),
    path('verify/', verify_payment, name='verify_payment'),
    path('cancel-pending/', cancel_pending_booking, name='cancel_pending_booking'),
    path('webhook/', razorpay_webhook, name='razorpay_webhook'),
    path('<uuid:booking_id>/status/', payment_status, name='payment_status'),
    path('<uuid:booking_id>/refund/', refund_booking, name='refund_booking'),
    path('subscription/create-order/', create_subscription_order, name='create_subscription_order'),
    path('subscription/verify/', verify_subscription, name='verify_subscription'),
    path('subscription/status/', subscription_status, name='subscription_status'),
]
