# Wallets app
from django.db import models
from django.conf import settings
import uuid


class Wallet(models.Model):
    """Fiat wallet (Toman)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fiat_wallet')
    balance = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    frozen_balance = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'کیف پول ریالی'
        verbose_name_plural = 'کیف‌پول‌های ریالی'

    @property
    def available_balance(self):
        return self.balance - self.frozen_balance

    def __str__(self):
        return f'کیف پول {self.user.phone}'


class GoldWallet(models.Model):
    """Gold wallet (grams)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gold_wallet')
    gold_grams = models.DecimalField(max_digits=12, decimal_places=6, default=0)
    frozen_gold = models.DecimalField(max_digits=12, decimal_places=6, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'کیف پول طلایی'
        verbose_name_plural = 'کیف‌پول‌های طلایی'

    @property
    def available_gold(self):
        return self.gold_grams - self.frozen_gold

    def __str__(self):
        return f'کیف پول طلای {self.user.phone}'
