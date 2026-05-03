from django.db import models
from django.utils import timezone
from core.models import BaseModel


class GoldPrice(BaseModel):
    """Current gold price information (buy, sell, market, ounce)."""
    buyPrice = models.FloatField()
    sellPrice = models.FloatField()
    marketPrice = models.FloatField()
    ouncePrice = models.FloatField()
    spread = models.FloatField(default=0)
    currency = models.CharField(max_length=10, default='IRR')
    isManual = models.BooleanField(default=False)

    class Meta:
        db_table = 'gold_gold_price'
        ordering = ['-createdAt']

    def __str__(self):
        return f"GoldPrice(buy={self.buyPrice}, sell={self.sellPrice})"


class PriceHistory(BaseModel):
    """Historical gold price data with OHLCV."""
    price = models.FloatField()
    interval = models.CharField(max_length=10, default='1h')
    openPrice = models.FloatField(default=0)
    highPrice = models.FloatField(default=0)
    lowPrice = models.FloatField(default=0)
    closePrice = models.FloatField(default=0)
    volume = models.FloatField(default=0)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'gold_price_history'
        ordering = ['-timestamp']

    def __str__(self):
        return f"PriceHistory({self.price}, {self.interval})"


class PriceAlert(BaseModel):
    """User-configured price alerts."""
    TYPE_CHOICES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ]
    CONDITION_CHOICES = [
        ('above', 'Above'),
        ('below', 'Below'),
    ]
    userId = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='price_alerts',
        db_column='userId',
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    targetPrice = models.FloatField()
    isActive = models.BooleanField(default=True)
    isTriggered = models.BooleanField(default=False)

    class Meta:
        db_table = 'gold_price_alert'
        ordering = ['-createdAt']

    def __str__(self):
        return f"PriceAlert({self.userId_id}, {self.type} {self.condition} {self.targetPrice})"


class Transaction(BaseModel):
    """Gold transaction records (buy, sell, transfer, etc.)."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    TYPE_CHOICES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
        ('transfer_in', 'Transfer In'),
        ('transfer_out', 'Transfer Out'),
        ('reward', 'Reward'),
        ('fee', 'Fee'),
    ]
    userId = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='transactions',
        db_column='userId',
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amountFiat = models.FloatField(default=0)
    amountGold = models.FloatField(default=0)
    fee = models.FloatField(default=0)
    goldPrice = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    referenceId = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    toUserId = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        db_table = 'gold_transaction'
        ordering = ['-createdAt']

    def __str__(self):
        return f"Transaction({self.referenceId}, {self.type}, {self.status})"
