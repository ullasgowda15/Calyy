import pyotp
import qrcode
import io
import base64
from datetime import datetime, date, timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone as tz_utils

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import TOTPSecret, AdminActionLog
from .permissions import IsAdminStaff
from .serializers import (
    AdminUserListSerializer, AdminUserDetailSerializer,
    AdminBookingSerializer, AdminEventTypeSerializer,
)
from events.models import EventType
from bookings.models import Booking

User = get_user_model()

def _log_action(admin, action, target_type='', target_id='', details=None):
    AdminActionLog.objects.create(
        admin=admin, action=action,
        target_type=target_type, target_id=target_id,
        details=details or {},
    )

# ── Login + 2FA (public) ─────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def admin_login(request):
    email = request.data.get('email', '')
    password = request.data.get('password', '')
    user = authenticate(request, email=email, password=password)
    if not user or not user.is_staff:
        return Response({'error': 'Invalid credentials'}, status=401)
    totp = TOTPSecret.objects.filter(user=user).first()
    if totp and totp.is_verified:
        return Response({'requires_2fa': True, 'user_id': str(user.id)})
    refresh = RefreshToken.for_user(user)
    _log_action(user, 'admin_login', 'user', str(user.id))
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': str(user.id), 'email': user.email, 'username': user.username},
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def admin_verify_2fa(request):
    user_id = request.data.get('user_id', '')
    code = request.data.get('code', '')
    try:
        user = User.objects.get(id=user_id, is_staff=True)
    except User.DoesNotExist:
        return Response({'error': 'Invalid user'}, status=400)
    totp = TOTPSecret.objects.filter(user=user).first()
    if not totp or not totp.is_verified:
        return Response({'error': '2FA not configured'}, status=400)
    totp_obj = pyotp.TOTP(totp.secret)
    if not totp_obj.verify(code, valid_window=1):
        return Response({'error': 'Invalid code'}, status=401)
    refresh = RefreshToken.for_user(user)
    _log_action(user, 'admin_login_2fa', 'user', str(user.id))
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': str(user.id), 'email': user.email, 'username': user.username},
    })

# ── 2FA Setup (admin only) ───────────────────────────

@api_view(['POST'])
@permission_classes([IsAdminStaff])
def admin_setup_2fa(request):
    secret = pyotp.random_base32()
    TOTPSecret.objects.update_or_create(
        user=request.user,
        defaults={'secret': secret, 'is_verified': False},
    )
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=request.user.email,
        issuer_name='Caly Admin',
    )
    qr = qrcode.make(uri)
    buf = io.BytesIO()
    qr.save(buf, format='PNG')
    qr_b64 = base64.b64encode(buf.getvalue()).decode()
    return Response({'secret': secret, 'qr_code': f'data:image/png;base64,{qr_b64}', 'uri': uri})

@api_view(['POST'])
@permission_classes([IsAdminStaff])
def admin_verify_2fa_setup(request):
    code = request.data.get('code', '')
    totp = TOTPSecret.objects.filter(user=request.user).first()
    if not totp:
        return Response({'error': 'No secret configured'}, status=400)
    totp_obj = pyotp.TOTP(totp.secret)
    if not totp_obj.verify(code, valid_window=1):
        return Response({'error': 'Invalid code'}, status=401)
    totp.is_verified = True
    totp.save(update_fields=['is_verified'])
    _log_action(request.user, '2fa_enabled', 'user', str(request.user.id))
    return Response({'status': '2FA enabled'})

@api_view(['POST'])
@permission_classes([IsAdminStaff])
def admin_disable_2fa(request):
    TOTPSecret.objects.filter(user=request.user).delete()
    _log_action(request.user, '2fa_disabled', 'user', str(request.user.id))
    return Response({'status': '2FA disabled'})

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_2fa_status(request):
    totp = TOTPSecret.objects.filter(user=request.user).first()
    return Response({
        'enabled': bool(totp and totp.is_verified),
        'pending_setup': bool(totp and not totp.is_verified),
    })

# ── Dashboard ────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_dashboard(request):
    now = tz_utils.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    total_users = User.objects.count()
    total_bookings = Booking.objects.count()
    total_revenue = Booking.objects.filter(
        status='confirmed'
    ).exclude(razorpay_payment_id='').aggregate(
        total=Sum('event_type__price')
    )['total'] or 0
    active_subscribers = User.objects.filter(
        subscription_status='active', subscribed_until__gte=now
    ).count()
    trial_users = User.objects.filter(subscription_status='free_trial').count()
    ever_subscribed = User.objects.exclude(razorpay_subscription_payment_id='').count()
    SUBSCRIPTION_PRICE = 499
    platform_revenue = ever_subscribed * SUBSCRIPTION_PRICE
    return Response({
        'total_users': total_users,
        'total_bookings': total_bookings,
        'total_revenue': float(total_revenue),
        'active_event_types': EventType.objects.filter(is_active=True).count(),
        'confirmed_bookings': Booking.objects.filter(status='confirmed').count(),
        'pending_bookings': Booking.objects.filter(status='pending').count(),
        'cancelled_bookings': Booking.objects.filter(status='cancelled').count(),
        'new_users_today': User.objects.filter(date_joined__gte=today_start).count(),
        'bookings_today': Booking.objects.filter(created_at__gte=today_start).count(),
        'active_subscribers': active_subscribers,
        'trial_users': trial_users,
        'platform_revenue': platform_revenue,
    })

# ── Users ────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_users(request):
    qs = User.objects.annotate(
        event_types_count=Count('event_types', distinct=True),
        bookings_count=Count('event_types__bookings', distinct=True),
        total_revenue=Sum('event_types__bookings__event_type__price',
            filter=Q(event_types__bookings__status='confirmed')),
    )
    search = request.query_params.get('search', '')
    is_active = request.query_params.get('is_active', '')
    is_staff = request.query_params.get('is_staff', '')
    sort_by = request.query_params.get('sort', '-date_joined')

    if search:
        qs = qs.filter(Q(email__icontains=search) | Q(username__icontains=search) |
                       Q(first_name__icontains=search) | Q(last_name__icontains=search))
    if is_active in ('true', 'false'):
        qs = qs.filter(is_active=is_active == 'true')
    if is_staff in ('true', 'false'):
        qs = qs.filter(is_staff=is_staff == 'true')
    allowed_sorts = ['date_joined', '-date_joined', 'email', '-email',
                     'username', '-username', 'last_login', '-last_login']
    if sort_by in allowed_sorts:
        qs = qs.order_by(sort_by)
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 20))
    total = qs.count()
    qs = qs[(page - 1) * per_page:page * per_page]
    return Response({
        'results': AdminUserListSerializer(qs, many=True).data,
        'total': total,
        'page': page,
        'per_page': per_page,
    })

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminStaff])
def admin_user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    if request.method == 'GET':
        return Response(AdminUserDetailSerializer(user).data)
    elif request.method == 'PATCH':
        data = request.data.copy()
        is_staff = data.get('is_staff')
        is_superuser = data.get('is_superuser')
        data.pop('is_staff', None)
        data.pop('is_superuser', None)
        ser = AdminUserDetailSerializer(user, data=data, partial=True)
        if ser.is_valid():
            ser.save()
            if request.user.is_superuser:
                changed = False
                if is_staff is not None and user.is_staff != is_staff:
                    user.is_staff = is_staff
                    changed = True
                if is_superuser is not None and user.is_superuser != is_superuser:
                    user.is_superuser = is_superuser
                    changed = True
                if changed:
                    user.save(update_fields=['is_staff', 'is_superuser'])
                    ser = AdminUserDetailSerializer(user)
            _log_action(request.user, 'user_updated', 'user', str(user.id), dict(request.data))
            return Response(ser.data)
        return Response(ser.errors, status=400)
    elif request.method == 'DELETE':
        uid = str(user.id)
        user.delete()
        _log_action(request.user, 'user_deleted', 'user', uid)
        return Response({'status': 'deleted'})

# ── Bookings ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_bookings(request):
    qs = Booking.objects.select_related('event_type__host')
    status_filter = request.query_params.get('status', '')
    payment_filter = request.query_params.get('payment_status', '')
    search = request.query_params.get('search', '')
    date_from = request.query_params.get('date_from', '')
    date_to = request.query_params.get('date_to', '')
    sort_by = request.query_params.get('sort', '-created_at')

    if status_filter:
        qs = qs.filter(status=status_filter)
    if payment_filter:
        qs = qs.filter(payment_status=payment_filter)
    if search:
        qs = qs.filter(Q(invitee_name__icontains=search) | Q(invitee_email__icontains=search))
    if date_from:
        qs = qs.filter(start_datetime__gte=date_from)
    if date_to:
        qs = qs.filter(start_datetime__lte=date_to)
    allowed_sorts = ['created_at', '-created_at', 'start_datetime', '-start_datetime',
                     'invitee_name', '-invitee_name']
    if sort_by in allowed_sorts:
        qs = qs.order_by(sort_by)
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 20))
    total = qs.count()
    qs = qs[(page - 1) * per_page:page * per_page]
    return Response({
        'results': AdminBookingSerializer(qs, many=True).data,
        'total': total,
        'page': page,
        'per_page': per_page,
    })

# ── Event Types ──────────────────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminStaff])
def admin_event_types(request):
    if request.method == 'GET':
        qs = EventType.objects.select_related('host').annotate(
            bookings_count=Count('bookings'))
        search = request.query_params.get('search', '')
        is_active = request.query_params.get('is_active', '')
        sort_by = request.query_params.get('sort', '-created_at')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(host__username__icontains=search))
        if is_active in ('true', 'false'):
            qs = qs.filter(is_active=is_active == 'true')
        allowed_sorts = ['created_at', '-created_at', 'name', '-name', 'duration', '-duration']
        if sort_by in allowed_sorts:
            qs = qs.order_by(sort_by)
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 20))
        total = qs.count()
        qs = qs[(page - 1) * per_page:page * per_page]
        return Response({
            'results': AdminEventTypeSerializer(qs, many=True).data,
            'total': total,
            'page': page,
            'per_page': per_page,
        })
    elif request.method == 'PATCH':
        event_id = request.data.get('id', '')
        try:
            et = EventType.objects.get(id=event_id)
        except EventType.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        ser = AdminEventTypeSerializer(et, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            _log_action(request.user, 'event_type_updated', 'event_type', str(et.id))
            return Response(ser.data)
        return Response(ser.errors, status=400)

# ── Revenue / Analytics ─────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_revenue(request):
    from django.db.models.functions import TruncWeek, TruncMonth
    days = int(request.query_params.get('days', 30))
    group = request.query_params.get('group', 'day')
    since = tz_utils.now() - timedelta(days=days)

    # Booking revenue per day/week/month
    if group == 'week':
        trunc_fn = TruncWeek
        label = 'week'
    elif group == 'month':
        trunc_fn = TruncMonth
        label = 'month'
    else:
        trunc_fn = TruncDate
        label = 'date'

    booking_revenue = (
        Booking.objects.filter(status='confirmed', created_at__gte=since)
        .exclude(razorpay_payment_id='')
        .annotate(period=trunc_fn('created_at'))
        .values('period')
        .annotate(amount=Sum('event_type__price'))
        .order_by('period')
    )
    platform_revenue = (
        User.objects.filter(subscribed_until__gte=since)
        .exclude(razorpay_subscription_payment_id='')
        .annotate(period=trunc_fn('subscribed_until'))
        .values('period')
        .annotate(amount=Count('id'))
        .order_by('period')
    )
    # platform revenue is ₹499 per subscription, distribute by subscribed_until date
    SUBSCRIPTION_PRICE = 499
    platform_series = [
        {'period': r['period'].isoformat() if r['period'] else None,
         'amount': float(r['amount'] * SUBSCRIPTION_PRICE)}
        for r in platform_revenue
    ]

    booking_series = [
        {'period': r['period'].isoformat() if r['period'] else None,
         'amount': float(r['amount'] or 0)}
        for r in booking_revenue
    ]

    # Per-user revenue breakdown
    per_user_revenue = (
        Booking.objects.filter(status='confirmed', created_at__gte=since)
        .exclude(razorpay_payment_id='')
        .values('event_type__host__id', 'event_type__host__email',
                'event_type__host__username', 'event_type__host__first_name')
        .annotate(total=Sum('event_type__price'), booking_count=Count('id'))
        .order_by('-total')
    )
    return Response({
        'booking_revenue': booking_series,
        'platform_revenue': platform_series,
        'combined_revenue': _merge_revenue_series(booking_series, platform_series, label),
        'total_booking': sum(item['amount'] for item in booking_series),
        'total_platform': sum(item['amount'] for item in platform_series),
        'per_user_revenue': [
            {
                'user_id': u['event_type__host__id'],
                'email': u['event_type__host__email'],
                'username': u['event_type__host__username'],
                'first_name': u['event_type__host__first_name'],
                'total_revenue': float(u['total'] or 0),
                'booking_count': u['booking_count'],
            } for u in per_user_revenue
        ],
        'period_days': days,
        'group': label,
    })

def _merge_revenue_series(booking_series, platform_series, label_key='date'):
    merged = {}
    for item in booking_series:
        key = item['period']
        if key:
            merged[key] = merged.get(key, {'booking': 0, 'platform': 0, label_key: key})
            merged[key]['booking'] += item['amount']
    for item in platform_series:
        key = item['period']
        if key:
            merged[key] = merged.get(key, {'booking': 0, 'platform': 0, label_key: key})
            merged[key]['platform'] += item['amount']
    return sorted(merged.values(), key=lambda x: x[label_key])

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_analytics(request):
    from django.db.models.functions import TruncWeek
    days = int(request.query_params.get('days', 30))
    since = tz_utils.now() - timedelta(days=days)
    bookings_by_day = (
        Booking.objects.filter(created_at__gte=since)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    bookings_by_week = (
        Booking.objects.filter(created_at__gte=since)
        .annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(count=Count('id'))
        .order_by('week')
    )
    revenue_by_week = (
        Booking.objects.filter(
            created_at__gte=since, status='confirmed'
        ).exclude(razorpay_payment_id='')
        .annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(total=Sum('event_type__price'))
        .order_by('week')
    )
    users_by_day = (
        User.objects.filter(date_joined__gte=since)
        .annotate(date=TruncDate('date_joined'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    status_distribution = (
        Booking.objects.values('status')
        .annotate(count=Count('id'))
    )
    top_users_by_bookings = (
        Booking.objects.filter(created_at__gte=since)
        .values('event_type__host__email', 'event_type__host__username')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    top_users_by_revenue = (
        Booking.objects.filter(
            created_at__gte=since, status='confirmed'
        ).exclude(razorpay_payment_id='')
        .values('event_type__host__email', 'event_type__host__username')
        .annotate(total=Sum('event_type__price'))
        .order_by('-total')[:10]
    )
    return Response({
        'bookings_by_day': list(bookings_by_day),
        'bookings_by_week': [
            {'week': b['week'].isoformat() if b['week'] else None, 'count': b['count']}
            for b in bookings_by_week
        ],
        'revenue_by_week': [
            {'week': r['week'].isoformat() if r['week'] else None, 'total': float(r['total'] or 0)}
            for r in revenue_by_week
        ],
        'users_by_day': list(users_by_day),
        'status_distribution': list(status_distribution),
        'top_users_by_bookings': [
            {
                'email': u['event_type__host__email'],
                'username': u['event_type__host__username'],
                'bookings': u['count'],
            } for u in top_users_by_bookings
        ],
        'top_users_by_revenue': [
            {
                'email': u['event_type__host__email'],
                'username': u['event_type__host__username'],
                'revenue': float(u['total'] or 0),
            } for u in top_users_by_revenue
        ],
    })

# ── Action Log ──────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminStaff])
def admin_action_log(request):
    qs = AdminActionLog.objects.select_related('admin')
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 30))
    total = qs.count()
    qs = qs[(page - 1) * per_page:page * per_page]
    return Response({
        'results': [{
            'id': str(a.id),
            'admin_email': a.admin.email if a.admin else 'N/A',
            'action': a.action,
            'target_type': a.target_type,
            'target_id': a.target_id,
            'details': a.details,
            'created_at': a.created_at.isoformat(),
        } for a in qs],
        'total': total,
        'page': page,
        'per_page': per_page,
    })
