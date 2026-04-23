# Referrals app
from django.db import models
from django.conf import settings
import uuid


class Referral(models.Model):
    """Referral tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='referrals_made')
    referred = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='referral')
    reward_type = models.CharField(max_length=20, default='cash', choices=[
        ('cash', 'نقدی'),
        ('gold', 'طلایی'),
        ('coupon', 'کوپن'),
    ])
    reward_amount = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'در انتظار'),
        ('claimed', 'دریافت شده'),
        ('expired', 'منقضی'),
    ])
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'دعوت'
        verbose_name_plural = 'دعوت‌ها'

    def __str__(self):
        return f'{self.referrer.phone} → {self.referred.phone}'
