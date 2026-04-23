# KYC app
from django.db import models
from django.conf import settings
import uuid


class KYCRequest(models.Model):
    """KYC verification request"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc')
    id_card_image = models.ImageField(upload_to='kyc/id_cards/', verbose_name='تصویر کارت ملی')
    selfie_image = models.ImageField(upload_to='kyc/selfies/', verbose_name='عکس سلفی')
    bank_card_image = models.ImageField(upload_to='kyc/bank_cards/', verbose_name='تصویر کارت بانکی')
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'در انتظار'),
        ('approved', 'تایید شده'),
        ('rejected', 'رد شده'),
        ('need_revision', 'نیاز به اصلاح'),
    ])
    admin_note = models.TextField(blank=True, verbose_name='یادداشت ادمین')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='kyc_reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'درخواست احراز هویت'
        verbose_name_plural = 'درخواست‌های احراز هویت'

    def __str__(self):
        return f'KYC {self.user.phone} - {self.status}'
