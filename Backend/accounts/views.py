import secrets
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import update_session_auth_hash
from .serializers import RegisterSerializer, UserSerializer, PublicUserSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer, VerifyEmailSerializer, ResendOTPSerializer, ChangePasswordSerializer
from .models import User, EmailVerificationOTP
from .tasks import send_verification_otp, send_password_reset_email
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)
    throttle_scope = 'register'

    def perform_create(self, serializer):
        user = serializer.save()
        otp = f'{secrets.randbelow(900000) + 100000}'
        EmailVerificationOTP.objects.create(user=user, otp=otp)
        try:
            send_verification_otp.delay(str(user.id), otp)
        except Exception:
            pass
        return user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = User.objects.all()

    def get_object(self):
        return self.request.user


class AvatarUploadView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    queryset = User.objects.all()

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            user.save()
        return Response(UserSerializer(user).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='20/h', method='GET')
def check_username(request):
    username = request.query_params.get('username', '').strip()
    if not username:
        return Response({'available': False, 'error': 'username parameter required'}, status=200)
    exists = User.objects.filter(username=username).exists()
    return Response({'available': not exists, 'username': username})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='20/h', method='GET')
def check_phone(request):
    phone = request.query_params.get('phone', '').strip()
    if not phone:
        return Response({'available': False, 'error': 'phone parameter required'}, status=200)
    exists = User.objects.filter(phone=phone).exists()
    return Response({'available': not exists, 'phone': phone})


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'username'
    queryset = User.objects.all()


class LoginView(TokenObtainPairView):
    throttle_scope = 'login'


class TokenRefreshThrottledView(TokenRefreshView):
    throttle_scope = 'token-refresh'


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='5/h', method='POST')
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    users = User.objects.filter(email=email)
    if users.exists():
        user = users.first()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        try:
            send_password_reset_email.delay(email, reset_link)
        except Exception:
            pass
    return Response({'message': 'If an account with that email exists, a reset link has been sent.'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', method='POST')
def password_reset_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid link'}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Invalid or expired token'}, status=400)

    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'message': 'Password reset successfully'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='10/h', method='POST')
def verify_email(request):
    serializer = VerifyEmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid OTP'}, status=400)
    latest_otp = EmailVerificationOTP.objects.filter(user=user).last()
    if not latest_otp:
        return Response({'error': 'No OTP sent'}, status=400)
    if latest_otp.is_expired():
        return Response({'error': 'OTP expired. Request a new one.'}, status=400)
    if latest_otp.otp != otp:
        return Response({'error': 'Invalid OTP'}, status=400)
    user.email_verified = True
    user.save(update_fields=['email_verified'])
    return Response({'message': 'Email verified successfully'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ratelimit(key='ip', rate='5/h', method='POST')
def resend_otp(request):
    serializer = ResendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'If an account with that email exists, a new OTP has been sent.'})
    otp = f'{secrets.randbelow(900000) + 100000}'
    EmailVerificationOTP.objects.create(user=user, otp=otp)
    try:
        send_verification_otp.delay(str(user.id), otp)
    except Exception:
        pass
    return Response({'message': 'If an account with that email exists, a new OTP has been sent.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'error': 'Current password is incorrect'}, status=400)
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    update_session_auth_hash(request, user)
    return Response({'message': 'Password changed successfully'})
