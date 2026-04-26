<?php

declare(strict_types=1);

/**
 * Zarrin Gold Payment Gateway SDK
 * 
 *.SDK درگاه پرداخت زرین گلد
 * 
 * A comprehensive PHP SDK for integrating with the Zarrin Gold (زرین گلد) 
 * gold-backed payment gateway. This SDK wraps all available API endpoints 
 * and provides a clean, object-oriented interface for creating payments,
 * verifying transactions, handling webhooks, and more.
 *
 * یک کیت توسعه نرم‌افزار (SDK) جامع PHP برای یکپارچه‌سازی با درگاه پرداخت
 * مبتنی بر طلای زرین گلد. این SDK تمام نقاط پایانی API موجود را پوشش داده
 * و یک رابط شی‌گرا و تمیز برای ایجاد پرداخت‌ها، تأیید تراکنش‌ها،
 * مدیریت وب‌هوک و موارد بیشتر فراهم می‌کند.
 *
 * @author      Zarrin Gold <support@zarringold.com>
 * @copyright   2024 Zarrin Gold
 * @license     MIT
 * @version     1.0.0
 * @link        https://zarringold.com
 * @package     ZarrinGold\SDK
 */

// phpcs:disable Generic.Files.LineLength

/**
 * Custom exception class for Zarrin Gold SDK errors.
 *
 * کلاس استثنای سفارشی برای خطاهای SDK زرین گلد.
 *
 * This exception is thrown whenever the SDK encounters an error during
 * API communication, validation, or response parsing. It provides
 * context-specific error messages and optionally stores the raw
 * response body for debugging purposes.
 *
 * این استثنا هر زمان که SDK در طول ارتباط API، اعتبارسنجی یا
 * تجزیه پاسخ با خطایی مواجه شود، پرتاب می‌شود. پیام‌های خطای
 * متناسب با زمینه و به‌صورت اختیاری بدنه خام پاسخ را برای
 * اهداف اشکال‌زدایی ذخیره می‌کند.
 */
class ZarrinGoldException extends Exception
{
    /**
     * The HTTP status code associated with this error, if applicable.
     *
     * کد وضعیت HTTP مرتبط با این خطا، در صورت وجود.
     *
     * @var int|null
     */
    protected ?int $statusCode;

    /**
     * The raw response body from the API, useful for debugging.
     *
     * بدنه خام پاسخ از API، مفید برای اشکال‌زدایی.
     *
     * @var string|null
     */
    protected ?string $responseBody;

    /**
     * Construct a new ZarrinGoldException.
     *
     * ساخت یک نمونه جدید از ZarrinGoldException.
     *
     * @param string     $message      Human-readable error message / پیام خطای قابل خواندن
     * @param int        $code         Internal error code / کد خطای داخلی
     * @param int|null   $statusCode   HTTP status code from the response / کد وضعیت HTTP از پاسخ
     * @param string|null $responseBody Raw response body for debugging / بدنه خام پاسخ برای اشکال‌زدایی
     * @param \Throwable|null $previous Previous exception for chaining / استثنای قبلی برای زنجیر کردن
     */
    public function __construct(
        string $message,
        int $code = 0,
        ?int $statusCode = null,
        ?string $responseBody = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
    }

    /**
     * Get the HTTP status code.
     *
     * دریافت کد وضعیت HTTP.
     *
     * @return int|null
     */
    public function getStatusCode(): ?int
    {
        return $this->statusCode;
    }

    /**
     * Get the raw response body.
     *
     * دریافت بدنه خام پاسخ.
     *
     * @return string|null
     */
    public function getResponseBody(): ?string
    {
        return $this->responseBody;
    }
}

/**
 * Main SDK class for Zarrin Gold payment gateway integration.
 *
 * کلاس اصلی SDK برای یکپارچه‌سازی با درگاه پرداخت زرین گلد.
 *
 * Provides methods for creating payments, verifying transaction status,
 * retrieving payment details, canceling pending payments, and handling
 * webhook notifications. All HTTP communication is handled internally
 * via cURL with configurable timeouts and optional request/response logging.
 *
 * متدهایی برای ایجاد پرداخت، بررسی وضعیت تراکنش، دریافت جزئیات
 * پرداخت، لغو پرداخت‌های معلق و مدیریت اعلان‌های وب‌هوک فراهم
 * می‌کند. تمام ارتباطات HTTP به صورت داخلی از طریق cURL با
 * زمان‌بندی‌های قابل تنظیم و ثبت رویداد اختیاری درخواست/پاسخ انجام می‌شود.
 *
 * Usage Example / مثال استفاده:
 *
 * ```php
 * $sdk = new ZarrinGold('your_api_key', 'your_api_secret');
 * $result = $sdk->createPayment([
 *     'amountFiat'      => 500000,
 *     'merchantOrderId' => 'ORDER-001',
 *     'callbackUrl'     => 'https://yoursite.com/callback',
 *     'description'     => 'خرید محصول',
 * ]);
 * ```
 *
 * @package ZarrinGold\SDK
 */
class ZarrinGold
{
    /**
     * Current SDK version string, used in the User-Agent header.
     *
     * رشته نسخه فعلی SDK، استفاده شده در هدر User-Agent.
     */
    public const VERSION = '1.0.0';

    /**
     * Default base URL for the Zarrin Gold API.
     *
     * URL پایه پیش‌فرض برای API زرین گلد.
     */
    public const DEFAULT_BASE_URL = 'https://zarringold.com';

    /**
     * Default cURL timeout in seconds.
     *
     * زمان انتظار پیش‌فرض cURL بر حسب ثانیه.
     */
    public const DEFAULT_TIMEOUT = 30;

    /**
     * Default cURL connection timeout in seconds.
     *
     * زمان انتظار اتصال پیش‌فرض cURL بر حسب ثانیه.
     */
    public const DEFAULT_CONNECT_TIMEOUT = 10;

    // ------------------------------------------------------------------
    // Payment Status Constants / ثابت‌های وضعیت پرداخت
    // ------------------------------------------------------------------

    /** @var string Payment is pending user action / پرداخت در انتظار اقدام کاربر */
    public const STATUS_PENDING   = 'pending';

    /** @var string Payment has been completed / پرداخت تکمیل شده */
    public const STATUS_PAID      = 'paid';

    /** @var string Payment has been canceled / پرداخت لغو شده */
    public const STATUS_CANCELED  = 'canceled';

    /** @var string Payment has expired / پرداخت منقضی شده */
    public const STATUS_EXPIRED   = 'expired';

    /** @var string Payment has failed / پرداخت ناموفق */
    public const STATUS_FAILED    = 'failed';

    // ------------------------------------------------------------------
    // Instance Properties / ویژگی‌های نمونه
    // ------------------------------------------------------------------

    /**
     * The API key for authenticating requests (sent via X-API-Key header).
     *
     * کلید API برای احراز هویت درخواست‌ها (ارسال شده از طریق هدر X-API-Key).
     *
     * @var string
     */
    protected string $apiKey;

    /**
     * The API secret for authenticating requests (sent in body or query).
     *
     * رمز API برای احراز هویت درخواست‌ها (ارسال شده در بدنه یا پارامتر).
     *
     * @var string
     */
    protected string $apiSecret;

    /**
     * The base URL of the Zarrin Gold API.
     *
     * URL پایه API زرین گلد.
     *
     * @var string
     */
    protected string $baseUrl;

    /**
     * cURL request timeout in seconds.
     *
     * زمان انتظار درخواست cURL بر حسب ثانیه.
     *
     * @var int
     */
    protected int $timeout;

    /**
     * cURL connection timeout in seconds.
     *
     * زمان انتظار اتصال cURL بر حسب ثانیه.
     *
     * @var int
     */
    protected int $connectTimeout;

    /**
     * Whether request/response logging is enabled.
     *
     * آیا ثبت رویداد درخواست/پاسخ فعال است.
     *
     * @var bool
     */
    protected bool $loggingEnabled;

    /**
     * Array of logged request/response entries for debugging.
     *
     * آرایه ورودی‌های ثبت شده درخواست/پاسخ برای اشکال‌زدایی.
     *
     * @var array<int, array{type: string, url: string, method: string, data?: mixed, response?: mixed, statusCode: int, timestamp: string}>
     */
    protected array $log = [];

    // ------------------------------------------------------------------
    // Constructor / سازنده
    // ------------------------------------------------------------------

    /**
     * Create a new ZarrinGold SDK instance.
     *
     * ایجاد یک نمونه جدید از SDK زرین گلد.
     *
     * @param string      $apiKey         Your Zarrin Gold API key / کلید API زرین گلد شما
     * @param string      $apiSecret      Your Zarrin Gold API secret / رمز API زرین گلد شما
     * @param string|null $baseUrl        Optional custom base URL / URL پایه سفارشی اختیاری
     * @param int         $timeout        Request timeout in seconds / زمان انتظار درخواست بر حسب ثانیه
     * @param int         $connectTimeout Connection timeout in seconds / زمان انتظار اتصال بر حسب ثانیه
     *
     * @throws ZarrinGoldException If API key or secret is empty / اگر کلید یا رمز API خالی باشد
     */
    public function __construct(
        string $apiKey,
        string $apiSecret,
        ?string $baseUrl = null,
        int $timeout = self::DEFAULT_TIMEOUT,
        int $connectTimeout = self::DEFAULT_CONNECT_TIMEOUT
    ) {
        if ($apiKey === '') {
            throw new ZarrinGoldException('API key cannot be empty. / کلید API نمی‌تواند خالی باشد.');
        }
        if ($apiSecret === '') {
            throw new ZarrinGoldException('API secret cannot be empty. / رمز API نمی‌تواند خالی باشد.');
        }

        $this->apiKey = $apiKey;
        $this->apiSecret = $apiSecret;
        $this->baseUrl = rtrim($baseUrl ?? self::DEFAULT_BASE_URL, '/');
        $this->timeout = $timeout;
        $this->connectTimeout = $connectTimeout;
        $this->loggingEnabled = false;
        $this->log = [];
    }

    // ------------------------------------------------------------------
    // Public API Methods / متدهای عمومی API
    // ------------------------------------------------------------------

    /**
     * Create a new payment request on the Zarrin Gold gateway.
     *
     * ایجاد یک درخواست پرداخت جدید در درگاه زرین گلد.
     *
     * This method sends a POST request to the payment creation endpoint.
     * You must provide at least `amountFiat` or `amountGrams` along with
     * `merchantOrderId` and `callbackUrl`. The `goldPrice` parameter is
     * optional and will be determined by the gateway if not supplied.
     *
     * این متد یک درخواست POST به نقطه پایانی ایجاد پرداخت ارسال می‌کند.
     * شما باید حداقل `amountFiat` یا `amountGrams` را به همراه
     * `merchantOrderId` و `callbackUrl` ارائه دهید. پارامتر `goldPrice`
     * اختیاری است و در صورت عدم ارائه توسط درگاه تعیین می‌شود.
     *
     * @param array{
     *   amountGrams?: float,
     *   amountFiat?: float|int,
     *   goldPrice?: float|int,
     *   merchantOrderId: string,
     *   callbackUrl: string,
     *   description?: string
     * } $params Payment creation parameters / پارامترهای ایجاد پرداخت
     *
     * @return array{
     *   success: bool,
     *   payment: array{
     *     id: string,
     *     paymentUrl: string,
     *     amountGrams: float,
     *     status: string,
     *     expiresAt: string
     *   }
     * } Payment creation result / نتیجه ایجاد پرداخت
     *
     * @throws ZarrinGoldException On validation or API errors / در صورت خطای اعتبارسنجی یا API
     *
     * @example
     * ```php
     * $result = $sdk->createPayment([
     *     'amountFiat'      => 500000,
     *     'merchantOrderId' => 'ORDER-001',
     *     'callbackUrl'     => 'https://yoursite.com/callback',
     *     'description'     => 'خرید محصول',
     * ]);
     * // redirect user to $result['payment']['paymentUrl']
     * ```
     */
    public function createPayment(array $params): array
    {
        // --- Validate required fields / اعتبارسنجی فیلدهای الزامی ---
        if (empty($params['merchantOrderId'])) {
            throw new ZarrinGoldException(
                'Parameter "merchantOrderId" is required. / پارامتر "merchantOrderId" الزامی است.'
            );
        }
        if (empty($params['callbackUrl'])) {
            throw new ZarrinGoldException(
                'Parameter "callbackUrl" is required. / پارامتر "callbackUrl" الزامی است.'
            );
        }
        if (!isset($params['amountGrams']) && !isset($params['amountFiat'])) {
            throw new ZarrinGoldException(
                'Either "amountGrams" or "amountFiat" must be provided. / '
                . 'حداقل یکی از "amountGrams" یا "amountFiat" باید ارائه شود.'
            );
        }

        // Validate callback URL format / اعتبارسنجی فرمت URL بازفراخوانی
        if (!filter_var($params['callbackUrl'], FILTER_VALIDATE_URL)) {
            throw new ZarrinGoldException(
                'Parameter "callbackUrl" must be a valid URL. / پارامتر "callbackUrl" باید یک URL معتبر باشد.'
            );
        }

        // Build the request body / ساخت بدنه درخواست
        $body = array_merge(
            ['apiSecret' => $this->apiSecret],
            $params
        );

        // Execute the API call / اجرای فراخوانی API
        $response = $this->post('/api/gateway/pay/create', $body);

        return $response;
    }

    /**
     * Verify (check the status of) a payment by its ID.
     *
     * بررسی وضعیت یک پرداخت بر اساس شناسه آن.
     *
     * This method sends a GET request to retrieve the current status
     * of a previously created payment. Use this to verify whether
     * a payment has been completed, is still pending, or has been canceled.
     *
     * این متد یک درخواست GET برای دریافت وضعیت فعلی یک پرداخت
     * قبلاً ایجاد شده ارسال می‌کند. از این متد برای تأیید اینکه آیا
     * پرداخت تکمیل شده، هنوز معلق است یا لغو شده، استفاده کنید.
     *
     * @param string $paymentId The payment ID to check / شناسه پرداخت برای بررسی
     *
     * @return array{
     *   success: bool,
     *   payment: array{
     *     id: string,
     *     status: string,
     *     amountGrams: float,
     *     amountFiat: float|null,
     *     paidAt: string|null
     *   }
     * } Payment status data / داده‌های وضعیت پرداخت
     *
     * @throws ZarrinGoldException On API errors / در صورت خطای API
     *
     * @example
     * ```php
     * $status = $sdk->verifyPayment('pay_abc123');
     * if ($status['payment']['status'] === 'paid') {
     *     // Payment confirmed / پرداخت تأیید شد
     * }
     * ```
     */
    public function verifyPayment(string $paymentId): array
    {
        if ($paymentId === '') {
            throw new ZarrinGoldException(
                'Payment ID cannot be empty. / شناسه پرداخت نمی‌تواند خالی باشد.'
            );
        }

        return $this->get(
            "/api/gateway/pay/{$paymentId}/status",
            ['apiSecret' => $this->apiSecret]
        );
    }

    /**
     * Get detailed information about a specific payment.
     *
     * دریافت اطلاعات دقیق درباره یک پرداخت مشخص.
     *
     * This method retrieves the full details of a payment. If a user token
     * is provided, it will be sent as a Bearer token in the Authorization
     * header for user-scoped access. Otherwise, the default API key
     * authentication is used.
     *
     * این متد جزئیات کامل یک پرداخت را بازیابی می‌کند. اگر یک توکن
     * کاربر ارائه شود، به عنوان توکن Bearer در هدر Authorization
     * برای دسترسی محدوده کاربر ارسال می‌شود. در غیر این صورت،
     * احراز هویت پیش‌فرض با کلید API استفاده می‌شود.
     *
     * @param string      $paymentId The payment ID / شناسه پرداخت
     * @param string|null $userToken Optional user bearer token / توکن Bearer اختیاری کاربر
     *
     * @return array Payment detail data / داده‌های جزئیات پرداخت
     *
     * @throws ZarrinGoldException On API errors / در صورت خطای API
     *
     * @example
     * ```php
     * $detail = $sdk->getPaymentDetail('pay_abc123');
     * // or with user token
     * $detail = $sdk->getPaymentDetail('pay_abc123', 'user_token_here');
     * ```
     */
    public function getPaymentDetail(string $paymentId, ?string $userToken = null): array
    {
        if ($paymentId === '') {
            throw new ZarrinGoldException(
                'Payment ID cannot be empty. / شناسه پرداخت نمی‌تواند خالی باشد.'
            );
        }

        $headers = [];
        if ($userToken !== null && $userToken !== '') {
            $headers['Authorization'] = "Bearer {$userToken}";
        }

        return $this->get("/api/gateway/pay/{$paymentId}/detail", [], $headers);
    }

    /**
     * Cancel a pending payment.
     *
     * لغو یک پرداخت معلق.
     *
     * Sends a POST request to cancel a payment that has not yet been
     * completed. The `userId` parameter identifies the user who is
     * requesting the cancellation.
     *
     * یک درخواست POST برای لغو پرداختی که هنوز تکمیل نشده ارسال می‌کند.
     * پارامتر `userId` کاربری که درخواست لغو را انجام می‌دهد را شناسایی می‌کند.
     *
     * @param string $paymentId The payment ID to cancel / شناسه پرداخت برای لغو
     * @param string $userId    The user ID requesting cancellation / شناسه کاربر درخواست‌کننده لغو
     *
     * @return array Cancellation result data / داده‌های نتیجه لغو
     *
     * @throws ZarrinGoldException On validation or API errors / در صورت خطای اعتبارسنجی یا API
     *
     * @example
     * ```php
     * $result = $sdk->cancelPayment('pay_abc123', 'user_456');
     * ```
     */
    public function cancelPayment(string $paymentId, string $userId): array
    {
        if ($paymentId === '') {
            throw new ZarrinGoldException(
                'Payment ID cannot be empty. / شناسه پرداخت نمی‌تواند خالی باشد.'
            );
        }
        if ($userId === '') {
            throw new ZarrinGoldException(
                'User ID cannot be empty. / شناسه کاربر نمی‌تواند خالی باشد.'
            );
        }

        return $this->post("/api/gateway/pay/{$paymentId}/cancel", [
            'userId' => $userId,
        ]);
    }

    /**
     * Execute (confirm) a payment by its ID on behalf of a user.
     *
     * اجرا (تأیید) یک پرداخت بر اساس شناسه آن از طرف یک کاربر.
     *
     * Sends a POST request to execute a payment. This is typically called
     * by the user's browser after they have authorized the payment on the
     * gateway page.
     *
     * یک درخواست POST برای اجرای پرداخت ارسال می‌کند. این متد معمولاً
     * پس از تأیید کاربر در صفحه درگاه، توسط مرورگر کاربر فراخوانی می‌شود.
     *
     * @param string $paymentId The payment ID to execute / شناسه پرداخت برای اجرا
     * @param string $userId    The user ID executing the payment / شناسه کاربر اجراکننده پرداخت
     *
     * @return array Execution result data / داده‌های نتیجه اجرا
     *
     * @throws ZarrinGoldException On validation or API errors / در صورت خطای اعتبارسنجی یا API
     *
     * @example
     * ```php
     * $result = $sdk->executePayment('pay_abc123', 'user_456');
     * ```
     */
    public function executePayment(string $paymentId, string $userId): array
    {
        if ($paymentId === '') {
            throw new ZarrinGoldException(
                'Payment ID cannot be empty. / شناسه پرداخت نمی‌تواند خالی باشد.'
            );
        }
        if ($userId === '') {
            throw new ZarrinGoldException(
                'User ID cannot be empty. / شناسه کاربر نمی‌تواند خالی باشد.'
            );
        }

        return $this->post("/api/gateway/pay/{$paymentId}/execute", [
            'userId' => $userId,
        ]);
    }

    /**
     * Parse and validate a webhook payload from the Zarrin Gold gateway.
     *
     * تجزیه و اعتبارسنجی محموله وب‌هوک از درگاه زرین گلد.
     *
     * When the gateway sends a notification to your callback URL, use this
     * method to safely parse the JSON payload into an associative array.
     * Optionally, you can provide an `$expectedSignature` for HMAC-based
     * signature verification to ensure the webhook was actually sent by
     * the Zarrin Gold gateway.
     *
     * هنگامی که درگاه اعلانی به URL بازفراخوانی شما ارسال می‌کند، از این
     * متد برای تجزیه ایمن محموله JSON به یک آرایه انجمنی استفاده کنید.
     * به‌صورت اختیاری می‌توانید یک `$expectedSignature` برای تأیید امضا
     * مبتنی بر HMAC ارائه دهید تا اطمینان حاصل شود وب‌هوک واقعاً توسط
     * درگاه زرین گلد ارسال شده است.
     *
     * @param string      $jsonPayload      Raw JSON string from the request body / رشته JSON خام از بدنه درخواست
     * @param string|null $expectedSignature Optional HMAC signature for verification / امضای HMAC اختیاری برای تأیید
     * @param string|null $webhookSecret    Optional webhook secret for signature generation / رمز وب‌هوک اختیاری برای تولید امضا
     *
     * @return array{
     *   paymentId: string,
     *   merchantOrderId: string,
     *   status: string,
     *   amountGrams: float,
     *   amountFiat: float,
     *   paidAt: string
     * } Parsed webhook data / داده‌های وب‌هوک تجزیه شده
     *
     * @throws ZarrinGoldException If JSON is invalid or signature verification fails
     *                             اگر JSON نامعتبر باشد یا تأیید امضا ناموفق باشد
     *
     * @example
     * ```php
     * // Read raw input / خواندن ورودی خام
     * $payload = file_get_contents('php://input');
     *
     * // Parse webhook / تجزیه وب‌هوک
     * $data = $sdk->verifyWebhook($payload);
     *
     * if ($data['status'] === 'paid') {
     *     // Fulfill the order / تکمیل سفارش
     *     $sdk->respondToWebhook();
     * }
     * ```
     */
    public function verifyWebhook(string $jsonPayload, ?string $expectedSignature = null, ?string $webhookSecret = null): array
    {
        if ($jsonPayload === '') {
            throw new ZarrinGoldException(
                'Webhook payload cannot be empty. / محموله وب‌هوک نمی‌تواند خالی باشد.'
            );
        }

        // --- Signature verification / تأیید امضا ---
        if ($expectedSignature !== null && $expectedSignature !== '') {
            if ($webhookSecret === null || $webhookSecret === '') {
                $webhookSecret = $this->apiSecret;
            }
            $computedSignature = hash_hmac('sha256', $jsonPayload, $webhookSecret);
            if (!hash_equals($computedSignature, $expectedSignature)) {
                throw new ZarrinGoldException(
                    'Webhook signature verification failed. / تأیید امضای وب‌هوک ناموفق بود.',
                    0,
                    401
                );
            }
        }

        // --- Decode JSON / رمزگشایی JSON ---
        $data = json_decode($jsonPayload, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ZarrinGoldException(
                'Invalid webhook JSON payload: ' . json_last_error_msg()
                . ' / محموله JSON وب‌هوک نامعتبر: ' . json_last_error_msg()
            );
        }

        if (!is_array($data)) {
            throw new ZarrinGoldException(
                'Webhook payload must be a JSON object. / محموله وب‌هوک باید یک شیء JSON باشد.'
            );
        }

        // --- Validate required webhook fields / اعتبارسنجی فیلدهای الزامی وب‌هوک ---
        $requiredFields = ['paymentId', 'merchantOrderId', 'status', 'amountGrams'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new ZarrinGoldException(
                    "Missing required webhook field: \"{$field}\". / "
                    . "فیلد الزامی وب‌هوک وجود ندارد: \"{$field}\"."
                );
            }
        }

        return $data;
    }

    /**
     * Send the required webhook acknowledgment response.
     *
     * ارسال پاسخ تأیید الزامی وب‌هوک.
     *
     * The Zarrin Gold gateway expects your callback URL to respond with
     * a JSON body `{ "success": true }` and HTTP status code 200.
     * Call this method in your webhook handler to send that response
     * and terminate further script execution.
     *
     * درگاه زرین گلد انتظار دارد URL بازفراخوانی شما با یک بدنه JSON
     * `{ "success": true }` و کد وضعیت HTTP 200 پاسخ دهد. این متد را
     * در کنترل‌کننده وب‌هوک خود فراخوانی کنید تا آن پاسخ ارسال شده
     * و اجرای اسکریپت متوقف شود.
     *
     * @return never This method terminates script execution / این متد اجرای اسکریپت را متوقف می‌کند
     */
    public function respondToWebhook(): void
    {
        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ------------------------------------------------------------------
    // Logging Methods / متدهای ثبت رویداد
    // ------------------------------------------------------------------

    /**
     * Enable request/response logging for debugging.
     *
     * فعال‌سازی ثبت رویداد درخواست/پاسخ برای اشکال‌زدایی.
     *
     * When enabled, all API requests and responses are recorded in memory
     * and can be retrieved via `getLog()` or `getLastLogEntry()`.
     *
     * هنگامی که فعال باشد، تمام درخواست‌ها و پاسخ‌های API در حافظه
     * ثبت شده و از طریق `getLog()` یا `getLastLogEntry()` قابل بازیابی هستند.
     *
     * @return self For method chaining / برای زنجیره متدها
     */
    public function enableLogging(): self
    {
        $this->loggingEnabled = true;
        return $this;
    }

    /**
     * Disable request/response logging.
     *
     * غیرفعال‌سازی ثبت رویداد درخواست/پاسخ.
     *
     * @return self For method chaining / برای زنجیره متدها
     */
    public function disableLogging(): self
    {
        $this->loggingEnabled = false;
        return $this;
    }

    /**
     * Check whether logging is currently enabled.
     *
     * بررسی اینکه آیا ثبت رویداد در حال حاضر فعال است.
     *
     * @return bool
     */
    public function isLoggingEnabled(): bool
    {
        return $this->loggingEnabled;
    }

    /**
     * Get all logged request/response entries.
     *
     * دریافت تمام ورودی‌های ثبت شده درخواست/پاسخ.
     *
     * @return array<int, array{type: string, url: string, method: string, data?: mixed, response?: mixed, statusCode: int, timestamp: string}>
     */
    public function getLog(): array
    {
        return $this->log;
    }

    /**
     * Get the most recent log entry.
     *
     * دریافت جدیدترین ورودی ثبت رویداد.
     *
     * @return array{type: string, url: string, method: string, data?: mixed, response?: mixed, statusCode: int, timestamp: string}|null
     */
    public function getLastLogEntry(): ?array
    {
        if (empty($this->log)) {
            return null;
        }
        return end($this->log);
    }

    /**
     * Clear all logged entries.
     *
     * پاک‌سازی تمام ورودی‌های ثبت شده.
     *
     * @return self For method chaining / برای زنجیره متدها
     */
    public function clearLog(): self
    {
        $this->log = [];
        return $this;
    }

    // ------------------------------------------------------------------
    // Configuration Getters / گیرنده‌های پیکربندی
    // ------------------------------------------------------------------

    /**
     * Get the configured API key.
     *
     * دریافت کلید API پیکربندی شده.
     *
     * @return string
     */
    public function getApiKey(): string
    {
        return $this->apiKey;
    }

    /**
     * Get the configured base URL.
     *
     * دریافت URL پایه پیکربندی شده.
     *
     * @return string
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Get the configured request timeout.
     *
     * دریافت زمان انتظار درخواست پیکربندی شده.
     *
     * @return int
     */
    public function getTimeout(): int
    {
        return $this->timeout;
    }

    /**
     * Get the configured connection timeout.
     *
     * دریافت زمان انتظار اتصال پیکربندی شده.
     *
     * @return int
     */
    public function getConnectTimeout(): int
    {
        return $this->connectTimeout;
    }

    /**
     * Set the request timeout (in seconds).
     *
     * تنظیم زمان انتظار درخواست (بر حسب ثانیه).
     *
     * @param int $timeout Timeout in seconds / زمان انتظار بر حسب ثانیه
     *
     * @return self For method chaining / برای زنجیره متدها
     */
    public function setTimeout(int $timeout): self
    {
        $this->timeout = $timeout;
        return $this;
    }

    /**
     * Set the connection timeout (in seconds).
     *
     * تنظیم زمان انتظار اتصال (بر حسب ثانیه).
     *
     * @param int $connectTimeout Timeout in seconds / زمان انتظار بر حسب ثانیه
     *
     * @return self For method chaining / برای زنجیره متدها
     */
    public function setConnectTimeout(int $connectTimeout): self
    {
        $this->connectTimeout = $connectTimeout;
        return $this;
    }

    // ------------------------------------------------------------------
    // HTTP Request Methods (Internal) / متدهای درخواست HTTP (داخلی)
    // ------------------------------------------------------------------

    /**
     * Send an authenticated GET request to the API.
     *
     * ارسال یک درخواست GET احراز شده به API.
     *
     * @param string               $endpoint The API endpoint path / مسیر نقطه پایانی API
     * @param array<string, mixed> $query    Query parameters / پارامترهای درخواست
     * @param array<string, string> $headers  Additional headers / هدرهای اضافی
     *
     * @return array Decoded JSON response / پاسخ JSON رمزگشایی شده
     *
     * @throws ZarrinGoldException On cURL or API errors / در صورت خطای cURL یا API
     */
    protected function get(string $endpoint, array $query = [], array $headers = []): array
    {
        $url = $this->buildUrl($endpoint, $query);

        $defaultHeaders = [
            'X-API-Key'    => $this->apiKey,
            'Accept'       => 'application/json',
            'User-Agent'   => $this->buildUserAgent(),
        ];

        $allHeaders = array_merge($defaultHeaders, $headers);

        return $this->executeRequest('GET', $url, null, $allHeaders);
    }

    /**
     * Send an authenticated POST request to the API.
     *
     * ارسال یک درخواست POST احراز شده به API.
     *
     * @param string               $endpoint The API endpoint path / مسیر نقطه پایانی API
     * @param array<string, mixed> $data     Request body data / داده‌های بدنه درخواست
     * @param array<string, string> $headers  Additional headers / هدرهای اضافی
     *
     * @return array Decoded JSON response / پاسخ JSON رمزگشایی شده
     *
     * @throws ZarrinGoldException On cURL or API errors / در صورت خطای cURL یا API
     */
    protected function post(string $endpoint, array $data = [], array $headers = []): array
    {
        $url = $this->buildUrl($endpoint);

        $defaultHeaders = [
            'X-API-Key'      => $this->apiKey,
            'Content-Type'   => 'application/json',
            'Accept'         => 'application/json',
            'User-Agent'     => $this->buildUserAgent(),
        ];

        $allHeaders = array_merge($defaultHeaders, $headers);

        return $this->executeRequest('POST', $url, $data, $allHeaders);
    }

    // ------------------------------------------------------------------
    // Internal Helpers / راهنمای‌های داخلی
    // ------------------------------------------------------------------

    /**
     * Build the full URL for an API endpoint, optionally with query parameters.
     *
     * ساخت URL کامل برای یک نقطه پایانی API، به‌صورت اختیاری با پارامترهای درخواست.
     *
     * @param string               $endpoint The endpoint path (e.g., /api/gateway/pay/create)
     *                                        مسیر نقطه پایانی (مثلاً /api/gateway/pay/create)
     * @param array<string, mixed> $query    Query parameters to append / پارامترهای درخواست برای اضافه کردن
     *
     * @return string The fully-qualified URL / URL کاملاً تأیید شده
     */
    protected function buildUrl(string $endpoint, array $query = []): string
    {
        $url = $this->baseUrl . $endpoint;

        if (!empty($query)) {
            $queryString = http_build_query($query, '', '&', PHP_QUERY_RFC3986);
            $url .= '?' . $queryString;
        }

        return $url;
    }

    /**
     * Build the User-Agent string for API requests.
     *
     * ساخت رشته User-Agent برای درخواست‌های API.
     *
     * @return string
     */
    protected function buildUserAgent(): string
    {
        return sprintf(
            'ZarrinGold-PHP-SDK/%s (PHP/%s; cURL/%s)',
            self::VERSION,
            PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '.' . PHP_RELEASE_VERSION,
            $this->getCurlVersion()
        );
    }

    /**
     * Get the installed cURL version number.
     *
     * دریافت شماره نسخه cURL نصب شده.
     *
     * @return string
     */
    protected function getCurlVersion(): string
    {
        $version = curl_version();
        return $version['version'] ?? 'unknown';
    }

    /**
     * Execute a cURL request and return the decoded JSON response.
     *
     * اجرای یک درخواست cURL و بازگرداندن پاسخ JSON رمزگشایی شده.
     *
     * This is the core HTTP method that handles all communication with the
     * Zarrin Gold API. It configures cURL with proper headers, timeouts,
     * SSL verification, and error handling.
     *
     * این متد HTTP اصلی است که تمام ارتباطات با API زرین گلد را مدیریت
     * می‌کند. cURL را با هدرهای مناسب، زمان‌بندی، تأیید SSL و مدیریت
     * خطا پیکربندی می‌کند.
     *
     * @param string               $method  HTTP method (GET, POST) / متد HTTP
     * @param string               $url     Full request URL / URL کامل درخواست
     * @param array<string, mixed>|null $data Request body data for POST / داده‌های بدنه درخواست برای POST
     * @param array<string, string> $headers HTTP headers / هدرهای HTTP
     *
     * @return array Decoded JSON response / پاسخ JSON رمزگشایی شده
     *
     * @throws ZarrinGoldException On cURL errors, non-2xx responses, or invalid JSON
     *                             در صورت خطای cURL، پاسخ‌های غیر 2xx یا JSON نامعتبر
     */
    protected function executeRequest(string $method, string $url, ?array $data, array $headers): array
    {
        $ch = curl_init();

        // Build the header array for cURL / ساخت آرایه هدر برای cURL
        $curlHeaders = [];
        foreach ($headers as $key => $value) {
            $curlHeaders[] = "{$key}: {$value}";
        }

        // Configure cURL options / پیکربندی گزینه‌های cURL
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => false,
            CURLOPT_ENCODING       => '',
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => $this->connectTimeout,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => $curlHeaders,
        ]);

        // Set HTTP method and body / تنظیم متد HTTP و بدنه
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            $jsonBody = ($data !== null) ? json_encode($data, JSON_UNESCAPED_UNICODE) : '';
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
        } elseif ($method === 'GET') {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        }

        // Execute the request / اجرای درخواست
        $responseBody = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlErrno = curl_errno($ch);

        curl_close($ch);

        // --- Log the request/response if enabled / ثبت درخواست/پاسخ در صورت فعال بودن ---
        if ($this->loggingEnabled) {
            $this->log[] = [
                'type'      => strtolower($method),
                'url'       => $url,
                'method'    => $method,
                'data'      => $data,
                'response'  => $responseBody,
                'statusCode' => $statusCode,
                'timestamp' => date('Y-m-d\TH:i:s\Z'),
            ];
        }

        // --- Handle cURL-level errors / مدیریت خطاهای سطح cURL ---
        if ($curlErrno !== 0) {
            throw new ZarrinGoldException(
                "cURL error ({$curlErrno}): {$curlError} / خطای cURL ({$curlErrno}): {$curlError}",
                $curlErrno
            );
        }

        // --- Handle HTTP-level errors / مدیریت خطاهای سطح HTTP ---
        if ($statusCode < 200 || $statusCode >= 300) {
            $decoded = $this->safeJsonDecode($responseBody);
            $errorMessage = $decoded['error']['message']
                ?? $decoded['message']
                ?? "HTTP request failed with status {$statusCode}."
                . " درخواست HTTP با وضعیت {$statusCode} ناموفق بود.";

            throw new ZarrinGoldException(
                $errorMessage,
                $statusCode,
                $statusCode,
                $responseBody
            );
        }

        // --- Decode the JSON response / رمزگشایی پاسخ JSON ---
        if ($responseBody === false || $responseBody === '') {
            throw new ZarrinGoldException(
                'Empty response received from the API. / پاسخ خالی از API دریافت شد.',
                0,
                $statusCode,
                ''
            );
        }

        $decoded = $this->safeJsonDecode($responseBody);

        if ($decoded === null) {
            throw new ZarrinGoldException(
                'Failed to decode JSON response from the API. / رمزگشایی پاسخ JSON از API ناموفق بود.',
                0,
                $statusCode,
                $responseBody
            );
        }

        return $decoded;
    }

    /**
     * Safely decode a JSON string into an associative array.
     *
     * رمزگشایی ایمن یک رشته JSON به یک آرایه انجمنی.
     *
     * @param string $jsonString The JSON string to decode / رشته JSON برای رمزگشایی
     *
     * @return array|null The decoded array, or null on failure / آرایه رمزگشایی شده، یا نول در صورت شکست
     */
    protected function safeJsonDecode(string $jsonString): ?array
    {
        $decoded = json_decode($jsonString, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }
}
