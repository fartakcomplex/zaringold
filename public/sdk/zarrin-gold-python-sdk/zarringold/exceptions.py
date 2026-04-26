"""
Zarrin Gold Payment Gateway SDK — Custom Exceptions
====================================================
استثناها و خطاهای سفارشی برای درگاه پرداخت زرین گلد

Custom exception classes for the Zarrin Gold payment gateway SDK.
Provides structured error handling for authentication, payment,
and webhook-related failures.
"""


class ZarrinGoldError(Exception):
    """
    Base exception for all Zarrin Gold SDK errors.
    ===
    استثنای پایه برای تمام خطاهای SDK زرین گلد.

    Every exception raised by this SDK inherits from this class,
    making it easy to catch all SDK-related errors in a single block.

    تمام استثناهای صادر شده توسط این SDK از این کلاس ارث‌بری می‌کنند
    و catching آن‌ها در یک بلوک واحد ممکن است.

    Attributes:
        message (str): Human-readable error description / توضیح خطا
        status_code (int | None): HTTP status code, if applicable / کد وضعیت HTTP
        response (dict | None): Raw API response body, if available / پاسخ خام API

    Example / مثال:
        >>> try:
        ...     client.create_payment(...)
        ... except ZarrinGoldError as e:
        ...     print(f"Error: {e.message}")
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response: dict | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(self.message)

    def __str__(self) -> str:
        parts = [self.message]
        if self.status_code is not None:
            parts.append(f"(HTTP {self.status_code})")
        return " ".join(parts)

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"status_code={self.status_code}, "
            f"response={self.response!r})"
        )


class AuthenticationError(ZarrinGoldError):
    """
    Raised when API authentication fails (invalid or missing credentials).
    ===
    هنگامی که احراز هویت API ناموفق باشد (اعتبارنامه نامعتبر یا غایب) صادر می‌شود.

    This typically occurs when:
        - The API key is missing or invalid.
        - The API secret is incorrect.
        - The server returns HTTP 401 or 403.

    این خطا معمولاً در موارد زیر رخ می‌دهد:
        - کلید API غایب یا نامعتبر است.
        - رمز API نادرست است.
        - سرور کد HTTP 401 یا 403 برمی‌گرداند.

    Example / مثال:
        >>> try:
        ...     client.verify_payment("pay_123")
        ... except AuthenticationError as e:
        ...     print(f"Auth failed: {e}")
    """

    def __init__(
        self,
        message: str = "Authentication failed. Please check your API key and secret.",
        status_code: int | None = None,
        response: dict | None = None,
    ) -> None:
        super().__init__(message=message, status_code=status_code, response=response)


class PaymentError(ZarrinGoldError):
    """
    Raised when a payment operation fails.
    ===
    هنگامی که یک عملیات پرداخت ناموفق باشد صادر می‌شود.

    Covers errors such as:
        - Payment creation fails (invalid amount, missing fields, etc.).
        - Payment verification returns an unexpected status.
        - Payment cancellation is rejected by the gateway.

    خطاهای زیر را پوشش می‌دهد:
        - ایجاد پرداخت ناموفق (مبلغ نامعتبر، فیلدهای غایب و غیره).
        - تأیید پرداخت وضعیت غیرمنتظره‌ای برمی‌گرداند.
        - لغو پرداخت توسط درگاه رد می‌شود.

    Attributes:
        payment_id (str | None): ID of the payment that caused the error / شناسه پرداخت

    Example / مثال:
        >>> try:
        ...     client.create_payment(...)
        ... except PaymentError as e:
        ...     print(f"Payment failed for order: {e.payment_id}")
    """

    def __init__(
        self,
        message: str = "Payment operation failed.",
        payment_id: str | None = None,
        status_code: int | None = None,
        response: dict | None = None,
    ) -> None:
        self.payment_id = payment_id
        # Enrich message with payment ID if available
        if payment_id:
            message = f"{message} (payment_id={payment_id})"
        super().__init__(message=message, status_code=status_code, response=response)


class WebhookError(ZarrinGoldError):
    """
    Raised when webhook processing fails.
    ===
    هنگامی که پردازش وب‌هوک ناموفق باشد صادر می‌شود.

    Covers errors such as:
        - Invalid webhook payload (missing required fields).
        - Unsupported or unknown payment status in the payload.
        - Malformed JSON body.

    خطاهای زیر را پوشش می‌دهد:
        - بارگذاری وب‌هوک نامعتبر (فیلدهای الزامی غایب).
        - وضعیت پرداخت ناشناخته یا پشتیبانی‌نشده.
        - بدنه JSON ناقص.

    Example / مثال:
        >>> try:
        ...     payload = handler.parse_webhook(data)
        ... except WebhookError as e:
        ...     print(f"Webhook processing failed: {e}")
    """

    def __init__(
        self,
        message: str = "Webhook processing failed.",
        status_code: int | None = None,
        response: dict | None = None,
    ) -> None:
        super().__init__(message=message, status_code=status_code, response=response)


class NetworkError(ZarrinGoldError):
    """
    Raised when a network-level error occurs (timeout, connection failure, etc.).
    ===
    هنگامی که خطای سطح شبکه رخ می‌دهد (تایم‌اوت، قطعی اتصال و غیره) صادر می‌شود.

    This wraps underlying ``requests`` library exceptions into a unified
    SDK exception so callers don't need to handle ``requests`` types directly.

    این استثنا خطاهای کتابخانه ``requests`` را در یک استثنای یکپارچه SDK جمع می‌کند
    تا فراخواننده نیازی به مدیریت مستقیم انواع ``requests`` نداشته باشد.

    Example / مثال:
        >>> try:
        ...     client.verify_payment("pay_123")
        ... except NetworkError as e:
        ...     print(f"Network issue: {e}")
    """

    def __init__(
        self,
        message: str = "A network error occurred while communicating with Zarrin Gold API.",
        status_code: int | None = None,
        response: dict | None = None,
    ) -> None:
        super().__init__(message=message, status_code=status_code, response=response)


class ValidationError(ZarrinGoldError):
    """
    Raised when request validation fails (missing/invalid parameters).
    ===
    هنگامی که اعتبارسنجی درخواست ناموفق باشد (پارامترهای غایب یا نامعتبر) صادر می‌شود.

    The SDK validates inputs client-side before sending requests.
    This exception is raised when those checks fail, helping developers
    catch bugs early without making unnecessary HTTP calls.

    SDK ورودی‌ها را قبل از ارسال درخواست در سمت کلاینت اعتبارسنجی می‌کند.
    این استثنا هنگام شکست این بررسی‌ها صادر می‌شود.

    Attributes:
        field (str | None): Name of the invalid field / نام فیلد نامعتبر

    Example / مثال:
        >>> try:
        ...     client.create_payment(merchant_order_id="", callback_url="...")
        ... except ValidationError as e:
        ...     print(f"Invalid field '{e.field}': {e}")
    """

    def __init__(
        self,
        message: str = "Request validation failed.",
        field: str | None = None,
        status_code: int | None = None,
        response: dict | None = None,
    ) -> None:
        self.field = field
        super().__init__(message=message, status_code=status_code, response=response)
