"""
Serializers for the wallet app.

Handles wallets, gold wallets, loans, loan repayments, and payments.
"""

from rest_framework import serializers
from wallet.models import Wallet, GoldWallet, GoldLoan, LoanRepayment, Payment


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for user fiat wallet."""

    class Meta:
        model = Wallet
        fields = ['id', 'userId', 'balance', 'frozenBalance', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'userId', 'balance', 'frozenBalance', 'createdAt', 'updatedAt']


class GoldWalletSerializer(serializers.ModelSerializer):
    """Serializer for user gold wallet."""

    class Meta:
        model = GoldWallet
        fields = ['id', 'userId', 'goldGrams', 'frozenGold', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'userId', 'goldGrams', 'frozenGold', 'createdAt', 'updatedAt']


class GoldLoanSerializer(serializers.ModelSerializer):
    """Serializer for gold-backed loans."""

    class Meta:
        model = GoldLoan
        fields = [
            'id', 'userId', 'amountRequested', 'goldCollateral',
            'goldPriceAtLoan', 'ltvRatio', 'interestRate', 'durationDays',
            'amountApproved', 'status', 'adminNote', 'reviewedBy',
            'reviewedAt', 'approvedAt', 'dueDate', 'repaidAmount',
            'penaltyAmount', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'userId', 'status', 'adminNote', 'reviewedBy',
            'reviewedAt', 'approvedAt', 'repaidAmount', 'penaltyAmount',
            'createdAt', 'updatedAt',
        ]


class LoanRepaymentSerializer(serializers.ModelSerializer):
    """Serializer for loan repayment records."""

    class Meta:
        model = LoanRepayment
        fields = [
            'id', 'loanId', 'amount', 'penalty', 'method',
            'status', 'description', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'status', 'createdAt', 'updatedAt']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions."""

    class Meta:
        model = Payment
        fields = [
            'id', 'userId', 'authority', 'amount', 'description',
            'status', 'provider', 'refId', 'cardPan', 'fee',
            'verifiedAt', 'paidAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'userId', 'authority', 'status', 'refId',
            'cardPan', 'fee', 'verifiedAt', 'paidAt',
            'createdAt', 'updatedAt',
        ]


class WalletDepositSerializer(serializers.Serializer):
    """Serializer for wallet deposit requests."""
    amount = serializers.FloatField(min_value=1000)
    description = serializers.CharField(max_length=255, required=False, default='')


class WalletWithdrawSerializer(serializers.Serializer):
    """Serializer for wallet withdrawal requests."""
    amount = serializers.FloatField(min_value=10000)
    iban = serializers.CharField(max_length=30, required=False)
    description = serializers.CharField(max_length=255, required=False, default='')


class LoanRepayRequestSerializer(serializers.Serializer):
    """Serializer for loan repayment requests."""
    amount = serializers.FloatField(min_value=1000)
    method = serializers.CharField(max_length=50, default='wallet')


class DepositCreateSerializer(serializers.Serializer):
    """Serializer for creating a deposit payment."""
    amount = serializers.FloatField(min_value=1000)
    callback_url = serializers.URLField(required=False)
    description = serializers.CharField(max_length=255, required=False, default='')


class DepositVerifySerializer(serializers.Serializer):
    """Serializer for verifying a deposit payment."""
    authority = serializers.CharField(max_length=255)
