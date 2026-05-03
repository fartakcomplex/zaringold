from rest_framework import serializers
from .models import (
    Merchant, ApiKey, GatewayPayment, GatewayRefund,
    Settlement, WebhookLog, Invoice, QrCode, RiskEvent,
)


class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = [
            'id', 'userId', 'businessName', 'businessType', 'website',
            'logo', 'description', 'iban', 'settlementType', 'settlementFreq',
            'feeRate', 'minFee', 'maxFee', 'isActive', 'isVerified',
            'kycStatus', 'totalSales', 'totalSalesGold', 'totalSettled',
            'totalSettledGold', 'pendingSettle', 'pendingSettleGold',
            'riskScore', 'webhookUrl', 'webhookSecret', 'brandingColor',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'isVerified', 'kycStatus', 'totalSales', 'totalSalesGold',
            'totalSettled', 'totalSettledGold', 'pendingSettle', 'pendingSettleGold',
            'riskScore', 'createdAt', 'updatedAt',
        ]


class MerchantRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = [
            'businessName', 'businessType', 'website', 'logo',
            'description', 'iban', 'settlementType', 'settlementFreq',
            'webhookUrl', 'brandingColor',
        ]

    def create(self, validated_data):
        validated_data['userId'] = self.context['request'].user
        return super().create(validated_data)


class ApiKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiKey
        fields = [
            'id', 'merchantId', 'keyPrefix', 'keyType', 'name',
            'isActive', 'lastUsedAt', 'expiresAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'keyPrefix', 'lastUsedAt', 'createdAt', 'updatedAt']

    def create(self, validated_data):
        import secrets
        import hashlib
        raw_key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        prefix = raw_key[:8]
        validated_data['keyHash'] = key_hash
        validated_data['keyPrefix'] = prefix
        instance = super().create(validated_data)
        instance._raw_key = raw_key
        return instance


class ApiKeyCreateResponseSerializer(ApiKeySerializer):
    rawKey = serializers.SerializerMethodField()

    class Meta(ApiKeySerializer.Meta):
        fields = ApiKeySerializer.Meta.fields + ['rawKey']

    def get_rawKey(self, obj):
        return getattr(obj, '_raw_key', None)


class GatewayPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GatewayPayment
        fields = [
            'id', 'authority', 'merchantId', 'userId', 'amountToman',
            'amountGold', 'goldGrams', 'feeToman', 'feeGold', 'paymentMethod',
            'status', 'refId', 'description', 'callbackUrl', 'customerPhone',
            'customerEmail', 'customerName', 'cardPan', 'goldPriceAtPay',
            'metadata', 'paidAt', 'verifiedAt', 'settledAt', 'expiresAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'authority', 'feeToman', 'feeGold', 'status', 'refId',
            'cardPan', 'goldPriceAtPay', 'paidAt', 'verifiedAt', 'settledAt',
            'createdAt', 'updatedAt',
        ]


class GatewayPaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating a gateway payment."""
    merchantId = serializers.CharField()
    amountToman = serializers.FloatField(default=0)
    amountGold = serializers.FloatField(default=0)
    goldGrams = serializers.FloatField(default=0)
    paymentMethod = serializers.CharField(default="toman")
    description = serializers.CharField(default="", required=False)
    callbackUrl = serializers.CharField(default="")
    customerPhone = serializers.CharField(default="", required=False)
    customerEmail = serializers.CharField(default="", required=False)
    customerName = serializers.CharField(default="", required=False)
    metadata = serializers.CharField(default="{}", required=False)


class GatewayPaymentExecuteSerializer(serializers.Serializer):
    """Serializer for executing a gateway payment."""
    authority = serializers.CharField()
    refId = serializers.CharField(default="")


class GatewayRefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = GatewayRefund
        fields = [
            'id', 'paymentId', 'merchantId', 'amountToman', 'amountGold',
            'reason', 'status', 'refundMethod', 'processedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'status', 'processedAt', 'createdAt', 'updatedAt']


class SettlementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = [
            'id', 'merchantId', 'amountToman', 'amountGold', 'feeToman',
            'type', 'periodStart', 'periodEnd', 'status', 'iban',
            'transactionRef', 'processedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'processedAt', 'createdAt', 'updatedAt']


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'merchantId', 'invoiceNumber', 'customerName',
            'customerPhone', 'customerEmail', 'items', 'amountToman',
            'amountGold', 'taxToman', 'discountToman', 'totalToman',
            'totalGold', 'status', 'dueDate', 'paidAt', 'paymentId',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'invoiceNumber', 'createdAt', 'updatedAt']


class QrCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QrCode
        fields = [
            'id', 'merchantId', 'title', 'amountToman', 'amountGold',
            'isFixed', 'isActive', 'scanCount', 'token',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'token', 'scanCount', 'createdAt', 'updatedAt']


class WebhookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookLog
        fields = [
            'id', 'paymentId', 'merchantId', 'url', 'method', 'payload',
            'response', 'statusCode', 'success', 'attempts',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = fields


class RiskEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskEvent
        fields = [
            'id', 'paymentId', 'userId', 'merchantId', 'eventType',
            'riskScore', 'details', 'isResolved', 'resolveNote',
            'resolvedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class GatewayOverviewSerializer(serializers.Serializer):
    """Serializer for admin gateway overview."""
    totalMerchants = serializers.IntegerField()
    activeMerchants = serializers.IntegerField()
    totalPayments = serializers.IntegerField()
    totalPaymentVolume = serializers.FloatField()
    totalSettlements = serializers.FloatField()
    pendingSettlements = serializers.FloatField()
    totalRefunds = serializers.FloatField()
    totalFeesCollected = serializers.FloatField()
