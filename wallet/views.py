"""
Views for the wallet app.

Provides wallet balance queries, deposit/withdraw operations,
gold wallet access, loan management, payment processing,
and deposit verification.
"""

import secrets

from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from authentication.backends import TokenAuthentication
from wallet.models import Wallet, GoldWallet, GoldLoan, LoanRepayment, Payment
from wallet.serializers import (
    WalletSerializer,
    GoldWalletSerializer,
    GoldLoanSerializer,
    LoanRepaymentSerializer,
    PaymentSerializer,
    WalletDepositSerializer,
    WalletWithdrawSerializer,
    LoanRepayRequestSerializer,
    DepositCreateSerializer,
    DepositVerifySerializer,
)


# =============================================================================
# Helper
# =============================================================================

def _get_or_create_wallet(user):
    """Get or create a fiat wallet for the user."""
    wallet, created = Wallet.objects.get_or_create(
        userId=user,
        defaults={'balance': 0, 'frozenBalance': 0},
    )
    return wallet


def _get_or_create_gold_wallet(user):
    """Get or create a gold wallet for the user."""
    wallet, created = GoldWallet.objects.get_or_create(
        userId=user,
        defaults={'goldGrams': 0, 'frozenGold': 0},
    )
    return wallet


# =============================================================================
# Wallet Views
# =============================================================================

class WalletView(APIView):
    """
    GET /wallet/
    Returns the authenticated user's wallet balance.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = _get_or_create_wallet(request.user)
        return Response(WalletSerializer(wallet).data, status=status.HTTP_200_OK)


class WalletDepositView(APIView):
    """
    POST /wallet/deposit
    Deposit fiat into the user's wallet.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WalletDepositSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        description = serializer.validated_data.get('description', 'Wallet deposit')

        wallet = _get_or_create_wallet(request.user)
        wallet.balance += amount
        wallet.save(update_fields=['balance', 'updatedAt'])

        return Response({
            'message': 'Deposit successful.',
            'balance': wallet.balance,
        }, status=status.HTTP_200_OK)


class WalletWithdrawView(APIView):
    """
    POST /wallet/withdraw
    Withdraw fiat from the user's wallet.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WalletWithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']

        wallet = _get_or_create_wallet(request.user)

        if wallet.balance < amount:
            return Response(
                {'error': {'code': 'INSUFFICIENT_BALANCE', 'message': 'Insufficient wallet balance.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet.balance -= amount
        wallet.save(update_fields=['balance', 'updatedAt'])

        return Response({
            'message': 'Withdrawal request submitted.',
            'balance': wallet.balance,
        }, status=status.HTTP_200_OK)


# =============================================================================
# Gold Wallet View
# =============================================================================

class GoldWalletView(APIView):
    """
    GET /wallet/gold
    Returns the authenticated user's gold wallet balance.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        gold_wallet = _get_or_create_gold_wallet(request.user)
        return Response(GoldWalletSerializer(gold_wallet).data, status=status.HTTP_200_OK)


# =============================================================================
# Loan ViewSet & Repayment
# =============================================================================

class GoldLoanViewSet(viewsets.ModelViewSet):
    """
    CRUD for gold-backed loans.
    - Regular users can create and list their own loans.
    - Admin can update/review any loan.
    """
    serializer_class = GoldLoanSerializer
    authentication_classes = [TokenAuthentication]
    filterset_fields = ['status']
    ordering_fields = ['createdAt']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return GoldLoan.objects.all()
        return GoldLoan.objects.filter(userId=user)

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


class LoanRepayView(APIView):
    """
    POST /wallet/loans/repay
    Repay a gold loan from wallet balance.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LoanRepayRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        method = serializer.validated_data.get('method', 'wallet')
        loan_id = request.data.get('loanId')

        if not loan_id:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'loanId is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the loan
        try:
            loan = GoldLoan.objects.get(id=loan_id, userId=request.user)
        except GoldLoan.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Loan not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if loan.status not in ('approved', 'active'):
            return Response(
                {'error': {'code': 'INVALID_LOAN', 'message': 'Loan is not in a repayable state.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check wallet balance
        wallet = _get_or_create_wallet(request.user)
        if wallet.balance < amount:
            return Response(
                {'error': {'code': 'INSUFFICIENT_BALANCE', 'message': 'Insufficient wallet balance.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deduct from wallet
        wallet.balance -= amount
        wallet.save(update_fields=['balance', 'updatedAt'])

        # Update loan
        loan.repaidAmount += amount
        total_due = (loan.amountApproved or loan.amountRequested) * (1 + loan.interestRate)
        if loan.repaidAmount >= total_due:
            loan.status = 'repaid'
        loan.save(update_fields=['repaidAmount', 'status', 'updatedAt'])

        # Create repayment record
        LoanRepayment.objects.create(
            loanId=loan,
            amount=amount,
            penalty=0,
            method=method,
            status='completed',
            description='Loan repayment',
        )

        return Response({
            'message': 'Repayment successful.',
            'repaidAmount': loan.repaidAmount,
            'loanStatus': loan.status,
            'walletBalance': wallet.balance,
        }, status=status.HTTP_200_OK)


class LoanSettingsView(APIView):
    """
    GET /wallet/loans/settings
    Returns loan configuration settings from core app.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from core.models import LoanSetting
        settings = LoanSetting.objects.all()
        data = {}
        for s in settings:
            data[s.key] = s.value
        return Response(data, status=status.HTTP_200_OK)


# =============================================================================
# Payment Views
# =============================================================================

class PaymentCreateView(APIView):
    """
    POST /wallet/payments/create
    Create a new payment request.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        if not amount or float(amount) < 1000:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Amount must be at least 1000.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        description = request.data.get('description', 'شارژ کیف پول زرین گلد')
        callback_url = request.data.get('callback_url', '')

        # Create payment with unique authority
        authority = secrets.token_urlsafe(32)
        payment = Payment.objects.create(
            userId=request.user,
            authority=authority,
            amount=float(amount),
            description=description,
            status='pending',
            provider='zarinpal',
        )

        # In production, call the payment gateway here
        # For now, return the authority as the payment URL reference
        return Response({
            'paymentId': payment.id,
            'authority': payment.authority,
            'amount': payment.amount,
            'status': payment.status,
            'paymentUrl': f'https://sandbox.zarinpal.com/pg/StartPay/{authority}',
        }, status=status.HTTP_201_CREATED)


class PaymentCallbackView(APIView):
    """
    POST /wallet/payments/callback
    Handle payment gateway callback.
    """
    permission_classes = []  # Gateway callback, no auth

    def post(self, request):
        authority = request.data.get('Authority') or request.data.get('authority')
        status_param = request.data.get('Status') or request.data.get('status')

        if not authority:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Authority is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = Payment.objects.get(authority=authority)
        except Payment.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Payment not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if status_param == 'OK' or status_param == 'success':
            payment.status = 'paid'
            payment.paidAt = timezone.now()
            payment.refId = request.data.get('RefID', '')
            payment.cardPan = request.data.get('CardPan', '')
            payment.save(update_fields=['status', 'paidAt', 'refId', 'cardPan', 'updatedAt'])

            # Credit the wallet
            wallet = _get_or_create_wallet(payment.userId)
            wallet.balance += payment.amount
            wallet.save(update_fields=['balance', 'updatedAt'])
        else:
            payment.status = 'failed'
            payment.save(update_fields=['status', 'updatedAt'])

        return Response({
            'status': payment.status,
            'amount': payment.amount,
        }, status=status.HTTP_200_OK)


class PaymentVerifyView(APIView):
    """
    POST /wallet/payments/verify
    Verify a payment with the gateway.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        authority = request.data.get('authority')
        if not authority:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Authority is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = Payment.objects.get(authority=authority, userId=request.user)
        except Payment.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Payment not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # In production, verify with the payment gateway
        # For now, if status is 'paid', mark as verified
        if payment.status == 'paid' and not payment.verifiedAt:
            payment.verifiedAt = timezone.now()
            payment.status = 'verified'
            payment.save(update_fields=['verifiedAt', 'status', 'updatedAt'])

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class PaymentHistoryView(APIView):
    """
    GET /wallet/payments/history
    Returns payment history for the authenticated user.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.filter(userId=request.user).order_by('-createdAt')
        # Simple pagination
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        payments = payments[offset:offset + limit]

        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# Deposit Views
# =============================================================================

class DepositCreateView(APIView):
    """
    POST /wallet/deposit/create
    Create a deposit payment request (alias for PaymentCreateView).
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DepositCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        callback_url = serializer.validated_data.get('callback_url', '')
        description = serializer.validated_data.get('description', 'شارژ کیف پول زرین گلد')

        authority = secrets.token_urlsafe(32)
        payment = Payment.objects.create(
            userId=request.user,
            authority=authority,
            amount=amount,
            description=description,
            status='pending',
            provider='zarinpal',
        )

        return Response({
            'paymentId': payment.id,
            'authority': payment.authority,
            'amount': payment.amount,
            'status': payment.status,
            'paymentUrl': f'https://sandbox.zarinpal.com/pg/StartPay/{authority}',
        }, status=status.HTTP_201_CREATED)


class DepositVerifyView(APIView):
    """
    POST /wallet/deposit/verify
    Verify a deposit payment.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DepositVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        authority = serializer.validated_data['authority']

        try:
            payment = Payment.objects.get(authority=authority, userId=request.user)
        except Payment.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Payment not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # In production, verify with the payment gateway
        # For development, auto-verify pending payments
        if payment.status == 'pending':
            payment.status = 'verified'
            payment.verifiedAt = timezone.now()
            payment.paidAt = timezone.now()
            payment.save(update_fields=['status', 'verifiedAt', 'paidAt', 'updatedAt'])

            # Credit the wallet
            wallet = _get_or_create_wallet(payment.userId)
            wallet.balance += payment.amount
            wallet.save(update_fields=['balance', 'updatedAt'])

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
