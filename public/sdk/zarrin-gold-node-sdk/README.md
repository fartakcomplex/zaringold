# زرین گلد — SDK رسمی Node.js
# Zarrin Gold — Official Node.js SDK

<div dir="rtl">

## 📦 نصب و راه‌اندازی | Installation

</div>

```bash
npm install zarrin-gold-sdk
```

<div dir="rtl">

## ⚡ شروع سریع | Quick Start

</div>

```typescript
import { ZarrinGold } from 'zarrin-gold-sdk';

const client = new ZarrinGold({
  apiKey: process.env.ZARRIN_GOLD_API_KEY!,
  apiSecret: process.env.ZARRIN_GOLD_API_SECRET!,
});
```

<div dir="rtl">

## 🛒 ایجاد پرداخت | Create Payment

</div>

```typescript
const result = await client.createPayment({
  amountFiat: 500000,               // مبلغ به ریال
  merchantOrderId: 'ORDER-123',     // شناسه سفارش شما
  callbackUrl: 'https://your-site.com/callback', // آدرس بازگشت
  description: 'خرید محصول',       // توضیحات (اختیاری)
});

// هدایت کاربر به صفحه پرداخت | Redirect user to payment page
console.log(result.payment.paymentUrl);
// → https://zarringold.com/pay/pay_abc123
```

**پاسخ نمونه | Example Response:**

```json
{
  "success": true,
  "payment": {
    "id": "pay_abc123",
    "paymentUrl": "https://zarringold.com/pay/pay_abc123",
    "amountGrams": 0.5,
    "status": "pending",
    "expiresAt": "2024-12-15T15:30:00Z"
  }
}
```

<div dir="rtl">

## ✅ بررسی وضعیت پرداخت | Verify Payment

</div>

```typescript
const result = await client.verifyPayment('pay_abc123');

if (result.payment.status === 'paid') {
  console.log('پرداخت موفق بود!');
  console.log('مبلغ:', result.payment.amountGrams, 'گرم');
}
```

<div dir="rtl">

## 📋 دریافت جزئیات پرداخت | Get Payment Detail

</div>

```typescript
const result = await client.getPaymentDetail('pay_abc123', 'user-token');
console.log(result.payment);
```

<div dir="rtl">

## ❌ لغو پرداخت | Cancel Payment

</div>

```typescript
const result = await client.cancelPayment('pay_abc123', 'user_42');
if (result.success) {
  console.log('پرداخت لغو شد');
}
```

<div dir="rtl">

## 🪝 مدیریت وب‌هوک | Webhook Handling

### مثال کامل Express.js | Complete Express.js Example

</div>

```typescript
import express from 'express';
import { ZarrinGold, ZarrinGoldWebhook } from 'zarrin-gold-sdk';

const app = express();
app.use(express.json());

const client = new ZarrinGold({
  apiKey: process.env.ZARRIN_GOLD_API_KEY!,
  apiSecret: process.env.ZARRIN_GOLD_API_SECRET!,
});

const webhook = new ZarrinGoldWebhook();

// ─────────────────────────────────────────────
// مرحله ۱: ساخت پرداخت
// Step 1: Create Payment
// ─────────────────────────────────────────────
app.post('/api/create-payment', async (req, res) => {
  try {
    const result = await client.createPayment({
      amountFiat: req.body.amount,
      merchantOrderId: req.body.orderId,
      callbackUrl: 'https://your-site.com/api/webhook',
      description: req.body.description,
    });

    // ذخیره شناسه پرداخت در دیتابیس
    // Save payment ID in database
    // await db.orders.update(req.body.orderId, { paymentId: result.payment.id });

    res.json({
      paymentUrl: result.payment.paymentUrl,
      paymentId: result.payment.id,
    });
  } catch (error) {
    console.error('Payment creation failed:', error);
    res.status(500).json({ error: 'خطا در ساخت پرداخت' });
  }
});

// ─────────────────────────────────────────────
// مرحله ۲: دریافت وب‌هوک
// Step 2: Receive Webhook
// ─────────────────────────────────────────────
app.post('/api/webhook', (req, res) => {
  try {
    // تجزیه و اعتبارسنجی بدنه وب‌هوک | Parse and validate webhook body
    const payload = webhook.parseWebhook(req.body);

    console.log(`🔔 Webhook received: ${payload.paymentId} → ${payload.status}`);

    if (webhook.isPaidStatus(payload.status)) {
      // ✅ پرداخت موفق — تایید سفارش
      // ✅ Payment successful — confirm order
      console.log(`💰 Paid: ${payload.amountGrams} grams = ${payload.amountFiat} fiat`);
      console.log(`📝 Order: ${payload.merchantOrderId}`);

      // TODO: تایید سفارش در دیتابیس
      // TODO: Confirm order in your database
      // await db.orders.markAsPaid(payload.merchantOrderId);
    } else if (webhook.isCancelledStatus(payload.status)) {
      // ❌ پرداخت لغو شد
      // ❌ Payment was cancelled
      console.log(`🚫 Cancelled: ${payload.merchantOrderId}`);
    } else if (webhook.isExpiredStatus(payload.status)) {
      // ⏰ پرداخت منقضی شد
      // ⏰ Payment expired
      console.log(`⏰ Expired: ${payload.merchantOrderId}`);
    }

    // مهم: حتماً پاسخ موفقیت ارسال کنید
    // Important: Always send success response
    res.json(webhook.createSuccessResponse());
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ success: false });
  }
});

// ─────────────────────────────────────────────
// مرحله ۳: بررسی وضعیت (بازگشت کاربر)
// Step 3: Check status (user return)
// ─────────────────────────────────────────────
app.get('/api/payment/:id/status', async (req, res) => {
  try {
    const result = await client.verifyPayment(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({ error: 'خطا در بررسی وضعیت' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});
```

<div dir="rtl">

## 📚 مستندات متدها | API Reference

</div>

### `new ZarrinGold(config)`

<div dir="rtl">

ساخت نمونه جدید کلاینت.

</div>

| پارامتر | نوع | اجباری | توضیحات |
|---|---|---|---|
| `apiKey` | `string` | ✅ | کلید API از پنل زرین گلد |
| `apiSecret` | `string` | ✅ | رمز API از پنل زرین گلد |
| `baseUrl` | `string` | ❌ | آدرس پایه (پیش‌فرض: `https://zarringold.com`) |
| `timeout` | `number` | ❌ | مهلت درخواست به میلی‌ثانیه (پیش‌فرض: `30000`) |

---

### `client.createPayment(params)`

<div dir="rtl">

ساخت یک پرداخت جدید و دریافت لینک پرداخت.

</div>

```typescript
interface CreatePaymentParams {
  amountGrams?: number;       // مبلغ به گرم طلا
  amountFiat?: number;        // مبلغ به ریال
  goldPrice?: number;         // قیمت لحظه‌ای طلا (اختیاری)
  merchantOrderId: string;    // شناسه سفارش شما (اجباری)
  callbackUrl: string;        // آدرس بازگشت (اجباری)
  description?: string;       // توضیحات (اختیاری)
}
```

**بازگشت | Returns:** `Promise<CreatePaymentResponse>`

```typescript
interface CreatePaymentResponse {
  success: boolean;
  payment: {
    id: string;            // شناسه پرداخت
    paymentUrl: string;    // لینک صفحه پرداخت
    amountGrams: number;   // مبلغ نهایی به گرم
    status: string;        // وضعیت
    expiresAt: string;     // زمان انقضا
  };
}
```

---

### `client.verifyPayment(paymentId)`

<div dir="rtl">

بررسی وضعیت پرداخت.

</div>

**پارامترها | Parameters:**
- `paymentId: string` — شناسه پرداخت

**بازگشت | Returns:** `Promise<VerifyPaymentResponse>`

```typescript
interface VerifyPaymentResponse {
  success: boolean;
  payment: {
    id: string;
    status: string;         // 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed'
    amountGrams: number;
    amountFiat: number;
    paidAt: string | null;
  };
}
```

---

### `client.getPaymentDetail(paymentId, userToken?)`

<div dir="rtl">

دریافت جزئیات کامل پرداخت.

</div>

**پارامترها | Parameters:**
- `paymentId: string` — شناسه پرداخت
- `userToken?: string` — توکن کاربر (اختیاری)

**بازگشت | Returns:** `Promise<PaymentDetailResponse>`

---

### `client.cancelPayment(paymentId, userId)`

<div dir="rtl">

لغو پرداخت فعال.

</div>

**پارامترها | Parameters:**
- `paymentId: string` — شناسه پرداخت
- `userId: string` — شناسه کاربر درخواست‌کننده

**بازگشت | Returns:** `Promise<CancelPaymentResponse>`

---

### `client.executePayment(paymentId, userId)`

<div dir="rtl">

اجرای پرداخت (سمت کاربر).

</div>

**پارامترها | Parameters:**
- `paymentId: string` — شناسه پرداخت
- `userId: string` — شناسه کاربر

**بازگشت | Returns:** `Promise<{ success: boolean; message?: string }>`

---

### `new ZarrinGoldWebhook()`

<div dir="rtl">

کلاس کمکی مدیریت وب‌هوک.

</div>

| متد | توضیحات |
|---|---|
| `parseWebhook(body)` | تجزیه و اعتبارسنجی بدنه وب‌هوک |
| `isPaidStatus(status)` | بررسی آیا وضعیت «پرداخت شده» است |
| `isCancelledStatus(status)` | بررسی آیا وضعیت «لغو شده» است |
| `isExpiredStatus(status)` | بررسی آیا وضعیت «منقضی شده» است |
| `isFailedStatus(status)` | بررسی آیا وضعیت «ناموفق» است |
| `createSuccessResponse()` | ساخت پاسخ `{ success: true }` |

<div dir="rtl">

## 🛡️ مدیریت خطا | Error Handling

</div>

```typescript
import { ZarrinGold, ZarrinGoldError } from 'zarrin-gold-sdk';

const client = new ZarrinGold({ apiKey: '...', apiSecret: '...' });

try {
  const result = await client.createPayment({
    amountFiat: 500000,
    merchantOrderId: 'ORDER-123',
    callbackUrl: 'https://your-site.com/callback',
  });
} catch (error) {
  if (error instanceof ZarrinGoldError) {
    console.error(`❌ Error [${error.statusCode}]: ${error.message}`);
    console.error('Details:', error.details);
    
    if (error.statusCode === 401) {
      console.log('کلید API نامعتبر است');
    } else if (error.statusCode === 404) {
      console.log('پرداخت یافت نشد');
    } else if (error.statusCode === 422) {
      console.log('پارامترهای ارسالی نامعتبر هستند');
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

<div dir="rtl">

## 🔄 وضعیت‌های پرداخت | Payment Statuses

</div>

| وضعیت | توضیحات |
|---|---|
| `pending` | در انتظار پرداخت |
| `paid` | پرداخت شده ✅ |
| `cancelled` | لغو شده ❌ |
| `expired` | منقضی شده ⏰ |
| `failed` | ناموفق 🔴 |

<div dir="rtl">

## 🔗 لینک‌های مفید | Useful Links

</div>

- [وب‌سایت زرین گلد](https://zarringold.com)
- [پنل مدیریت](https://zarringold.com/dashboard)
- [مستندات API](https://zarringold.com/docs)

<div dir="rtl">

## 📄 مجوز | License

MIT © [Zarrin Gold](https://zarringold.com)
