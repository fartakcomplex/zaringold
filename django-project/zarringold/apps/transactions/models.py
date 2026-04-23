# Transactions app
from django.db import models
from django.conf import settings
import uuid


class Transaction(models.Model):
    """Financial transaction record"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    tx_type = models.CharField(max_length=20, choices=[
        ('deposit', 'واریز'),
        ('withdrawal', 'برداشت'),
        ('buy_gold', 'خرید طلا'),
        ('sell_gold', 'فروش طلا'),
        ('referral_reward', 'جایزه دعوت'),
        ('admin_adjustment', 'تعدیل ادمین'),
        ('cashback', 'کش‌بک'),
        ('transfer', 'انتقال'),
    ])
    amount_fiat = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    amount_gold = models.DecimalField(max_digits=12, decimal_places=6, default=0)
    fee = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    gold_price = models.DecimalField(max_digits=14, decimal_places=0, null=True, blank=True)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'در انتظار'),
        ('success', 'موفق'),
        ('failed', 'ناموفق'),
        ('cancelled', 'لغو شده'),
    ])
    reference_id = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='received_transactions')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تراکنش'
        verbose_name_plural = 'تراکنش‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.tx_type} - {self.reference_id}'
