from django.db import models
from core.models import BaseModel
from authentication.models import User


class Merchant(BaseModel):
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="merchant",
    )
    businessName = models.CharField(max_length=255)
    businessType = models.CharField(max_length=50, default="online")
    website = models.CharField(max_length=500, default="")
    logo = models.CharField(max_length=500, default="")
    description = models.TextField(default="")
    iban = models.CharField(max_length=50, default="")
    settlementType = models.CharField(max_length=50, default="toman")
    settlementFreq = models.CharField(max_length=50, default="daily")
    feeRate = models.FloatField(default=0.01)
    minFee = models.FloatField(default=0)
    maxFee = models.FloatField(default=500000)
    isActive = models.BooleanField(default=True)
    isVerified = models.BooleanField(default=False)
    kycStatus = models.CharField(max_length=50, default="pending")
    totalSales = models.FloatField(default=0)
    totalSalesGold = models.FloatField(default=0)
    totalSettled = models.FloatField(default=0)
    totalSettledGold = models.FloatField(default=0)
    pendingSettle = models.FloatField(default=0)
    pendingSettleGold = models.FloatField(default=0)
    riskScore = models.FloatField(default=0)
    webhookUrl = models.CharField(max_length=500, default="")
    webhookSecret = models.CharField(max_length=255, default="")
    brandingColor = models.CharField(max_length=20, default="#D4AF37")

    class Meta:
        db_table = "gateway_merchant"

    def __str__(self):
        return f"Merchant({self.businessName})"


class ApiKey(BaseModel):
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="apiKeys",
    )
    keyHash = models.CharField(max_length=255, unique=True)
    keyPrefix = models.CharField(max_length=20, default="")
    keyType = models.CharField(max_length=50, default="live")
    name = models.CharField(max_length=255, default="Default Key")
    isActive = models.BooleanField(default=True)
    lastUsedAt = models.DateTimeField(null=True, blank=True)
    expiresAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gateway_apikey"

    def __str__(self):
        return f"ApiKey({self.name}, {self.keyType})"


class GatewayPayment(BaseModel):
    authority = models.CharField(max_length=255, unique=True)
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="gatewayPayments",
        null=True,
        blank=True,
    )
    amountToman = models.FloatField()
    amountGold = models.FloatField(default=0)
    goldGrams = models.FloatField(default=0)
    feeToman = models.FloatField(default=0)
    feeGold = models.FloatField(default=0)
    paymentMethod = models.CharField(max_length=50, default="toman")
    status = models.CharField(max_length=50, default="pending")
    refId = models.CharField(max_length=255, default="")
    description = models.TextField(default="")
    callbackUrl = models.CharField(max_length=500, default="")
    customerPhone = models.CharField(max_length=50, default="")
    customerEmail = models.CharField(max_length=255, default="")
    customerName = models.CharField(max_length=255, default="")
    cardPan = models.CharField(max_length=50, default="")
    goldPriceAtPay = models.FloatField(null=True, blank=True)
    metadata = models.TextField(default="{}")
    paidAt = models.DateTimeField(null=True, blank=True)
    verifiedAt = models.DateTimeField(null=True, blank=True)
    settledAt = models.DateTimeField(null=True, blank=True)
    expiresAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gateway_gatewaypayment"

    def __str__(self):
        return f"GatewayPayment({self.authority}, {self.status})"


class GatewayRefund(BaseModel):
    paymentId = models.ForeignKey(
        GatewayPayment,
        on_delete=models.CASCADE,
        related_name="refunds",
    )
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="refunds",
    )
    amountToman = models.FloatField(default=0)
    amountGold = models.FloatField(default=0)
    reason = models.TextField(default="")
    status = models.CharField(max_length=50, default="pending")
    refundMethod = models.CharField(max_length=50, default="original")
    processedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gateway_gatewayrefund"

    def __str__(self):
        return f"GatewayRefund({self.paymentId_id}, {self.status})"


class Settlement(BaseModel):
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="settlements",
    )
    amountToman = models.FloatField()
    amountGold = models.FloatField(default=0)
    feeToman = models.FloatField(default=0)
    type = models.CharField(max_length=50, default="auto")
    periodStart = models.DateTimeField(null=True, blank=True)
    periodEnd = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default="pending")
    iban = models.CharField(max_length=50, default="")
    transactionRef = models.CharField(max_length=255, default="")
    processedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gateway_settlement"

    def __str__(self):
        return f"Settlement({self.merchantId_id}, {self.amountToman})"


class WebhookLog(BaseModel):
    paymentId = models.ForeignKey(
        GatewayPayment,
        on_delete=models.CASCADE,
        related_name="webhookLogs",
    )
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="webhookLogs",
    )
    url = models.CharField(max_length=500)
    method = models.CharField(max_length=10, default="POST")
    payload = models.TextField(default="")
    response = models.TextField(default="")
    statusCode = models.IntegerField(default=0)
    success = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        db_table = "gateway_webhooklog"

    def __str__(self):
        return f"WebhookLog({self.url}, {self.success})"


class Invoice(BaseModel):
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    invoiceNumber = models.CharField(max_length=100, unique=True)
    customerName = models.CharField(max_length=255, default="")
    customerPhone = models.CharField(max_length=50, default="")
    customerEmail = models.CharField(max_length=255, default="")
    items = models.TextField(default="[]")
    amountToman = models.FloatField()
    amountGold = models.FloatField(default=0)
    taxToman = models.FloatField(default=0)
    discountToman = models.FloatField(default=0)
    totalToman = models.FloatField()
    totalGold = models.FloatField(default=0)
    status = models.CharField(max_length=50, default="pending")
    dueDate = models.DateTimeField(null=True, blank=True)
    paidAt = models.DateTimeField(null=True, blank=True)
    paymentId = models.CharField(max_length=30, default="")

    class Meta:
        db_table = "gateway_invoice"

    def __str__(self):
        return f"Invoice({self.invoiceNumber})"


class QrCode(BaseModel):
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="qrCodes",
    )
    title = models.CharField(max_length=255)
    amountToman = models.FloatField()
    amountGold = models.FloatField(default=0)
    isFixed = models.BooleanField(default=False)
    isActive = models.BooleanField(default=True)
    scanCount = models.IntegerField(default=0)
    token = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "gateway_qrcode"

    def __str__(self):
        return f"QrCode({self.title})"


class RiskEvent(BaseModel):
    paymentId = models.CharField(max_length=30, default="")
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="riskEvents",
        null=True,
        blank=True,
    )
    merchantId = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="riskEvents",
        null=True,
        blank=True,
    )
    eventType = models.CharField(max_length=100)
    riskScore = models.FloatField(default=0)
    details = models.TextField(default="")
    isResolved = models.BooleanField(default=False)
    resolveNote = models.TextField(default="")
    resolvedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gateway_riskevent"

    def __str__(self):
        return f"RiskEvent({self.eventType}, {self.riskScore})"
