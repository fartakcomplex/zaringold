"""
Zarrin Gold Payment Gateway SDK — Webhook Handler
===================================================
مدیر وب‌هوک برای درگاه پرداخت زرین گلد

Utilities for receiving, parsing, and responding to webhook notifications
sent by the Zarrin Gold payment gateway after payment events.

ابزارهایی برای دریافت، تجزیه و پاسخ به اعلان‌های وب‌هوک که توسط
درگاه پرداخت زرین گلد پس از رویدادهای پرداخت ارسال می‌شود.

Webhook Flow / جریان وب‌هوک:
    1. User completes payment → زرین گلد وب‌هوک را به ``callbackUrl`` شما ارسال می‌کند
    2. Your server receives POST with JSON payload → سرور شما POST با بار JSON دریافت می‌کند
    3. Parse & validate with ``WebhookHandler.parse_webhook()`` → تجزیه و اعتبارسنجی
    4. Respond with ``WebhookHandler.create_success_response()`` → پاسخ تأیید
    5. Optionally verify with ``client.verify_payment()`` → تأیید اختیاری با SDK
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .exceptions import WebhookError


# ---------------------------------------------------------------------------
# Known webhook statuses / وضعیت‌های شناخته وب‌هوک
# ---------------------------------------------------------------------------

VALID_STATUSES = frozenset({
    "pending",       # Payment created, awaiting user action
    "processing",    # Payment is being processed
    "paid",          # Payment completed successfully
    "failed",        # Payment failed (insufficient funds, etc.)
    "expired",       # Payment expired before completion
    "cancelled",     # Payment was cancelled by user or merchant
})


# ---------------------------------------------------------------------------
# Webhook Payload Data Class / کلاس داده بارگذاری وب‌هوک
# ---------------------------------------------------------------------------


@dataclass
class WebhookPayload:
    """
    Parsed webhook notification payload from Zarrin Gold.
    ===
    بارگذاری وب‌هوک تجزیه‌شده از زرین گلد.

    Attributes:
        payment_id (str):
            Unique Zarrin Gold payment identifier (e.g. ``pay_abc123``).
            شناسه یکتای پرداخت زرین گلد.

        merchant_order_id (str):
            Your order identifier that was passed during payment creation.
            شناسه سفارش شما که هنگام ایجاد پرداخت ارسال شد.

        status (str):
            Current status of the payment. One of: ``pending``, ``processing``,
            ``paid``, ``failed``, ``expired``, ``cancelled``.
            وضعیت فعلی پرداخت.

        amount_grams (float):
            Payment amount in grams of gold.
            مبلغ پرداخت به گرم طلا.

        amount_fiat (int):
            Payment amount in fiat currency (e.g., IRR Rials).
            مبلغ پرداخت به واحد پول رایج.

        paid_at (str | None):
            ISO-8601 timestamp of when the payment was completed.
            Only populated when ``status == "paid"``.
            مهر زمانی ISO-8601 تکمیل پرداخت.

        raw (dict | None):
            Original raw payload dictionary for debugging or audit purposes.
            دیکشنری بارگذاری خام اصلی برای دیباگ یا حسابرسی.
    """

    payment_id: str
    merchant_order_id: str
    status: str
    amount_grams: float
    amount_fiat: int
    paid_at: Optional[str] = None
    raw: Optional[dict] = None

    def to_dict(self) -> dict:
        """
        Convert to a plain dictionary.
        ===
        تبدیل به یک دیکشنری ساده.
        """
        result: dict = {
            "payment_id": self.payment_id,
            "merchant_order_id": self.merchant_order_id,
            "status": self.status,
            "amount_grams": self.amount_grams,
            "amount_fiat": self.amount_fiat,
        }
        if self.paid_at is not None:
            result["paid_at"] = self.paid_at
        return result


# ---------------------------------------------------------------------------
# Webhook Handler / مدیر وب‌هوک
# ---------------------------------------------------------------------------


class WebhookHandler:
    """
    Helper class for parsing and responding to Zarrin Gold webhook notifications.
    ===
    کلاس کمکی برای تجزیه و پاسخ به اعلان‌های وب‌هوک زرین گلد.

    This class provides methods to:
        - Parse incoming webhook payloads into typed ``WebhookPayload`` objects.
        - Create the required success response to acknowledge receipt.
        - Check payment status constants.

    این کلاس متدهایی برای موارد زیر فراهم می‌کند:
        - تجزیه بارگذاری‌های وب‌هوک ورودی به اشیاء ``WebhookPayload``.
        - ایجاد پاسخ موفقیت الزامی برای تأیید دریافت.
        - بررسی ثابت‌های وضعیت پرداخت.

    Example (Flask) / مثال (Flask):
        >>> from flask import Flask, request, jsonify
        >>> from zarringold import WebhookHandler
        >>>
        >>> app = Flask(__name__)
        >>> handler = WebhookHandler()
        >>>
        >>> @app.route("/webhook/zarrin", methods=["POST"])
        >>> def zarrin_webhook():
        ...     payload = handler.parse_webhook(request.get_json())
        ...     if handler.is_paid(payload.status):
        ...         # Fulfill the order / سفارش را تکمیل کنید
        ...         print(f"Order {payload.merchant_order_id} paid!")
        ...     return jsonify(handler.create_success_response())

    Example (Django) / مثال (Django):
        >>> from django.http import JsonResponse
        >>> from django.views.decorators.csrf import csrf_exempt
        >>> from django.views.decorators.http import require_POST
        >>> import json
        >>> from zarringold import WebhookHandler
        >>>
        >>> handler = WebhookHandler()
        >>>
        >>> @csrf_exempt
        >>> @require_POST
        >>> def zarrin_webhook(request):
        ...     data = json.loads(request.body)
        ...     payload = handler.parse_webhook(data)
        ...     if handler.is_paid(payload.status):
        ...         print(f"Order {payload.merchant_order_id} paid!")
        ...     return JsonResponse(handler.create_success_response())
    """

    def parse_webhook(self, payload: dict) -> WebhookPayload:
        """
        Parse and validate an incoming webhook payload.
        ===
        تجزیه و اعتبارسنجی بارگذاری وب‌هوک ورودی.

        Validates that the payload contains all required fields and that
        the ``status`` value is one of the known statuses. Raises
        ``WebhookError`` if validation fails.

        اعتبارسنجی می‌کند که بارگذاری تمام فیلدهای الزامی را دارد و
        مقدار ``status`` یکی از وضعیت‌های شناخته شده است.

        Args:
            payload (dict):
                The raw JSON body received from the Zarrin Gold webhook.
                بدنه JSON خام دریافت شده از وب‌هوک زرین گلد.

        Returns:
            WebhookPayload: A typed, validated webhook payload object.

        Raises:
            WebhookError: If the payload is missing required fields,
                          has invalid types, or contains an unknown status.

        Example / مثال:
            >>> handler = WebhookHandler()
            >>> webhook = handler.parse_webhook({
            ...     "paymentId": "pay_abc123",
            ...     "merchantOrderId": "ORDER-001",
            ...     "status": "paid",
            ...     "amountGrams": 0.5,
            ...     "amountFiat": 500000,
            ...     "paidAt": "2024-12-15T14:30:00Z",
            ... })
            >>> print(webhook.payment_id)
            'pay_abc123'
        """
        if not isinstance(payload, dict):
            raise WebhookError(
                message=f"Webhook payload must be a dict, got {type(payload).__name__}."
            )

        # --- Validate required fields ---
        required_fields = {
            "paymentId": "payment_id",
            "merchantOrderId": "merchant_order_id",
            "status": "status",
            "amountGrams": "amount_grams",
            "amountFiat": "amount_fiat",
        }

        values: dict = {}
        for api_key, internal_key in required_fields.items():
            if api_key not in payload:
                raise WebhookError(
                    message=f"Missing required webhook field: '{api_key}'."
                )
            values[internal_key] = payload[api_key]

        # --- Type-check fields ---
        if not isinstance(values["payment_id"], str):
            raise WebhookError(
                message="Field 'paymentId' must be a string."
            )
        if not isinstance(values["merchant_order_id"], str):
            raise WebhookError(
                message="Field 'merchantOrderId' must be a string."
            )
        if not isinstance(values["status"], str):
            raise WebhookError(
                message="Field 'status' must be a string."
            )
        if not isinstance(values["amount_grams"], (int, float)):
            raise WebhookError(
                message="Field 'amountGrams' must be a number."
            )
        if not isinstance(values["amount_fiat"], (int, float)):
            raise WebhookError(
                message="Field 'amountFiat' must be a number."
            )

        # --- Validate status ---
        status = values["status"]
        if status not in VALID_STATUSES:
            raise WebhookError(
                message=(
                    f"Unknown webhook status: '{status}'. "
                    f"Expected one of: {', '.join(sorted(VALID_STATUSES))}."
                )
            )

        # --- Extract optional fields ---
        paid_at = payload.get("paidAt")
        if paid_at is not None and not isinstance(paid_at, str):
            raise WebhookError(
                message="Field 'paidAt' must be a string if provided."
            )

        return WebhookPayload(
            payment_id=values["payment_id"],
            merchant_order_id=values["merchant_order_id"],
            status=status,
            amount_grams=float(values["amount_grams"]),
            amount_fiat=int(values["amount_fiat"]),
            paid_at=paid_at,
            raw=payload,
        )

    @staticmethod
    def create_success_response() -> dict:
        """
        Create the success response that must be returned to the gateway.
        ===
        ایجاد پاسخ موفقیت که باید به درگاه بازگردانده شود.

        The Zarrin Gold gateway expects a JSON response with ``{"success": true}``
        and HTTP status 200 to confirm the webhook was received and processed.

        درگاه زرین گلد پاسخ JSON با ``{"success": true}`` و وضعیت HTTP 200
        انتظار دارد تا دریافت و پردازش وب‌هوک را تأیید کند.

        Returns:
            dict: ``{"success": True}``

        Example / مثال:
            >>> from flask import jsonify
            >>> response = jsonify(WebhookHandler.create_success_response())
            >>> return response, 200
        """
        return {"success": True}

    @staticmethod
    def is_paid(status: str) -> bool:
        """
        Check whether a payment status represents a successful payment.
        ===
        بررسی اینکه آیا وضعیت پرداخت نشان‌دهنده پرداخت موفق است.

        Args:
            status (str): The payment status string.
            رشته وضعیت پرداخت.

        Returns:
            bool: ``True`` if the status is ``"paid"``, ``False`` otherwise.
            ``True`` اگر وضعیت ``"paid"`` باشد.

        Example / مثال:
            >>> WebhookHandler.is_paid("paid")
            True
            >>> WebhookHandler.is_paid("pending")
            False
        """
        return status == "paid"

    @staticmethod
    def is_failed(status: str) -> bool:
        """
        Check whether a payment status represents a failed payment.
        ===
        بررسی اینکه آیا وضعیت پرداخت نشان‌دهنده پرداخت ناموفق است.

        Returns ``True`` for statuses: ``"failed"``, ``"expired"``, ``"cancelled"``.

        Returns ``True`` برای وضعیت‌ها: ``"failed"``, ``"expired"``, ``"cancelled"``.

        Args:
            status (str): The payment status string.

        Returns:
            bool: ``True`` if the payment has terminally failed.
        """
        return status in ("failed", "expired", "cancelled")

    @staticmethod
    def is_pending(status: str) -> bool:
        """
        Check whether a payment status represents a pending (in-progress) payment.
        ===
        بررسی اینکه آیا وضعیت پرداخت نشان‌دهنده پرداخت معلق است.

        Returns ``True`` for statuses: ``"pending"``, ``"processing"``.

        Args:
            status (str): The payment status string.

        Returns:
            bool: ``True`` if the payment is still in progress.
        """
        return status in ("pending", "processing")
