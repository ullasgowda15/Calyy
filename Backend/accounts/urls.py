from django.urls import path
from .views import RegisterView, LoginView, TokenRefreshThrottledView, ProfileView, PublicProfileView, AvatarUploadView, password_reset_request, password_reset_confirm, check_username, check_phone, verify_email, resend_otp, change_password

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshThrottledView.as_view(), name='token_refresh'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar_upload'),
    path('me/change-password/', change_password, name='change_password'),
    path('check-username/', check_username, name='check_username'),
    path('check-phone/', check_phone, name='check_phone'),
    path('users/<slug:username>/', PublicProfileView.as_view(), name='public_profile'),
    path('password-reset/', password_reset_request, name='password_reset_request'),
    path('password-reset/confirm/<uidb64>/<token>/', password_reset_confirm, name='password_reset_confirm'),
    path('verify-email/', verify_email, name='verify_email'),
    path('resend-otp/', resend_otp, name='resend_otp'),
]
