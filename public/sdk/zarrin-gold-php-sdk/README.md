# Zarrin Gold PHP SDK / PHP SDK زرین گلد

<div align="center">

**کیت توسعه نرم‌افزار PHP برای درگاه پرداخت زرین گلد**

A comprehensive, production-ready PHP SDK for integrating with the [Zarrin Gold](https://zarringold.com) gold-backed payment gateway.

</div>

---

## 📋 فهرست مطالب / Table of Contents

- [نصب و راه‌اندازی / Installation](#-نصب-و-راه‌اندازی--installation)
- [شروع سریع / Quick Start](#-شروع-سریع--quick-start)
- [متدها / Methods Reference](#-متدها--methods-reference)
  - [ایجاد پرداخت / Create Payment](#1-ایجاد-پرداخت--create-payment)
  - [بررسی وضعیت پرداخت / Verify Payment](#2-بررسی-وضعیت-پرداخت--verify-payment)
  - [جزئیات پرداخت / Payment Details](#3-جزئیات-پرداخت--payment-details)
  - [لغو پرداخت / Cancel Payment](#4-لغو-پرداخت--cancel-payment)
  - [اجرای پرداخت / Execute Payment](#5-اجرای-پرداخت--execute-payment)
  - [وب‌هوک / Webhook Handling](#6-وب‌هوک--webhook-handling)
- [ثبت رویداد / Logging](#-ثبت-رویداد--logging)
- [مدیریت خطا / Error Handling](#-مدیریت-خطا--error-handling)
- [ثابت‌ها / Constants](#-ثابت‌ها--constants)
- [پیکربندی / Configuration](#-پیکربندی--configuration)
- [نیازمندی‌ها / Requirements](#-نیازمندی‌ها--requirements)
- [مجوز / License](#-مجوز--license)

---

## 🚀 نصب و راه‌اندازی / Installation

### روش ۱: استفاده از Composer (توصیه شده) / Method 1: Composer (Recommended)

```bash
composer require zarrin-gold/sdk
```

### روش ۲: دانلود مستقیم / Method 2: Direct Download

فایل `ZarrinGold.php` را دانلود و در پروژه خود قرار دهید:

```php
require_once __DIR__ . '/path/to/ZarrinGold.php';
```

### روش ۳: Clone از مخزن / Method 3: Clone Repository

```bash
git clone https://github.com/zarrin-gold/php-sdk.git
cd php-sdk
composer install
```

---

## ⚡ شروع سریع / Quick Start

```php
<?php

require_once __DIR__ . '/ZarrinGold.php';

use ZarrinGold;

// ۱. ایجاد نمونه SDK / Create SDK instance
$sdk = new ZarrinGold(
    'your_api_key_here',       // کلید API شما / Your API key
    'your_api_secret_here',    // رمز API شما / Your API secret
    'https://zarringold.com'   // URL پایه (اختیاری) / Base URL (optional)
);

// ۲. ایجاد یک پرداخت / Create a payment
try {
    $payment = $sdk->createPayment([
        'amountFiat'      => 5_000_000,           // مبلغ به تومان / Amount in Tomans
        'merchantOrderId' => 'ORDER-' . time(),    // شناسه سفارش شما / Your order ID
        'callbackUrl'     => 'https://yoursite.com/callback.php',  // URL بازفراخوانی
        'description'     => 'خرید محصول از فروشگاه',  // توضیحات (اختیاری)
    ]);

    // ۳. هدایت کاربر به صفحه پرداخت / Redirect user to payment page
    header('Location: ' . $payment['payment']['paymentUrl']);
    exit;

} catch (ZarrinGoldException $e) {
    // مدیریت خطا / Handle error
    echo "خطا در ایجاد پرداخت: " . $e->getMessage();
    // echo "Error creating payment: " . $e->getMessage();
}
```

---

## 📖 متدها / Methods Reference

### ۱. ایجاد پرداخت / Create Payment

> ایجاد یک درخواست پرداخت جدید در درگاه زرین گلد.
> Create a new payment request on the Zarrin Gold gateway.

```php
public function createPayment(array $params): array
```

**پارامترها / Parameters:**

| پارامتر / Parameter | نوع / Type | الزامی / Required | توضیحات / Description |
|---|---|---|---|
| `amountGrams` | `float` | یکی از این دو / Either | مقدار به گرم / Amount in grams |
| `amountFiat` | `float\|int` | یکی از این دو / Either | مقدار به تومان / Amount in fiat |
| `goldPrice` | `float\|int` | خیر / No | قیمت طلای لحظه‌ای / Current gold price |
| `merchantOrderId` | `string` | **بله / Yes** | شناسه سفارش شما / Your order ID |
| `callbackUrl` | `string` | **بله / Yes** | URL بازفراخوانی / Callback URL |
| `description` | `string` | خیر / No | توضیحات پرداخت / Payment description |

**مثال / Example:**

```php
$result = $sdk->createPayment([
    'amountGrams'     => 0.5,
    'merchantOrderId' => 'ORD-2024-001',
    'callbackUrl'     => 'https://example.com/callback',
    'description'     => 'خرید طلا - سفارش 001',
]);

echo $result['payment']['id'];          // pay_xxxxxxxxx
echo $result['payment']['paymentUrl'];   // https://zarringold.com/pay/...
echo $result['payment']['amountGrams']; // 0.5
echo $result['payment']['status'];      // pending
echo $result['payment']['expiresAt'];   // 2024-12-15T15:30:00Z
```

---

### ۲. بررسی وضعیت پرداخت / Verify Payment

> بررسی وضعیت فعلی یک پرداخت.
> Check the current status of a payment.

```php
public function verifyPayment(string $paymentId): array
```

**مثال / Example:**

```php
$status = $sdk->verifyPayment('pay_abc123');

switch ($status['payment']['status']) {
    case ZarrinGold::STATUS_PAID:
        echo "پرداخت با موفقیت انجام شد! ✅";
        echo "Amount: " . $status['payment']['amountGrams'] . " grams";
        echo "Paid at: " . $status['payment']['paidAt'];
        break;
        
    case ZarrinGold::STATUS_PENDING:
        echo "پرداخت در انتظار تأیید ⏳";
        break;
        
    case ZarrinGold::STATUS_CANCELED:
        echo "پرداخت لغو شده ❌";
        break;
        
    case ZarrinGold::STATUS_EXPIRED:
        echo "پرداخت منقضی شده ⌛";
        break;
}
```

---

### ۳. جزئیات پرداخت / Payment Details

> دریافت اطلاعات کامل یک پرداخت.
> Get full details of a payment.

```php
public function getPaymentDetail(string $paymentId, string $userToken = null): array
```

**مثال / Example:**

```php
// بدون توکن کاربر / Without user token
$detail = $sdk->getPaymentDetail('pay_abc123');

// با توکن کاربر / With user token (for user-scoped access)
$detail = $sdk->getPaymentDetail('pay_abc123', 'user_bearer_token_here');

print_r($detail);
```

---

### ۴. لغو پرداخت / Cancel Payment

> لغو یک پرداخت معلق.
> Cancel a pending payment.

```php
public function cancelPayment(string $paymentId, string $userId): array
```

**مثال / Example:**

```php
try {
    $result = $sdk->cancelPayment('pay_abc123', 'user_456');
    echo "پرداخت با موفقیت لغو شد ✅";
} catch (ZarrinGoldException $e) {
    echo "خطا در لغو پرداخت: " . $e->getMessage();
}
```

---

### ۵. اجرای پرداخت / Execute Payment

> اجرا و تأیید پرداخت توسط کاربر.
> Execute and confirm payment by user.

```php
public function executePayment(string $paymentId, string $userId): array
```

**مثال / Example:**

```php
try {
    $result = $sdk->executePayment('pay_abc123', 'user_456');
    echo "پرداخت با موفقیت انجام شد ✅";
} catch (ZarrinGoldException $e) {
    echo "خطا در اجرای پرداخت: " . $e->getMessage();
}
```

---

### ۶. وب‌هوک / Webhook Handling

> مدیریت اعلان‌های وب‌هوک از درگاه.
> Handle webhook notifications from the gateway.

پس از انجام پرداخت، درگاه زرین گلد یک POST به URL بازفراخوانی شما ارسال می‌کند.

After a payment is completed, Zarrin Gold sends a POST to your callback URL.

**ساختار وب‌هوک / Webhook Payload:**

```json
{
    "paymentId": "pay_abc123",
    "merchantOrderId": "ORDER-123",
    "status": "paid",
    "amountGrams": 0.5,
    "amountFiat": 500000,
    "paidAt": "2024-12-15T14:30:00Z"
}
```

**نمونه مدیریت وب‌هوک / Webhook Handler Example:**

```php
<?php
// callback.php / فایل بازفراخوانی

require_once __DIR__ . '/ZarrinGold.php';

$sdk = new ZarrinGold('your_api_key', 'your_api_secret');

try {
    // ۱. خواندن محموله خام / Read the raw payload
    $payload = file_get_contents('php://input');
    
    // ۲. بررسی هدر امضا (اختیاری) / Check signature header (optional)
    $signature = $_SERVER['HTTP_X_ZARRIN_SIGNATURE'] ?? null;
    
    // ۳. تأیید و تجزیه وب‌هوک / Verify and parse webhook
    $data = $sdk->verifyWebhook($payload, $signature);
    
    // ۴. بررسی وضعیت پرداخت / Check payment status
    if ($data['status'] === 'paid') {
        $paymentId       = $data['paymentId'];
        $merchantOrderId = $data['merchantOrderId'];
        $amountGrams     = $data['amountGrams'];
        $amountFiat      = $data['amountFiat'];
        
        // ✅ در اینجا سفارش خود را در دیتابیس تأیید کنید
        // ✅ Here, confirm the order in your database
        // updateOrderStatus($merchantOrderId, 'paid');
        
        // ۵. پاسخ تأیید به درگاه / Acknowledge to the gateway
        $sdk->respondToWebhook();
    } else {
        // وضعیت‌های دیگر (لغو، منقضی، ...) 
        // Other statuses (canceled, expired, ...)
        $sdk->respondToWebhook();
    }
    
} catch (ZarrinGoldException $e) {
    // ثبت خطا / Log the error
    error_log("Webhook Error: " . $e->getMessage());
    
    // همچنان پاسخ 200 بدهید تا درگاه دوباره تلاش نکند
    // Still respond with 200 so the gateway doesn't retry
    $sdk->respondToWebhook();
}
```

---

## 📝 ثبت رویداد / Logging

> SDK قابلیت ثبت رویداد درخواست/پاسخ را برای اهداف اشکال‌زدایی دارد.
> The SDK has request/response logging capability for debugging purposes.

```php
<?php

$sdk = new ZarrinGold('api_key', 'api_secret');

// فعال‌سازی ثبت رویداد / Enable logging
$sdk->enableLogging();

try {
    $payment = $sdk->createPayment([...]);
    
    // دریافت آخرین ورودی ثبت شده / Get last log entry
    $lastLog = $sdk->getLastLogEntry();
    print_r($lastLog);
    /*
    Array (
        [type] => post
        [url] => https://zarringold.com/api/gateway/pay/create
        [method] => POST
        [data] => Array ( [apiSecret] => *** [...] )
        [response] => {"success":true,"payment":{...}}
        [statusCode] => 200
        [timestamp] => 2024-12-15T14:30:00Z
    )
    */
    
    // دریافت تمام رویدادها / Get all log entries
    $allLogs = $sdk->getLog();
    
} finally {
    // پاک‌سازی رویدادها / Clear logs
    $sdk->clearLog();
}
```

---

## ⚠️ مدیریت خطا / Error Handling

> تمام خطاها از نوع `ZarrinGoldException` هستند.
> All errors are of type `ZarrinGoldException`.

```php
<?php

try {
    $result = $sdk->createPayment([
        'amountFiat'      => 500000,
        'merchantOrderId' => 'ORD-001',
        'callbackUrl'     => 'https://example.com/callback',
    ]);
    
} catch (ZarrinGoldException $e) {
    // پیام خطا / Error message
    echo $e->getMessage();
    
    // کد خطای HTTP / HTTP error code
    echo $e->getStatusCode();
    
    // بدنه خام پاسخ API / Raw API response body
    echo $e->getResponseBody();
    
    // کد خطای داخلی / Internal error code
    echo $e->getCode();
    
    // ثبت در لاگ / Log the error
    error_log(sprintf(
        'ZarrinGold Error [%d]: %s | Response: %s',
        $e->getStatusCode(),
        $e->getMessage(),
        $e->getResponseBody()
    ));
}
```

**انواع خطاهای رایج / Common Error Types:**

| خطا / Error | علت / Cause |
|---|---|
| API key cannot be empty | کلید API خالی است |
| Parameter "merchantOrderId" is required | شناسه سفارش الزامی است |
| cURL error (28): Operation timed out | مهلت زمانی درخواست تمام شد |
| HTTP request failed with status 401 | احراز هویت ناموفق |
| HTTP request failed with status 404 | نقطه پایانی یافت نشد |
| Webhook signature verification failed | امضای وب‌هوک معتبر نیست |
| Failed to decode JSON response | پاسخ API نامعتبر است |

---

## 📌 ثابت‌ها / Constants

| ثابت / Constant | مقدار / Value | توضیحات / Description |
|---|---|---|
| `ZarrinGold::VERSION` | `1.0.0` | نسخه SDK / SDK version |
| `ZarrinGold::DEFAULT_BASE_URL` | `https://zarringold.com` | URL پایه پیش‌فرض / Default base URL |
| `ZarrinGold::DEFAULT_TIMEOUT` | `30` | مهلت زمانی پیش‌فرض (ثانیه) / Default timeout (seconds) |
| `ZarrinGold::STATUS_PENDING` | `pending` | در انتظار / Pending |
| `ZarrinGold::STATUS_PAID` | `paid` | پرداخت شده / Paid |
| `ZarrinGold::STATUS_CANCELED` | `canceled` | لغو شده / Canceled |
| `ZarrinGold::STATUS_EXPIRED` | `expired` | منقضی شده / Expired |
| `ZarrinGold::STATUS_FAILED` | `failed` | ناموفق / Failed |

---

## ⚙️ پیکربندی / Configuration

```php
<?php

$sdk = new ZarrinGold(
    $apiKey,                              // کلید API
    $apiSecret,                           // رمز API
    $baseUrl,                             // URL پایه (اختیاری)
    30,                                   // مهلت زمانی درخواست بر حسب ثانیه
    10                                    // مهلت زمانی اتصال بر حسب ثانیه
);

// تنظیم مهلت زمانی / Set timeout
$sdk->setTimeout(45);

// تنظیم مهلت اتصال / Set connection timeout
$sdk->setConnectTimeout(15);

// دریافت مقادیر / Get values
$baseUrl = $sdk->getBaseUrl();
$timeout = $sdk->getTimeout();

// فعال‌سازی ثبت رویداد / Enable logging
$sdk->enableLogging();
$isEnabled = $sdk->isLoggingEnabled(); // true
$sdk->disableLogging();
```

---

## 📦 نیازمندی‌ها / Requirements

| نیازمندی / Requirement | نسخه / Version |
|---|---|
| PHP | `^7.4` یا `^8.0` |
| پسوند cURL | باید فعال باشد / Must be enabled |
| پسوند JSON | باید فعال باشد / Must be enabled |

---

## 📄 مجوز / License

این پروژه تحت مجوز [MIT](https://opensource.org/licenses/MIT) منتشر شده است.

This project is released under the [MIT License](https://opensource.org/licenses/MIT).

---

## 📞 پشتیبانی / Support

- **وب‌سایت / Website**: [https://zarringold.com](https://zarringold.com)
- **ایمیل / Email**: support@zarringold.com
- **مستندات API / API Docs**: [https://zarringold.com/docs](https://zarringold.com/docs)
