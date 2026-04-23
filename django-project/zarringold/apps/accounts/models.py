from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid


class User(AbstractUser):
    """Custom user model for Zarrin Gold"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15, unique=True, db_index=True, verbose_name='شماره موبایل')
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name='ایمیل')
    full_name = models.CharField(max_length=150, blank=True, default='', verbose_name='نام کامل')
    is_verified = models.BooleanField(default=False, verbose_name='تایید شده')
    is_frozen = models.BooleanField(default=False, verbose_name='مسدود')
    role = models.CharField(max_length=20, default='user', choices=[
        ('user', 'کاربر'),
        ('vip', 'VIP'),
        ('admin', 'مدیر'),
    ])
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    referral_code = models.CharField(max_length=10, unique=True, db_index=True, verbose_name='کد دعوت')
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals')
    last_login_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.full_name or self.phone}'

    @property
    def is_kyc_approved(self):
        return hasattr(self, 'kyc') and self.kyc.status == 'approved'


class OTPCode(models.Model):
    """One-time password for authentication"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='otp_codes')
    phone = models.CharField(max_length=15, db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, default='login', choices=[
        ('login', 'ورود'),
        ('register', 'ثبت‌نام'),
        ('reset', 'بازیابی'),
    ])
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=5)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'کد OTP'
        verbose_name_plural = 'کدهای OTP'
        ordering = ['-created_at']

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def is_max_attempts_reached(self):
        return self.attempts >= self.max_attempts


class UserSession(models.Model):
    """User session tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    token = models.CharField(max_length=500, unique=True)
    device = models.CharField(max_length=200, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'نشست کاربر'
        verbose_name_plural = 'نشست‌های کاربر'
