# Gold app
from django.db import models
import uuid


class GoldPrice(models.Model):
    """Current gold price"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buy_price = models.DecimalField(max_digits=14, decimal_places=0, verbose_name='قیمت خرید')
    sell_price = models.DecimalField(max_digits=14, decimal_places=0, verbose_name='قیمت فروش')
    market_price = models.DecimalField(max_digits=14, decimal_places=0, verbose_name='قیمت بازار')
    ounce_price = models.DecimalField(max_digits=14, decimal_places=0, verbose_name='قیمت اونس')
    spread = models.DecimalField(max_digits=14, decimal_places=0, default=0)
    currency = models.CharField(max_length=5, default='IRR')
    is_manual = models.BooleanField(default=False, verbose_name='تنظیم دستی')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'قیمت طلا'
        verbose_name_plural = 'قیمت‌های طلا'
        ordering = ['-created_at']

    def __str__(self):
        return f'قیمت طلا: خرید={self.buy_price}, فروش={self.sell_price}'


class PriceHistory(models.Model):
    """Historical price data for charts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price = models.DecimalField(max_digits=14, decimal_places=2)
    interval = models.CharField(max_length=5, default='1h', choices=[
        ('1m', '۱ دقیقه'), ('5m', '۵ دقیقه'), ('1h', '۱ ساعت'), ('1d', '۱ روز'),
    ])
    open_price = models.DecimalField(max_digits=14, decimal_places=2)
    high_price = models.DecimalField(max_digits=14, decimal_places=2)
    low_price = models.DecimalField(max_digits=14, decimal_places=2)
    close_price = models.DecimalField(max_digits=14, decimal_places=2)
    volume = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تاریخچه قیمت'
        verbose_name_plural = 'تاریخچه قیمت‌ها'
        ordering = ['-timestamp']
