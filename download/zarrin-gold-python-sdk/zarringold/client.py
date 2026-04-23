"""
Zarrin Gold Payment Gateway SDK — Main Client
===============================================
کلاینت اصلی SDK برای درگاه پرداخت زرین گلد

The ``ZarrinGold`` class is the primary entry point for interacting with
the Zarrin Gold payment gateway. It wraps every API endpoint in a
Pythonic, type-hinted method with comprehensive error handling.

کلاس ``ZarrinGold`` نقطه ورود اصلی برای تعامل با درگاه پرداخت زرین گلد است.
هر نقطه پایانی API را در یک متد پایتونیک با type hints و مدیریت خطا
جامع پوشش می‌دهد.

Usage / نحوه استفاده:
    >>> from zarringold import ZarrinGold
    >>> client = ZarrinGold(api_key="your_key", api_secret="your_secret")
    >>> result = client.create_payment(
    ...     merchant_order_id="ORDER-001",
    ...     callback_url="https://example.com/webhook",
    ...     amount_grams=0.5,
    ... )
    >>> print(result["payment"]["paymentUrl"])
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import requests

from .exceptions import (
    AuthenticationError,
    NetworkError,
    PaymentError,
    ValidationError,
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

logger = logging.getLogger("zarringold")


class ZarrinGold:
    """
    Zarrin Gold Payment Gateway SDK Client.
    ===
    کلاینت SDK درگاه پرداخت زرین گلد.

    This client provides methods to create payments, verify payment status,
    retrieve payment details, and cancel payments. All communication with the
    gateway is handled over HTTPS using the ``requests`` library.

    این کلاینت متدهایی برای ایجاد پرداخت، تأیید وضعیت پرداخت، دریافت
    جزئیات پرداخت و لغو پرداخت فراهم می‌کند.

    Args:
        api_key (str):
            Your Zarrin Gold API key. Sent via the ``X-API-Key`` header.
            کلید API زرین گلد شما. از طریق هدر ``X-API-Key`` ارسال می‌شود.

        api_secret (str):
            Your Zarrin Gold API secret. Sent in the request body (POST)
            or query string (GET).
            رمز API زرین گلد شما. در بدنه درخواست (POST) یا query string (GET)
            ارسال می‌شود.

        base_url (str, optional):
            Base URL of the Zarrin Gold API. Defaults to ``https://zarringold.com``.
            Change this for testing against a sandbox environment.
            آدرس پایه API زرین گلد. پیش‌فرض: ``https://zarringold.com``.

        timeout (int, optional):
            HTTP request timeout in seconds. Defaults to ``30``.
            مهلت درخواست HTTP به ثانیه. پیش‌فرض: ``30``.

    Example / مثال:
        >>> client = ZarrinGold(
        ...     api_key="zk_live_abc123",
        ...     api_secret="zs_secret_xyz789",
        ... )
    """

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        base_url: str = "https://zarringold.com",
        timeout: int = 30,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValidationError(
                message="api_key must be a non-empty string.",
                field="api_key",
            )
        if not api_secret or not api_secret.strip():
            raise ValidationError(
                message="api_secret must be a non-empty string.",
                field="api_secret",
            )

        self._api_key: str = api_key.strip()
        self._api_secret: str = api_secret.strip()
        self._base_url: str = base_url.rstrip("/")
        self._timeout: int = timeout

        # Session for connection pooling & default headers
        self._session: requests.Session = requests.Session()
        self._session.headers.update({
            "X-API-Key": self._api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    # ------------------------------------------------------------------
    # Public API Methods / متدهای عمومی API
    # ------------------------------------------------------------------

    def create_payment(
        self,
        merchant_order_id: str,
        callback_url: str,
        amount_grams: Optional[float] = None,
        amount_fiat: Optional[int] = None,
        gold_price: Optional[int] = None,
        description: Optional[str] = None,
    ) -> dict:
        """
        Create a new payment request on the Zarrin Gold gateway.
        ===
        ایجاد درخواست پرداخت جدید در درگاه زرین گلد.

        After creation, the gateway returns a ``paymentUrl`` which you should
        redirect the user to so they can complete the payment.

        پس از ایجاد، درگاه یک ``paymentUrl`` برمی‌گرداند که باید کاربر را
        به آن هدایت کنید تا بتواند پرداخت را تکمیل کند.

        Args:
            merchant_order_id (str):
                Your unique order identifier for reconciliation.
                شناسه یکتای سفارش شما برای تطبیق.

            callback_url (str):
                Webhook URL that receives payment status updates.
                آدرس وب‌هوک که به‌روزرسانی‌های وضعیت پرداخت را دریافت می‌کند.

            amount_grams (float | None):
                Amount in grams of gold. Mutually exclusive with ``amount_fiat``
                unless ``gold_price`` is also provided.
                مبلغ به گرم طلا. با ``amount_fiat`` متقابل است مگر اینکه
                ``gold_price`` نیز ارائه شود.

            amount_fiat (int | None):
                Amount in fiat currency (e.g., IRR Rials).
                مبلغ به واحد پول رایج (مثلاً ریال).

            gold_price (int | None):
                Custom gold price per gram. If omitted, the gateway uses the
                current market price.
                قیمت دلخواه طلا به ازای هر گرم.

            description (str | None):
                Optional description for this payment.
                توضیح اختیاری برای این پرداخت.

        Returns:
            dict: API response containing payment details.
            ```
            {
                "success": True,
                "payment": {
                    "id": "pay_abc123",
                    "paymentUrl": "https://zarringold.com/pay/pay_abc123",
                    "amountGrams": 0.5,
                    "status": "pending",
                    "expiresAt": "2024-12-15T15:00:00Z"
                }
            }
            ```

        Raises:
            ValidationError: If required parameters are missing or invalid.
            AuthenticationError: If API credentials are rejected.
            PaymentError: If the gateway rejects the payment creation.
            NetworkError: If a network-level failure occurs.

        Example / مثال:
            >>> result = client.create_payment(
            ...     merchant_order_id="ORDER-001",
            ...     callback_url="https://example.com/webhook/zarrin",
            ...     amount_fiat=500_000,
            ...     description="خرید محصول",
            ... )
            >>> redirect_url = result["payment"]["paymentUrl"]
        """
        self._validate_create_params(
            merchant_order_id=merchant_order_id,
            callback_url=callback_url,
            amount_grams=amount_grams,
            amount_fiat=amount_fiat,
        )

        params = CreatePaymentParams(
            merchant_order_id=merchant_order_id,
            callback_url=callback_url,
            amount_grams=amount_grams,
            amount_fiat=amount_fiat,
            gold_price=gold_price,
            description=description,
        )

        body = params.to_dict()
        body["apiSecret"] = self._api_secret

        url = f"{self._base_url}/api/gateway/pay/create"
        return self._post(url, body=body)

    def verify_payment(self, payment_id: str) -> dict:
        """
        Check the status of an existing payment.
        ===
        بررسی وضعیت یک پرداخت موجود.

        Use this method to verify whether a payment has been completed,
        is still pending, or has expired. This is the recommended method
        for server-side payment verification after receiving a webhook.

        از این متد برای تأیید اینکه آیا پرداخت تکمیل شده، هنوز معلق است
        یا منقضی شده استفاده کنید.

        Args:
            payment_id (str):
                The unique payment identifier returned by ``create_payment``.
                شناسه یکتای پرداخت که توسط ``create_payment`` برگردانده شده.

        Returns:
            dict: API response with payment status.
            ```
            {
                "success": True,
                "payment": {
                    "id": "pay_abc123",
                    "status": "paid",
                    "amountGrams": 0.5,
                    "amountFiat": 500000,
                    "paidAt": "2024-12-15T14:30:00Z"
                }
            }
            ```

        Raises:
            ValidationError: If ``payment_id`` is empty.
            AuthenticationError: If API credentials are rejected.
            PaymentError: If the payment is not found.
            NetworkError: If a network-level failure occurs.

        Example / مثال:
            >>> result = client.verify_payment("pay_abc123")
            >>> if result["payment"]["status"] == "paid":
            ...     print("Payment confirmed!")
        """
        if not payment_id or not payment_id.strip():
            raise ValidationError(
                message="payment_id must be a non-empty string.",
                field="payment_id",
            )

        url = f"{self._base_url}/api/gateway/pay/{payment_id.strip()}/status"
        params = {"apiSecret": self._api_secret}
        return self._get(url, params=params)

    def get_payment_detail(
        self,
        payment_id: str,
        user_token: Optional[str] = None,
    ) -> dict:
        """
        Retrieve detailed information about a payment.
        ===
        دریافت اطلاعات تفصیلی درباره یک پرداخت.

        This endpoint uses Bearer token authentication (user-side) rather
        than the standard API key authentication. If no ``user_token`` is
        provided, the client will fall back to API key authentication.

        این نقطه پایانی از احراز هویت توکن Bearer (سمت کاربر) به جای
        احراز هویت کلید API استاندارد استفاده می‌کند.

        Args:
            payment_id (str):
                The unique payment identifier.
                شناسه یکتای پرداخت.

            user_token (str | None):
                Bearer token for user-side authentication.
                توکن Bearer برای احراز هویت سمت کاربر.

        Returns:
            dict: Full payment details from the API.

        Raises:
            ValidationError: If ``payment_id`` is empty.
            AuthenticationError: If credentials are rejected.
            PaymentError: If the payment is not found.
            NetworkError: If a network-level failure occurs.

        Example / مثال:
            >>> detail = client.get_payment_detail(
            ...     "pay_abc123",
            ...     user_token="user_jwt_token_here",
            ... )
        """
        if not payment_id or not payment_id.strip():
            raise ValidationError(
                message="payment_id must be a non-empty string.",
                field="payment_id",
            )

        url = f"{self._base_url}/api/gateway/pay/{payment_id.strip()}/detail"

        if user_token:
            headers = {"Authorization": f"Bearer {user_token}"}
            return self._get(url, headers=headers)
        else:
            return self._get(url)

    def cancel_payment(self, payment_id: str, user_id: str) -> dict:
        """
        Cancel an existing payment.
        ===
        لغو یک پرداخت موجود.

        Only payments that have not yet been completed can be cancelled.
        Both the ``payment_id`` and ``user_id`` are required.

        فقط پرداخت‌هایی که هنوز تکمیل نشده‌اند قابل لغو هستند.

        Args:
            payment_id (str):
                The unique payment identifier to cancel.
                شناسه یکتای پرداخت برای لغو.

            user_id (str):
                Identifier of the user requesting the cancellation.
                شناسه کاربری که درخواست لغو را داده.

        Returns:
            dict: API response confirming the cancellation.
            ```
            {
                "success": True,
                "payment": {
                    "id": "pay_abc123",
                    "status": "cancelled"
                }
            }
            ```

        Raises:
            ValidationError: If required parameters are missing.
            AuthenticationError: If API credentials are rejected.
            PaymentError: If the payment cannot be cancelled.
            NetworkError: If a network-level failure occurs.

        Example / مثال:
            >>> result = client.cancel_payment("pay_abc123", "user_42")
        """
        if not payment_id or not payment_id.strip():
            raise ValidationError(
                message="payment_id must be a non-empty string.",
                field="payment_id",
            )
        if not user_id or not user_id.strip():
            raise ValidationError(
                message="user_id must be a non-empty string.",
                field="user_id",
            )

        params = CancelPaymentParams(user_id=user_id.strip())
        body = params.to_dict()

        url = f"{self._base_url}/api/gateway/pay/{payment_id.strip()}/cancel"
        return self._post(url, body=body)

    def execute_payment(self, payment_id: str, user_id: str) -> dict:
        """
        Execute (confirm) a payment on behalf of the user.
        ===
        اجرا (تأیید) پرداخت به نمایندگی از کاربر.

        This is a user-side action that confirms the payment. Both
        ``payment_id`` and ``user_id`` are required.

        این یک اقدام سمت کاربر است که پرداخت را تأیید می‌کند.

        Args:
            payment_id (str):
                The unique payment identifier to execute.
                شناسه یکتای پرداخت برای اجرا.

            user_id (str):
                Identifier of the user executing the payment.
                شناسه کاربری که پرداخت را اجرا می‌کند.

        Returns:
            dict: API response with the updated payment status.

        Raises:
            ValidationError: If required parameters are missing.
            AuthenticationError: If API credentials are rejected.
            PaymentError: If the payment cannot be executed.
            NetworkError: If a network-level failure occurs.

        Example / مثال:
            >>> result = client.execute_payment("pay_abc123", "user_42")
        """
        if not payment_id or not payment_id.strip():
            raise ValidationError(
                message="payment_id must be a non-empty string.",
                field="payment_id",
            )
        if not user_id or not user_id.strip():
            raise ValidationError(
                message="user_id must be a non-empty string.",
                field="user_id",
            )

        params = ExecutePaymentParams(user_id=user_id.strip())
        body = params.to_dict()

        url = f"{self._base_url}/api/gateway/pay/{payment_id.strip()}/execute"
        return self._post(url, body=body)

    # ------------------------------------------------------------------
    # Convenience Properties / ویژگی‌های مناسب
    # ------------------------------------------------------------------

    @property
    def api_key(self) -> str:
        """
        The configured API key (read-only).
        ===
        کلید API پیکربندی‌شده (فقط خواندنی).
        """
        return self._api_key

    @property
    def base_url(self) -> str:
        """
        The configured base URL (read-only).
        ===
        آدرس پایه پیکربندی‌شده (فقط خواندنی).
        """
        return self._base_url

    @property
    def timeout(self) -> int:
        """
        The configured request timeout in seconds (read-only).
        ===
        مهلت درخواست پیکربندی‌شده به ثانیه (فقط خواندنی).
        """
        return self._timeout

    # ------------------------------------------------------------------
    # Session Management / مدیریت نشست
    # ------------------------------------------------------------------

    def close(self) -> None:
        """
        Close the underlying HTTP session and release resources.
        ===
        بستن نشست HTTP زیرین و آزادسازی منابع.

        Call this when you are done using the client, or use the client
        as a context manager for automatic cleanup.

        این متد را هنگام اتمام استفاده از کلاینت فراخوانی کنید، یا از
        کلاینت به عنوان context manager استفاده کنید.

        Example / مثال:
            >>> client = ZarrinGold(api_key="...", api_secret="...")
            >>> try:
            ...     client.create_payment(...)
            ... finally:
            ...     client.close()
        """
        self._session.close()

    def __enter__(self) -> ZarrinGold:
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()

    # ------------------------------------------------------------------
    # Internal HTTP Helpers / کمک‌کننده‌های داخلی HTTP
    # ------------------------------------------------------------------

    def _get(
        self,
        url: str,
        params: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> dict:
        """
        Perform an authenticated GET request.
        ===
        انجام درخواست GET احراز هویت‌شده.
        """
        request_headers = {}
        if headers:
            request_headers.update(headers)

        try:
            response = self._session.get(
                url,
                params=params,
                headers=request_headers,
                timeout=self._timeout,
            )
        except requests.exceptions.Timeout:
            raise NetworkError(
                message=f"Request to {url} timed out after {self._timeout}s."
            )
        except requests.exceptions.ConnectionError:
            raise NetworkError(
                message=f"Could not connect to {url}. Please check your network."
            )
        except requests.exceptions.RequestException as exc:
            raise NetworkError(
                message=f"Network error: {exc}"
            ) from exc

        return self._handle_response(response)

    def _post(self, url: str, body: Optional[dict] = None) -> dict:
        """
        Perform an authenticated POST request.
        ===
        انجام درخواست POST احراز هویت‌شده.
        """
        try:
            response = self._session.post(
                url,
                json=body,
                timeout=self._timeout,
            )
        except requests.exceptions.Timeout:
            raise NetworkError(
                message=f"Request to {url} timed out after {self._timeout}s."
            )
        except requests.exceptions.ConnectionError:
            raise NetworkError(
                message=f"Could not connect to {url}. Please check your network."
            )
        except requests.exceptions.RequestException as exc:
            raise NetworkError(
                message=f"Network error: {exc}"
            ) from exc

        return self._handle_response(response)

    def _handle_response(self, response: requests.Response) -> dict:
        """
        Parse and validate an API response, raising typed exceptions on errors.
        ===
        تجزیه و اعتبارسنجی پاسخ API، صدور استثناهای نوع‌دار در خطا.
        """
        status_code = response.status_code

        # Parse JSON body
        try:
            data = response.json()
        except (ValueError, requests.exceptions.JSONDecodeError):
            data = {}

        # Handle HTTP-level errors
        if status_code == 401:
            raise AuthenticationError(
                message="Authentication failed. Invalid API key or secret.",
                status_code=status_code,
                response=data,
            )

        if status_code == 403:
            raise AuthenticationError(
                message="Access forbidden. Your API key does not have permission for this action.",
                status_code=status_code,
                response=data,
            )

        if status_code == 404:
            raise PaymentError(
                message="The requested payment resource was not found.",
                status_code=status_code,
                response=data,
            )

        if status_code == 422:
            # Validation error from the server
            server_message = data.get("message", "Request validation failed on the server.")
            raise ValidationError(
                message=server_message,
                status_code=status_code,
                response=data,
            )

        if 400 <= status_code < 500:
            server_message = data.get("message", data.get("error", "Bad request."))
            raise PaymentError(
                message=server_message,
                status_code=status_code,
                response=data,
            )

        if status_code >= 500:
            raise NetworkError(
                message=f"Zarrin Gold server error (HTTP {status_code}). Please try again later.",
                status_code=status_code,
                response=data,
            )

        # Successful response
        if not isinstance(data, dict):
            raise ZarrinGoldError(
                message=f"Unexpected response type: {type(data).__name__}. Expected dict.",
                status_code=status_code,
            )

        return data

    # ------------------------------------------------------------------
    # Validation Helpers / کمک‌کننده‌های اعتبارسنجی
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_create_params(
        merchant_order_id: str,
        callback_url: str,
        amount_grams: Optional[float],
        amount_fiat: Optional[int],
    ) -> None:
        """
        Validate parameters for ``create_payment``.
        ===
        اعتبارسنجی پارامترهای ``create_payment``.
        """
        if not merchant_order_id or not merchant_order_id.strip():
            raise ValidationError(
                message="merchant_order_id is required and cannot be empty.",
                field="merchant_order_id",
            )

        if not callback_url or not callback_url.strip():
            raise ValidationError(
                message="callback_url is required and cannot be empty.",
                field="callback_url",
            )

        if amount_grams is not None and amount_grams <= 0:
            raise ValidationError(
                message="amount_grams must be a positive number.",
                field="amount_grams",
            )

        if amount_fiat is not None and amount_fiat <= 0:
            raise ValidationError(
                message="amount_fiat must be a positive integer.",
                field="amount_fiat",
            )

        if amount_grams is None and amount_fiat is None:
            raise ValidationError(
                message="At least one of amount_grams or amount_fiat must be provided.",
                field="amount_grams",
            )
