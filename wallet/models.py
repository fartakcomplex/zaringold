from django.db import models
from core.models import BaseModel
from authentication.models import User


class Wallet(BaseModel):
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    balance = models.FloatField(default=0)
    frozenBalance = models.FloatField(default=0)

    class Meta:
        db_table = "wallet_wallet"

    def __str__(self):
        return f"Wallet({self.userId})"


class GoldWallet(BaseModel):
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="goldWallet",
    )
    goldGrams = models.FloatField(default=0)
    frozenGold = models.FloatField(default=0)

    class Meta:
        db_table = "wallet_goldwallet"

    def __str__(self):
        return f"GoldWallet({self.userId})"


class GoldLoan(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="goldLoans",
    )
    amountRequested = models.FloatField()
    goldCollateral = models.FloatField()
    goldPriceAtLoan = models.FloatField()
    ltvRatio = models.FloatField(default=0.7)
    interestRate = models.FloatField(default=0.05)
    durationDays = models.IntegerField(default=30)
    amountApproved = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=50, default="pending")
    adminNote = models.TextField(default="")
    reviewedBy = models.CharField(max_length=30, default="")
    reviewedAt = models.DateTimeField(null=True, blank=True)
    approvedAt = models.DateTimeField(null=True, blank=True)
    dueDate = models.DateTimeField(null=True, blank=True)
    repaidAmount = models.FloatField(default=0)
    penaltyAmount = models.FloatField(default=0)

    class Meta:
        db_table = "wallet_goldloan"

    def __str__(self):
        return f"GoldLoan({self.userId}, {self.status})"


class LoanRepayment(BaseModel):
    loanId = models.ForeignKey(
        GoldLoan,
        on_delete=models.CASCADE,
        related_name="repayments",
    )
    amount = models.FloatField()
    penalty = models.FloatField(default=0)
    method = models.CharField(max_length=50, default="wallet")
    status = models.CharField(max_length=50, default="completed")
    description = models.TextField(default="")

    class Meta:
        db_table = "wallet_loanrepayment"

    def __str__(self):
        return f"LoanRepayment({self.loanId_id}, {self.amount})"


class Payment(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    authority = models.CharField(max_length=255, unique=True)
    amount = models.FloatField()
    description = models.CharField(max_length=255, default="شارژ کیف پول زرین گلد")
    status = models.CharField(max_length=50, default="pending")
    provider = models.CharField(max_length=50, default="zarinpal")
    refId = models.CharField(max_length=255, default="")
    cardPan = models.CharField(max_length=50, default="")
    fee = models.FloatField(default=0)
    verifiedAt = models.DateTimeField(null=True, blank=True)
    paidAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "wallet_payment"

    def __str__(self):
        return f"Payment({self.authority}, {self.status})"
