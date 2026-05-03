"""
Serializers for the gold app.

Handles gold prices, price history, price alerts, and transactions.
"""

from rest_framework import serializers
from gold.models import GoldPrice, PriceHistory, PriceAlert, Transaction


class GoldPriceSerializer(serializers.ModelSerializer):
    """Serializer for current gold price data."""

    class Meta:
        model = GoldPrice
        fields = [
            'id', 'buyPrice', 'sellPrice', 'marketPrice',
            'ouncePrice', 'spread', 'currency', 'isManual',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class PriceHistorySerializer(serializers.ModelSerializer):
    """Serializer for historical price data (OHLCV)."""

    class Meta:
        model = PriceHistory
        fields = [
            'id', 'price', 'interval', 'openPrice', 'highPrice',
            'lowPrice', 'closePrice', 'volume', 'timestamp',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class PriceAlertSerializer(serializers.ModelSerializer):
    """Serializer for user-configured price alerts."""

    class Meta:
        model = PriceAlert
        fields = [
            'id', 'userId', 'type', 'condition', 'targetPrice',
            'isActive', 'isTriggered', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'userId', 'isTriggered', 'createdAt', 'updatedAt']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for gold transaction records."""

    class Meta:
        model = Transaction
        fields = [
            'id', 'userId', 'type', 'amountFiat', 'amountGold',
            'fee', 'goldPrice', 'status', 'referenceId',
            'description', 'toUserId', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'userId', 'referenceId', 'status', 'createdAt', 'updatedAt',
        ]


class GoldBuySerializer(serializers.Serializer):
    """Serializer for gold buy requests."""
    amountFiat = serializers.FloatField(min_value=0)
    amountGold = serializers.FloatField(min_value=0, required=False, default=0)


class GoldSellSerializer(serializers.Serializer):
    """Serializer for gold sell requests."""
    amountGold = serializers.FloatField(min_value=0)
    amountFiat = serializers.FloatField(min_value=0, required=False, default=0)
