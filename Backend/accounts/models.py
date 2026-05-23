import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
import pytz

VALID_TIMEZONES = pytz.all_timezones


def validate_timezone(value):
    import django.core.exceptions
    if value not in VALID_TIMEZONES:
        raise django.core.exceptions.ValidationError(f'"{value}" is not a valid timezone.')


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.SlugField(unique=True, max_length=60, error_messages={'invalid': 'Enter a valid username consisting of letters, numbers, underscores or hyphens.'})
    timezone = models.CharField(max_length=64, default='UTC', validators=[validate_timezone])
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    email_verified = models.BooleanField(default=False)

    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)

    SUBSCRIPTION_CHOICES = (
        ('free_trial', 'Free Trial'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    )
    subscription_status = models.CharField(
        max_length=20, choices=SUBSCRIPTION_CHOICES, default='free_trial'
    )
    trial_started_at = models.DateTimeField(null=True, blank=True)
    subscribed_until = models.DateTimeField(null=True, blank=True)
    razorpay_subscription_order_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_subscription_payment_id = models.CharField(max_length=100, blank=True, default='')

    def is_subscribed(self):
        from django.utils import timezone
        from datetime import timedelta
        if self.subscription_status == 'active' and self.subscribed_until and self.subscribed_until > timezone.now():
            return True
        if self.subscription_status == 'free_trial' and self.trial_started_at:
            if timezone.now() < self.trial_started_at + timedelta(days=7):
                return True
        return False

    def __str__(self):
        return self.email


class EmailVerificationOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=10)
