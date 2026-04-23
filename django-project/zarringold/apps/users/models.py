# Users app
from django.db import models
from django.conf import settings
import uuid


class Profile(models.Model):
    """Extended user profile"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    national_id = models.CharField(max_length=10, blank=True, verbose_name='کد ملی')
    birth_date = models.CharField(max_length=10, blank=True, verbose_name='تاریخ تولد')
    iban = models.CharField(max_length=26, blank=True, verbose_name='شماره شبا')
    bank_card = models.CharField(max_length=16, blank=True, verbose_name='شماره کارت بانکی')
    province = models.CharField(max_length=50, blank=True, verbose_name='استان')
    city = models.CharField(max_length=50, blank=True, verbose_name='شهر')
    address = models.TextField(blank=True, verbose_name='آدرس')
    postal_code = models.CharField(max_length=10, blank=True, verbose_name='کد پستی')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'پروفایل'
        verbose_name_plural = 'پروفایل‌ها'

    def __str__(self):
        return f'پروفایل {self.user.phone}'


class AuditLog(models.Model):
    """System audit log"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='audit_logs')
    action = models.CharField(max_length=100)
    details = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'لاگ ممیزی'
        verbose_name_plural = 'لاگ‌های ممیزی'
        ordering = ['-created_at']
