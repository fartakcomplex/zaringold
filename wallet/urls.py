"""
URL configuration for the wallet app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from wallet.views import (
    WalletView,
    WalletDepositView,
    WalletWithdrawView,
    GoldWalletView,
    GoldLoanViewSet,
    LoanRepayView,
    LoanSettingsView,
    PaymentCreateView,
    PaymentCallbackView,
    PaymentVerifyView,
    PaymentHistoryView,
    DepositCreateView,
    DepositVerifyView,
)

router = DefaultRouter()
router.register(r'loans', GoldLoanViewSet, basename='gold-loan')

app_name = 'wallet'

urlpatterns = [
    # Wallet
    path('', WalletView.as_view(), name='wallet'),
    path('deposit', WalletDepositView.as_view(), name='wallet-deposit'),
    path('withdraw', WalletWithdrawView.as_view(), name='wallet-withdraw'),
    path('gold', GoldWalletView.as_view(), name='gold-wallet'),

    # Loans
    path('loans/repay', LoanRepayView.as_view(), name='loan-repay'),
    path('loans/settings', LoanSettingsView.as_view(), name='loan-settings'),

    # Payments
    path('payments/create', PaymentCreateView.as_view(), name='payment-create'),
    path('payments/callback', PaymentCallbackView.as_view(), name='payment-callback'),
    path('payments/verify', PaymentVerifyView.as_view(), name='payment-verify'),
    path('payments/history', PaymentHistoryView.as_view(), name='payment-history'),

    # Deposit (alternative payment flow)
    path('deposit/create', DepositCreateView.as_view(), name='deposit-create'),
    path('deposit/verify', DepositVerifyView.as_view(), name='deposit-verify'),

    # ViewSet routes
    path('', include(router.urls)),
]
