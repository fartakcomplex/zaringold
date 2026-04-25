"""
Zarrin Gold Payment Gateway SDK — Data Models
==============================================
مدل‌های داده‌ای برای درگاه پرداخت زرین گلد

Pure-Python data classes for type-safe request/response handling.
No external dependencies — uses only the standard library ``dataclasses`` module.

کلاس‌های دیتای خالص پایتون برای مدیریت نوع‌ایمن درخواست/پاسخ.
بدون وابستگی خارجی — فقط از ماژول استاندارد ``dataclasses`` استفاده می‌کند.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Optional


# ---------------------------------------------------------------------------
# Request Models / مدل‌های درخواست
# ---------------------------------------------------------------------------


@dataclass
class CreatePaymentParams:
    """
    Parameters for creating a new payment request.
    ===
    پارامترهای ایجاد درخواست پرداخت جدید.

    Attributes:
        merchant_order_id (str):
            Your unique order identifier. Used for reconciliation.
            شناسه یکتای سفارش شما. برای تطبیق استفاده می‌شود.

        callback_url (str):
            URL that Zarrin Gold will POST webhook notifications to.
            آدرسی که زرین گلد اعلان‌های وب‌هوک را به آن POST می‌کند.

        amount_grams (float | None):
            Payment amount in grams of gold. Use this OR amount_fiat.
            مبلغ پرداخت به گرم طلا. از این یا amount_fiat استفاده کنید.

        amount_fiat (int | None):
            Payment amount in fiat currency (e.g., IRR in Rials).
            مبلغ پرداخت به واحد پول رایج (مثلاً ریال).

        gold_price (int | None):
            Custom gold price per gram in fiat. Gateway uses market price if omitted.
            قیمت دلخواه طلا به ازای هر گرم. اگر حذف شود قیمت بازار استفاده می‌شود.

        description (str | None):
            Optional human-readable description for this payment.
            توضیح اختیاری خوانا برای این پرداخت.
    """

    merchant_order_id: str
    callback_url: str
    amount_grams: Optional[float] = None
    amount_fiat: Optional[int] = None
    gold_price: Optional[int] = None
    description: Optional[str] = None

    def to_dict(self) -> dict:
        """
        Convert to dictionary, omitting ``None`` values.
        ===
        تبدیل به دیکشنری، حذف مقادیر ``None``.
        """
        return {k: v for k, v in asdict(self).items() if v is not None}


# ---------------------------------------------------------------------------
# Response Models / مدل‌های پاسخ
# ---------------------------------------------------------------------------


@dataclass
class PaymentInfo:
    """
    Core payment information returned by the API.
    ===
    اطلاعات اصلی پرداخت که توسط API برمی‌گردد.

    Attributes:
        id (str): Unique payment identifier (e.g. ``pay_abc123``)
        status (str): Current payment status (e.g. ``pending``, ``paid``, ``expired``)
        amount_grams (float | None): Amount in grams of gold
        amount_fiat (int | None): Amount in fiat currency
        paid_at (str | None): ISO-8601 timestamp of when payment was completed
        expires_at (str | None): ISO-8601 timestamp of payment expiry
        payment_url (str | None): URL to redirect the user for payment (create only)
    """

    id: str
    status: str
    amount_grams: Optional[float] = None
    amount_fiat: Optional[int] = None
    paid_at: Optional[str] = None
    expires_at: Optional[str] = None
    payment_url: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> PaymentInfo:
        """
        Construct a ``PaymentInfo`` from a raw API response dictionary.
        ===
        ساخت یک ``PaymentInfo`` از دیکشنری پاسخ خام API.
        """
        return cls(
            id=data.get("id", ""),
            status=data.get("status", ""),
            amount_grams=data.get("amountGrams"),
            amount_fiat=data.get("amountFiat"),
            paid_at=data.get("paidAt"),
            expires_at=data.get("expiresAt"),
            payment_url=data.get("paymentUrl"),
        )

    def to_dict(self) -> dict:
        """
        Convert back to API-style dictionary (camelCase keys).
        ===
        تبدیل به دیکشنری استایل API (کلیدهای camelCase).
        """
        result: dict = {"id": self.id, "status": self.status}
        if self.amount_grams is not None:
            result["amountGrams"] = self.amount_grams
        if self.amount_fiat is not None:
            result["amountFiat"] = self.amount_fiat
        if self.paid_at is not None:
            result["paidAt"] = self.paid_at
        if self.expires_at is not None:
            result["expiresAt"] = self.expires_at
        if self.payment_url is not None:
            result["paymentUrl"] = self.payment_url
        return result


@dataclass
class PaymentResponse:
    """
    Top-level response from payment creation endpoint.
    ===
    پاسخ سطح بالا از نقطه پایانی ایجاد پرداخت.

    Attributes:
        success (bool): Whether the API call was successful
        payment (PaymentInfo): Detailed payment object
    """

    success: bool
    payment: PaymentInfo

    @classmethod
    def from_dict(cls, data: dict) -> PaymentResponse:
        """
        Construct from a raw API response.
        ===
        ساخت از پاسخ خام API.
        """
        payment_data = data.get("payment", {})
        return cls(
            success=data.get("success", False),
            payment=PaymentInfo.from_dict(payment_data),
        )


@dataclass
class PaymentStatusResponse:
    """
    Top-level response from payment status / verification endpoint.
    ===
    پاسخ سطح بالا از نقطه پایانی وضعیت/تأیید پرداخت.

    Attributes:
        success (bool): Whether the API call was successful
        payment (PaymentInfo): Detailed payment object including paid_at
    """

    success: bool
    payment: PaymentInfo

    @classmethod
    def from_dict(cls, data: dict) -> PaymentStatusResponse:
        """
        Construct from a raw API response.
        ===
        ساخت از پاسخ خام API.
        """
        payment_data = data.get("payment", {})
        return cls(
            success=data.get("success", False),
            payment=PaymentInfo.from_dict(payment_data),
        )


@dataclass
class PaymentDetailResponse:
    """
    Top-level response from payment detail endpoint.
    ===
    پاسخ سطح بالا از نقطه پایانی جزئیات پرداخت.

    Attributes:
        success (bool): Whether the API call was successful
        payment (PaymentInfo): Full payment details
    """

    success: bool
    payment: PaymentInfo

    @classmethod
    def from_dict(cls, data: dict) -> PaymentDetailResponse:
        """
        Construct from a raw API response.
        ===
        ساخت از پاسخ خام API.
        """
        payment_data = data.get("payment", {})
        return cls(
            success=data.get("success", False),
            payment=PaymentInfo.from_dict(payment_data),
        )


@dataclass
class CancelPaymentParams:
    """
    Parameters for cancelling a payment.
    ===
    پارامترهای لغو پرداخت.

    Attributes:
        user_id (str): Identifier of the user requesting cancellation
    """

    user_id: str

    def to_dict(self) -> dict:
        return {"userId": self.user_id}


@dataclass
class ExecutePaymentParams:
    """
    Parameters for executing (confirming) a payment (user-side action).
    ===
    پارامترهای اجرا (تأیید) پرداخت (اقدام کاربر).

    Attributes:
        user_id (str): Identifier of the user executing the payment
    """

    user_id: str

    def to_dict(self) -> dict:
        return {"userId": self.user_id}
