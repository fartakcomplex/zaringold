/**
 * @module zarrin-gold-sdk
 * @description
 * رسمی درگاه پرداخت زرین گلد | Official Node.js SDK for Zarrin Gold Payment Gateway
 *
 * این SDK تمامی API های درگاه پرداخت زرین گلد را پوشش می‌دهد.
 * This SDK wraps all API endpoints of the Zarrin Gold payment gateway.
 *
 * @example
 * ```typescript
 * import { ZarrinGold } from 'zarrin-gold-sdk';
 *
 * const client = new ZarrinGold({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 * });
 *
 * const result = await client.createPayment({
 *   amountFiat: 500000,
 *   merchantOrderId: 'ORDER-123',
 *   callbackUrl: 'https://your-site.com/callback',
 * });
 * console.log(result.payment.paymentUrl);
 * ```
 */

// ============================================================================
// Configuration & Types
// ============================================================================

/**
 * تنظیمات اولیه کلاینت | Client configuration options
 */
export interface ZarrinGoldConfig {
  /** کلید API شما از پنل زرین گلد | Your API Key from Zarrin Gold dashboard */
  apiKey: string;
  /** رمز API شما از پنل زرین گلد | Your API Secret from Zarrin Gold dashboard */
  apiSecret: string;
  /**
   * آدرس پایه API (پیش‌فرض: https://zarringold.com)
   * Base URL of the API (default: https://zarringold.com)
   */
  baseUrl?: string;
  /**
   * مهلت زمانی درخواست‌ها به میلی‌ثانیه (پیش‌فرض: ۳۰۰۰۰)
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * پارامترهای ساخت پرداخت جدید | Parameters for creating a new payment
 */
export interface CreatePaymentParams {
  /**
   * مبلغ به گرم طلا (اختیاری در صورت وجود amountFiat)
   * Amount in gold grams (optional if amountFiat is provided)
   */
  amountGrams?: number;
  /**
   * مبلغ به واحد فیات/ریال (اختیاری در صورت وجود amountGrams)
   * Amount in fiat/currency (optional if amountGrams is provided)
   */
  amountFiat?: number;
  /**
   * قیمت لحظه‌ای طلا (اختیاری - در صورت عدم ارسال از سمت سرور محاسبه می‌شود)
   * Current gold price (optional - server will calculate if not provided)
   */
  goldPrice?: number;
  /** شناسه یکتای سفارش در سیستم شما | Unique order ID in your system */
  merchantOrderId: string;
  /** آدرس بازگشت (callback) پس از پرداخت | Callback URL after payment */
  callbackUrl: string;
  /** توضیحات پرداخت (اختیاری) | Payment description (optional) */
  description?: string;
}

/**
 * پارامترهای لغو پرداخت | Parameters for cancelling a payment
 */
export interface CancelPaymentParams {
  /** شناسه کاربر | User ID */
  userId: string;
}

// ============================================================================
// Response Types — Inner Objects
// ============================================================================

/**
 * اطلاعات پرداخت در پاسخ ساخت | Payment info in create response
 */
export interface PaymentInfo {
  /** شناسه پرداخت | Payment ID */
  id: string;
  /** آدرس صفحه پرداخت | Payment page URL */
  paymentUrl: string;
  /** مبلغ به گرم طلا | Amount in gold grams */
  amountGrams: number;
  /** وضعیت پرداخت | Payment status */
  status: string;
  /** زمان انقضای لینک پرداخت | Payment link expiration time */
  expiresAt: string;
}

/**
 * اطلاعات وضعیت پرداخت | Payment status info
 */
export interface PaymentStatus {
  /** شناسه پرداخت | Payment ID */
  id: string;
  /** وضعیت پرداخت | Payment status */
  status: string;
  /** مبلغ به گرم طلا | Amount in gold grams */
  amountGrams: number;
  /** مبلغ به فیات | Amount in fiat */
  amountFiat: number;
  /** زمان پرداخت | Time of payment */
  paidAt: string | null;
}

/**
 * جزئیات کامل پرداخت | Full payment details
 */
export interface PaymentDetail {
  /** شناسه پرداخت | Payment ID */
  id: string;
  /** شناسه سفارش فروشنده | Merchant order ID */
  merchantOrderId: string;
  /** وضعیت پرداخت | Payment status */
  status: string;
  /** مبلغ به گرم طلا | Amount in gold grams */
  amountGrams: number;
  /** مبلغ به فیات | Amount in fiat */
  amountFiat: number;
  /** آدرس صفحه پرداخت | Payment page URL */
  paymentUrl: string;
  /** توضیحات | Description */
  description: string | null;
  /** زمان ایجاد | Creation time */
  createdAt: string;
  /** زمان به‌روزرسانی | Update time */
  updatedAt: string;
  /** زمان پرداخت | Time of payment */
  paidAt: string | null;
  /** زمان انقضا | Expiration time */
  expiresAt: string;
}

// ============================================================================
// Response Types — Wrappers
// ============================================================================

/**
 * پاسخ ساخت پرداخت | Create payment response
 */
export interface CreatePaymentResponse {
  /** آیا عملیات موفق بود؟ | Was the operation successful? */
  success: boolean;
  /** اطلاعات پرداخت | Payment information */
  payment: PaymentInfo;
  /** پیام خطا (در صورت عدم موفقیت) | Error message (if unsuccessful) */
  message?: string;
}

/**
 * پاسخ بررسی وضعیت پرداخت | Verify payment response
 */
export interface VerifyPaymentResponse {
  /** آیا عملیات موفق بود؟ | Was the operation successful? */
  success: boolean;
  /** وضعیت پرداخت | Payment status */
  payment: PaymentStatus;
  /** پیام خطا (در صورت عدم موفقیت) | Error message (if unsuccessful) */
  message?: string;
}

/**
 * پاسخ جزئیات پرداخت | Payment detail response
 */
export interface PaymentDetailResponse {
  /** آیا عملیات موفق بود؟ | Was the operation successful? */
  success: boolean;
  /** جزئیات پرداخت | Payment details */
  payment: PaymentDetail;
  /** پیام خطا (در صورت عدم موفقیت) | Error message (if unsuccessful) */
  message?: string;
}

/**
 * پاسخ لغو پرداخت | Cancel payment response
 */
export interface CancelPaymentResponse {
  /** آیا عملیات موفق بود؟ | Was the operation successful? */
  success: boolean;
  /** وضعیت جدید پرداخت | New payment status */
  status?: string;
  /** پیام | Message */
  message?: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * اطلاعات دریافتی از وب‌هوک | Data received from webhook
 */
export interface WebhookPayload {
  /** شناسه پرداخت | Payment ID */
  paymentId: string;
  /** شناسه سفارش فروشنده | Merchant order ID */
  merchantOrderId: string;
  /** وضعیت پرداخت | Payment status */
  status: string;
  /** مبلغ پرداخت شده به گرم | Amount paid in grams */
  amountGrams: number;
  /** مبلغ پرداخت شده به فیات | Amount paid in fiat */
  amountFiat: number;
  /** زمان پرداخت | Payment time */
  paidAt: string;
}

/**
 * پاسخ موفقیت وب‌هوک | Webhook success response
 */
export interface WebhookSuccessResponse {
  success: true;
}

// ============================================================================
// Custom Error Class
// ============================================================================

/**
 * خطای اختصاصی زرین گلد | Zarrin Gold custom error class
 *
 * @example
 * ```typescript
 * try {
 *   await client.createPayment(params);
 * } catch (error) {
 *   if (error instanceof ZarrinGoldError) {
 *     console.error(`[${error.statusCode}] ${error.message}`);
 *     console.error('Details:', error.details);
 *   }
 * }
 * ```
 */
export class ZarrinGoldError extends Error {
  /** کد وضعیت HTTP | HTTP status code */
  public statusCode: number;
  /** جزئیات خطا از سمت سرور | Error details from server */
  public details: unknown;

  constructor(message: string, statusCode: number = 0, details?: unknown) {
    super(message);
    this.name = 'ZarrinGoldError';
    this.statusCode = statusCode;
    this.details = details;

    // Restore prototype chain for TypeScript (see: https://stackoverflow.com/q/41102060)
    Object.setPrototypeOf(this, ZarrinGoldError.prototype);
  }
}

// ============================================================================
// Helper — Supported statuses
// ============================================================================

/**
 * وضعیت‌های ممکن پرداخت | Possible payment statuses
 */
export const PaymentStatuses = {
  /** در انتظار پرداخت | Pending payment */
  PENDING: 'pending',
  /** پرداخت شده | Paid */
  PAID: 'paid',
  /** لغو شده | Cancelled */
  CANCELLED: 'cancelled',
  /** منقضی شده | Expired */
  EXPIRED: 'expired',
  /** ناموفق | Failed */
  FAILED: 'failed',
} as const;

export type PaymentStatusType = (typeof PaymentStatuses)[keyof typeof PaymentStatuses];

// ============================================================================
// Main SDK Class
// ============================================================================

/**
 * کلاینت اصلی SDK زرین گلد | Main Zarrin Gold SDK Client
 *
 * این کلاس تمامی متدهای لازم برای ارتباط با درگاه پرداخت زرین گلد را فراهم می‌کند.
 * This class provides all methods needed to interact with the Zarrin Gold payment gateway.
 *
 * @example
 * ```typescript
 * const client = new ZarrinGold({
 *   apiKey: process.env.ZARRIN_GOLD_API_KEY!,
 *   apiSecret: process.env.ZARRIN_GOLD_API_SECRET!,
 * });
 * ```
 */
export class ZarrinGold {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * ایجاد نمونه جدید از کلاینت | Create a new client instance
   *
   * @param config - تنظیمات کلاینت | Client configuration
   * @throws {Error} اگر apiKey یا apiSecret ارائه نشود | If apiKey or apiSecret is missing
   */
  constructor(config: ZarrinGoldConfig) {
    if (!config.apiKey) {
      throw new Error('ZarrinGold: apiKey is required');
    }
    if (!config.apiSecret) {
      throw new Error('ZarrinGold: apiSecret is required');
    }

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = (config.baseUrl || 'https://zarringold.com').replace(/\/+$/, '');
    this.timeout = config.timeout ?? 30000;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * اجرای درخواست HTTP با مدیریت خطا | Execute HTTP request with error handling
   */
  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    options: {
      body?: Record<string, unknown>;
      useAuthBearer?: boolean;
      userToken?: string;
    } = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    // برای درخواست‌های GET، apiSecret در query string قرار می‌گیرد
    // For GET requests, apiSecret goes in the query string
    if (method === 'GET') {
      url.searchParams.set('apiSecret', this.apiSecret);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // استفاده از X-API-Key یا Bearer Token
    // Use X-API-Key or Bearer Token
    if (options.useAuthBearer && options.userToken) {
      headers['Authorization'] = `Bearer ${options.userToken}`;
    } else {
      headers['X-API-Key'] = this.apiKey;
    }

    // برای POST، apiSecret در body قرار می‌گیرد
    // For POST, apiSecret goes in the body
    const bodyPayload: Record<string, unknown> = {};
    if (method === 'POST') {
      bodyPayload.apiSecret = this.apiSecret;
      if (options.body) {
        Object.assign(bodyPayload, options.body);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: globalThis.Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(bodyPayload) : undefined,
        signal: controller.signal,
      });
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ZarrinGoldError(
          `Request timeout: the request to ${path} took longer than ${this.timeout}ms`,
          408,
        );
      }

      throw new ZarrinGoldError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        0,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // خواندن بدنه پاسخ | Read response body
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      const text = await response.text().catch(() => '');
      throw new ZarrinGoldError(
        `Invalid JSON response from server (HTTP ${response.status}): ${text.substring(0, 200)}`,
        response.status,
      );
    }

    // بررسی وضعیت پاسخ | Check response status
    if (!response.ok) {
      const errorMessage =
        (data as Record<string, unknown>)?.message ||
        (data as Record<string, unknown>)?.error ||
        `HTTP ${response.status}: ${response.statusText}`;

      throw new ZarrinGoldError(
        String(errorMessage),
        response.status,
        data,
      );
    }

    return data as T;
  }

  // --------------------------------------------------------------------------
  // Public API Methods
  // --------------------------------------------------------------------------

  /**
   * ساخت یک پرداخت جدید | Create a new payment
   *
   * با این متد می‌توانید یک تراکنش پرداخت جدید ایجاد کنید.
   * Upon success, a `paymentUrl` is returned that you should redirect the user to.
   *
   * @param params - پارامترهای ساخت پرداخت | Payment creation parameters
   * @returns پاسخ ساخت پرداخت شامل لینک پرداخت | Create payment response including payment URL
   * @throws {ZarrinGoldError} در صورت بروز خطا | On error
   *
   * @example
   * ```typescript
   * const result = await client.createPayment({
   *   amountFiat: 500000,
   *   merchantOrderId: 'ORDER-123',
   *   callbackUrl: 'https://your-site.com/callback',
   *   description: 'خرید محصول شماره ۱',
   * });
   *
   * // هدایت کاربر به صفحه پرداخت
   * // Redirect user to payment page
   * res.redirect(result.payment.paymentUrl);
   * ```
   */
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
    return this.request<CreatePaymentResponse>('POST', '/api/gateway/pay/create', {
      body: {
        amountGrams: params.amountGrams,
        amountFiat: params.amountFiat,
        goldPrice: params.goldPrice,
        merchantOrderId: params.merchantOrderId,
        callbackUrl: params.callbackUrl,
        description: params.description,
      },
    });
  }

  /**
   * بررسی وضعیت پرداخت | Verify / check payment status
   *
   * از این متد برای بررسی وضعیت یک پرداخت استفاده کنید.
   * Use this method to verify whether a payment has been completed.
   *
   * @param paymentId - شناسه پرداخت | Payment ID (e.g., `pay_abc123`)
   * @returns وضعیت پرداخت | Payment status
   * @throws {ZarrinGoldError} در صورت بروز خطا | On error
   *
   * @example
   * ```typescript
   * const result = await client.verifyPayment('pay_abc123');
   *
   * if (result.payment.status === 'paid') {
   *   console.log('پرداخت موفق بود!');
   *   console.log('مبلغ:', result.payment.amountGrams, 'گرم');
   * }
   * ```
   */
  async verifyPayment(paymentId: string): Promise<VerifyPaymentResponse> {
    if (!paymentId) {
      throw new Error('ZarrinGold: paymentId is required');
    }

    return this.request<VerifyPaymentResponse>(
      'GET',
      `/api/gateway/pay/${encodeURIComponent(paymentId)}/status`,
    );
  }

  /**
   * دریافت جزئیات کامل پرداخت | Get full payment details
   *
   * این متد تمامی اطلاعات مربوط به یک پرداخت را برمی‌گرداند.
   * This method returns all information related to a payment.
   *
   * @param paymentId - شناسه پرداخت | Payment ID
   * @param userToken - توکن کاربر (اختیاری) | User token (optional)
   * @returns جزئیات پرداخت | Payment details
   * @throws {ZarrinGoldError} در صورت بروز خطا | On error
   *
   * @example
   * ```typescript
   * const result = await client.getPaymentDetail('pay_abc123', 'user-token-here');
   * console.log(result.payment);
   * ```
   */
  async getPaymentDetail(
    paymentId: string,
    userToken?: string,
  ): Promise<PaymentDetailResponse> {
    if (!paymentId) {
      throw new Error('ZarrinGold: paymentId is required');
    }

    return this.request<PaymentDetailResponse>(
      'GET',
      `/api/gateway/pay/${encodeURIComponent(paymentId)}/detail`,
      {
        useAuthBearer: true,
        userToken,
      },
    );
  }

  /**
   * لغو پرداخت | Cancel a payment
   *
   * با این متد می‌توانید یک پرداخت فعال را لغو کنید.
   * Use this method to cancel an active payment.
   *
   * @param paymentId - شناسه پرداخت | Payment ID
   * @param userId - شناسه کاربر درخواست‌کننده لغو | ID of the user requesting cancellation
   * @returns نتیجه لغو پرداخت | Cancellation result
   * @throws {ZarrinGoldError} در صورت بروز خطا | On error
   *
   * @example
   * ```typescript
   * const result = await client.cancelPayment('pay_abc123', 'user_42');
   *
   * if (result.success) {
   *   console.log('پرداخت با موفقیت لغو شد');
   * }
   * ```
   */
  async cancelPayment(
    paymentId: string,
    userId: string,
  ): Promise<CancelPaymentResponse> {
    if (!paymentId) {
      throw new Error('ZarrinGold: paymentId is required');
    }
    if (!userId) {
      throw new Error('ZarrinGold: userId is required');
    }

    return this.request<CancelPaymentResponse>(
      'POST',
      `/api/gateway/pay/${encodeURIComponent(paymentId)}/cancel`,
      {
        body: { userId },
      },
    );
  }

  /**
   * اجرای پرداخت (سمت کاربر) | Execute payment (user-side)
   *
   * این متد معمولاً از سمت کلاینت استفاده می‌شود.
   * This method is typically used from the client side.
   *
   * @param paymentId - شناسه پرداخت | Payment ID
   * @param userId - شناسه کاربر | User ID
   * @returns نتیجه اجرای پرداخت | Payment execution result
   * @throws {ZarrinGoldError} در صورت بروز خطا | On error
   *
   * @example
   * ```typescript
   * const result = await client.executePayment('pay_abc123', 'user_42');
   * ```
   */
  async executePayment(
    paymentId: string,
    userId: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!paymentId) {
      throw new Error('ZarrinGold: paymentId is required');
    }
    if (!userId) {
      throw new Error('ZarrinGold: userId is required');
    }

    return this.request<{ success: boolean; message?: string }>(
      'POST',
      `/api/gateway/pay/${encodeURIComponent(paymentId)}/execute`,
      {
        body: { userId },
      },
    );
  }
}

// ============================================================================
// Webhook Helper Class
// ============================================================================

/**
 * کلاس کمکی وب‌هوک | Webhook helper class
 *
 * از این کلاس برای مدیریت و اعتبارسنجی وب‌هوک‌های دریافتی از زرین گلد استفاده کنید.
 * Use this class to handle and validate webhooks received from Zarrin Gold.
 *
 * @example
 * ```typescript
 * const webhook = new ZarrinGoldWebhook();
 *
 * app.post('/webhook', (req, res) => {
 *   const payload = webhook.parseWebhook(req.body);
 *
 *   if (webhook.isPaidStatus(payload.status)) {
 *     // پرداخت موفق - سفارش را تایید کنید
 *     // Payment successful - confirm the order
 *     fulfillOrder(payload.merchantOrderId, payload.amountGrams);
 *   }
 *
 *   res.json(webhook.createSuccessResponse());
 * });
 * ```
 */
export class ZarrinGoldWebhook {
  /**
   * فیلدهای مورد نیاز وب‌هوک | Required webhook fields
   * @private
   */
  private static readonly REQUIRED_FIELDS: (keyof WebhookPayload)[] = [
    'paymentId',
    'merchantOrderId',
    'status',
    'amountGrams',
    'amountFiat',
    'paidAt',
  ];

  /**
   * تجزیه و اعتبارسنجی بدنه وب‌هوک | Parse and validate webhook body
   *
   * این متد بدنه دریافتی از وب‌هوک را بررسی و به فرمت استاندارد تبدیل می‌کند.
   * This method validates the webhook body and converts it to a standard format.
   *
   * @param body - بدنه دریافتی از وب‌هوک | Raw webhook body
   * @returns اطلاعات پرداخت وب‌هوک | Parsed webhook payload
   * @throws {ZarrinGoldError} اگر بدنه نامعتبر باشد | If body is invalid
   *
   * @example
   * ```typescript
   * try {
   *   const payload = webhook.parseWebhook(req.body);
   *   console.log('Payment ID:', payload.paymentId);
   *   console.log('Status:', payload.status);
   * } catch (error) {
   *   console.error('Invalid webhook:', error);
   * }
   * ```
   */
  parseWebhook(body: unknown): WebhookPayload {
    if (!body || typeof body !== 'object') {
      throw new ZarrinGoldError(
        'Invalid webhook body: body must be a non-null object',
        400,
      );
    }

    const data = body as Record<string, unknown>;

    // بررسی وجود فیلدهای اجباری | Check for required fields
    for (const field of ZarrinGoldWebhook.REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null) {
        throw new ZarrinGoldError(
          `Invalid webhook body: missing required field "${field}"`,
          400,
        );
      }
    }

    return {
      paymentId: String(data.paymentId),
      merchantOrderId: String(data.merchantOrderId),
      status: String(data.status),
      amountGrams: Number(data.amountGrams),
      amountFiat: Number(data.amountFiat),
      paidAt: String(data.paidAt),
    };
  }

  /**
   * بررسی آیا وضعیت پرداخت «پرداخت شده» است | Check if payment status is "paid"
   *
   * @param status - وضعیت پرداخت | Payment status string
   * @returns آیا پرداخت شده است | Whether payment is paid
   *
   * @example
   * ```typescript
   * if (webhook.isPaidStatus(payload.status)) {
   *   // تایید سفارش
   *   confirmOrder();
   * }
   * ```
   */
  isPaidStatus(status: string): boolean {
    return status === PaymentStatuses.PAID;
  }

  /**
   * بررسی آیا وضعیت پرداخت «لغو شده» است | Check if payment status is "cancelled"
   *
   * @param status - وضعیت پرداخت | Payment status string
   * @returns آیا لغو شده است | Whether payment is cancelled
   */
  isCancelledStatus(status: string): boolean {
    return status === PaymentStatuses.CANCELLED;
  }

  /**
   * بررسی آیا وضعیت پرداخت «منقضی شده» است | Check if payment status is "expired"
   *
   * @param status - وضعیت پرداخت | Payment status string
   * @returns آیا منقضی شده است | Whether payment is expired
   */
  isExpiredStatus(status: string): boolean {
    return status === PaymentStatuses.EXPIRED;
  }

  /**
   * بررسی آیا وضعیت پرداخت «ناموفق» است | Check if payment status is "failed"
   *
   * @param status - وضعیت پرداخت | Payment status string
   * @returns آیا ناموفق است | Whether payment is failed
   */
  isFailedStatus(status: string): boolean {
    return status === PaymentStatuses.FAILED;
  }

  /**
   * ساخت پاسخ موفقیت برای وب‌هوک | Create success response for webhook
   *
   * سرور درگاه باید پاسخ `{ success: true }` با کد ۲۰۰ دریافت کند.
   * The gateway server expects `{ success: true }` with HTTP 200.
   *
   * @returns پاسخ موفقیت | Success response object
   *
   * @example
   * ```typescript
   * // در Express.js
   * res.json(webhook.createSuccessResponse());
   * ```
   */
  createSuccessResponse(): WebhookSuccessResponse {
    return { success: true };
  }
}

// ============================================================================
// Exports
// ============================================================================

/**
 * فرمت ورژن SDK | SDK version string
 */
export const VERSION = '1.0.0';

// Default export for convenience
export default ZarrinGold;
