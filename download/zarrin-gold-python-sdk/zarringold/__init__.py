"""
Zarrin Gold Payment Gateway SDK (زرین گلد)
=============================================
SDK رسمی پایتون برای درگاه پرداخت طلای زرین گلد

Official Python SDK for the Zarrin Gold payment gateway.
Provides a clean, type-hinted interface for creating payments,
verifying transactions, handling webhooks, and more.

Quick Start / شروع سریع:
    >>> from zarringold import ZarrinGold
    >>>
    >>> client = ZarrinGold(
    ...     api_key="your_api_key",
    ...     api_secret="your_api_secret",
    ... )
    >>>
    >>> # Create a payment / ایجاد یک پرداخت
    >>> result = client.create_payment(
    ...     merchant_order_id="ORDER-001",
    ...     callback_url="https://example.com/webhook/zarrin",
    ...     amount_fiat=500_000,
    ...     description="خرید محصول",
    ... )
    >>>
    >>> # Redirect user / هدایت کاربر
    >>> redirect_url = result["payment"]["paymentUrl"]

Version: 1.0.0
Author: Zarrin Gold Team
License: MIT
"""

from .client import ZarrinGold
from .exceptions import (
    AuthenticationError,
    NetworkError,
    PaymentError,
    ValidationError,
    WebhookError,
    ZarrinGoldError,
)
from .models import (
    CancelPaymentParams,
    CreatePaymentParams,
    ExecutePaymentParams,
    PaymentDetailResponse,
    PaymentInfo,
    PaymentResponse,
    PaymentStatusResponse,
)
from .webhook import WebhookHandler, WebhookPayload

__version__ = "1.0.0"
__author__ = "Zarrin Gold Team"

__all__ = [
    # Client / کلاینت
    "ZarrinGold",
    # Exceptions / استثناها
    "ZarrinGoldError",
    "AuthenticationError",
    "PaymentError",
    "WebhookError",
    "NetworkError",
    "ValidationError",
    # Models / مدل‌ها
    "CreatePaymentParams",
    "PaymentInfo",
    "PaymentResponse",
    "PaymentStatusResponse",
    "PaymentDetailResponse",
    "CancelPaymentParams",
    "ExecutePaymentParams",
    # Webhook / وب‌هوک
    "WebhookHandler",
    "WebhookPayload",
]
