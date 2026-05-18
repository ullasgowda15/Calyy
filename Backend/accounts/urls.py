from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView, PublicProfileView, AvatarUploadView, password_reset_request, password_reset_confirm

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar_upload'),
    path('users/<slug:username>/', PublicProfileView.as_view(), name='public_profile'),
    path('password-reset/', password_reset_request, name='password_reset_request'),
    path('password-reset/confirm/<uidb64>/<token>/', password_reset_confirm, name='password_reset_confirm'),
]
