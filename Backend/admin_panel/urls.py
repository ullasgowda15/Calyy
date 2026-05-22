from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.admin_login, name='admin_login'),
    path('verify-2fa/', views.admin_verify_2fa, name='admin_verify_2fa'),
    path('setup-2fa/', views.admin_setup_2fa, name='admin_setup_2fa'),
    path('verify-2fa-setup/', views.admin_verify_2fa_setup, name='admin_verify_2fa_setup'),
    path('disable-2fa/', views.admin_disable_2fa, name='admin_disable_2fa'),
    path('2fa-status/', views.admin_2fa_status, name='admin_2fa_status'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('users/', views.admin_users, name='admin_users'),
    path('users/<uuid:user_id>/', views.admin_user_detail, name='admin_user_detail'),
    path('bookings/', views.admin_bookings, name='admin_bookings'),
    path('event-types/', views.admin_event_types, name='admin_event_types'),
    path('revenue/', views.admin_revenue, name='admin_revenue'),
    path('analytics/', views.admin_analytics, name='admin_analytics'),
    path('action-log/', views.admin_action_log, name='admin_action_log'),
]
