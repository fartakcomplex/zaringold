# Zarrin Gold Python SDK / SDK پایتون زرین گلد

<p align="center">
  <strong>SDK رسمی پایتون برای درگاه پرداخت طلای زرین گلد</strong><br>
  <em>Official Python SDK for the Zarrin Gold Payment Gateway</em>
</p>

---

## 📦 نصب / Installation

```bash
pip install zarrin-gold-sdk
```

یا مستقیم از مخزن / Or install directly from source:

```bash
pip install git+https://github.com/zarringold/python-sdk.git
```

---

## 🚀 شروع سریع / Quick Start

### مقداردهی اولیه / Initialization

```python
from zarringold import ZarrinGold

client = ZarrinGold(
    api_key="your_api_key_here",
    api_secret="your_api_secret_here",
    # base_url="https://zarringold.com",  # default / پیش‌فرض
    # timeout=30,                           # default / پیش‌فرض
)
```

### ایجاد پرداخت / Create Payment

```python
# ایجاد پرداخت با مبلغ ریالی
result = client.create_payment(
    merchant_order_id="ORDER-001",
    callback_url="https://example.com/webhook/zarrin",
    amount_fiat=500_000,        # مبلغ به ریال / Amount in Rials
    description="خرید محصول",  # توضیح اختیاری / Optional description
)

# دریافت لینک پرداخت برای هدایت کاربر
payment_url = result["payment"]["paymentUrl"]
payment_id = result["payment"]["id"]

print(f"Payment URL: {payment_url}")
print(f"Payment ID: {payment_id}")

# ایجاد پرداخت با مبلغ گرمی
result = client.create_payment(
    merchant_order_id="ORDER-002",
    callback_url="https://example.com/webhook/zarrin",
    amount_grams=0.5,            # مبلغ به گرم / Amount in grams
    gold_price=10_000_000,       # قیمت دلخواه هر گرم / Custom price per gram
)
```

### بررسی وضعیت پرداخت / Verify Payment

```python
result = client.verify_payment("pay_abc123")

status = result["payment"]["status"]
print(f"Payment status: {status}")

if status == "paid":
    print("✅ Payment confirmed! / پرداخت تأیید شد!")
    print(f"Amount: {result['payment']['amountGrams']} grams")
    print(f"Paid at: {result['payment']['paidAt']}")
```

### جزئیات پرداخت / Payment Details

```python
# با توکن کاربر / With user token
detail = client.get_payment_detail(
    payment_id="pay_abc123",
    user_token="user_jwt_token",
)

# بدون توکن / Without token (uses API key)
detail = client.get_payment_detail(payment_id="pay_abc123")
```

### لغو پرداخت / Cancel Payment

```python
result = client.cancel_payment(
    payment_id="pay_abc123",
    user_id="user_42",
)
print(f"Cancelled: {result['payment']['status']}")
```

### اجرای پرداخت / Execute Payment

```python
result = client.execute_payment(
    payment_id="pay_abc123",
    user_id="user_42",
)
```

---

## 🪝 وب‌هوک / Webhooks

### مثال Flask / Flask Example

```python
from flask import Flask, request, jsonify
from zarringold import ZarrinGold, WebhookHandler

app = Flask(__name__)
client = ZarrinGold(api_key="key", api_secret="secret")
handler = WebhookHandler()

@app.route("/webhook/zarrin", methods=["POST"])
def zarrin_webhook():
    # Parse & validate webhook payload / تجزیه و اعتبارسنجی بار وب‌هوک
    payload = handler.parse_webhook(request.get_json())

    print(f"Payment: {payload.payment_id}")
    print(f"Order: {payload.merchant_order_id}")
    print(f"Status: {payload.status}")
    print(f"Amount: {payload.amount_grams}g / {payload.amount_fiat} IRR")

    if handler.is_paid(payload.status):
        # پرداخت موفق — تکمیل سفارش
        print("✅ Order paid! Fulfilling...")
        # fulfill_order(payload.merchant_order_id)

    elif handler.is_failed(payload.status):
        # پرداخت ناموفق — اطلاع‌رسانی به کاربر
        print("❌ Payment failed!")
        # notify_user_failure(payload.merchant_order_id)

    # تأیید دریافت وب‌هوک
    return jsonify(handler.create_success_response()), 200


# Verify payment server-side after webhook
@app.route("/verify/<payment_id>", methods=["GET"])
def verify(payment_id):
    result = client.verify_payment(payment_id)
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5000)
```

### مثال Django / Django Example

```python
# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from zarringold import ZarrinGold, WebhookHandler

client = ZarrinGold(api_key="key", api_secret="secret")
handler = WebhookHandler()

@csrf_exempt
@require_POST
def zarrin_webhook(request):
    """Handle Zarrin Gold webhook notifications."""
    data = json.loads(request.body)

    # Parse and validate / تجزیه و اعتبارسنجی
    payload = handler.parse_webhook(data)

    if handler.is_paid(payload.status):
        # تأیید سرور-به-سرور / Server-side verification
        verification = client.verify_payment(payload.payment_id)
        if verification["payment"]["status"] == "paid":
            # Fulfill order / تکمیل سفارش
            print(f"Order {payload.merchant_order_id} verified and paid!")

    elif handler.is_failed(payload.status):
        print(f"Order {payload.merchant_order_id} failed: {payload.status}")

    elif handler.is_pending(payload.status):
        print(f"Order {payload.merchant_order_id} still pending...")

    return JsonResponse(handler.create_success_response(), status=200)
```

### مثال FastAPI / FastAPI Example

```python
from fastapi import FastAPI, Request
from zarringold import ZarrinGold, WebhookHandler

app = FastAPI()
client = ZarrinGold(api_key="key", api_secret="secret")
handler = WebhookHandler()

@app.post("/webhook/zarrin")
async def zarrin_webhook(request: Request):
    """Handle Zarrin Gold webhook notifications."""
    payload_data = await request.json()
    payload = handler.parse_webhook(payload_data)

    if handler.is_paid(payload.status):
        print(f"✅ Paid: {payload.merchant_order_id}")
    elif handler.is_failed(payload.status):
        print(f"❌ Failed: {payload.merchant_order_id}")

    return handler.create_success_response()
```

---

## 📋 متدهای SDK / SDK Methods

### `ZarrinGold` Client

| متد / Method | توضیحات / Description |
|---|---|
| `create_payment(...)` | ایجاد پرداخت جدید / Create a new payment |
| `verify_payment(payment_id)` | بررسی وضعیت پرداخت / Check payment status |
| `get_payment_detail(payment_id, user_token?)` | دریافت جزئیات پرداخت / Get payment details |
| `cancel_payment(payment_id, user_id)` | لغو پرداخت / Cancel a payment |
| `execute_payment(payment_id, user_id)` | اجرای پرداخت / Execute a payment |

### امضاهای متدها / Method Signatures

```python
client.create_payment(
    merchant_order_id: str,          # required / الزامی
    callback_url: str,                # required / الزامی
    amount_grams: float = None,       # optional / اختیاری
    amount_fiat: int = None,          # optional / اختیاری
    gold_price: int = None,           # optional / اختیاری
    description: str = None,          # optional / اختیاری
) -> dict

client.verify_payment(
    payment_id: str,                  # required / الزامی
) -> dict

client.get_payment_detail(
    payment_id: str,                  # required / الزامی
    user_token: str = None,           # optional / اختیاری
) -> dict

client.cancel_payment(
    payment_id: str,                  # required / الزامی
    user_id: str,                     # required / الزامی
) -> dict

client.execute_payment(
    payment_id: str,                  # required / الزامی
    user_id: str,                     # required / الزامی
) -> dict
```

### `WebhookHandler`

| متد / Method | توضیحات / Description |
|---|---|
| `parse_webhook(payload)` | تجزیه و اعتبارسنجی بار وب‌هوک / Parse and validate webhook |
| `create_success_response()` | ایجاد پاسخ تأیید / Create success response |
| `is_paid(status)` | بررسی وضعیت پرداخت موفق / Check if paid |
| `is_failed(status)` | بررسی وضعیت ناموفق / Check if failed |
| `is_pending(status)` | بررسی وضعیت معلق / Check if pending |

---

## ⚠️ مدیریت خطا / Error Handling

```python
from zarringold import (
    ZarrinGold,
    ZarrinGoldError,
    AuthenticationError,
    PaymentError,
    WebhookError,
    NetworkError,
    ValidationError,
)

client = ZarrinGold(api_key="key", api_secret="secret")

try:
    result = client.create_payment(
        merchant_order_id="ORDER-001",
        callback_url="https://example.com/webhook",
        amount_fiat=500_000,
    )
except ValidationError as e:
    print(f"Validation error / خطای اعتبارسنجی: {e}")
    print(f"Field / فیلد: {e.field}")

except AuthenticationError as e:
    print(f"Auth failed / احراز هویت ناموفق: {e}")
    print(f"HTTP Status: {e.status_code}")

except PaymentError as e:
    print(f"Payment error / خطای پرداخت: {e}")
    print(f"Payment ID: {e.payment_id}")

except NetworkError as e:
    print(f"Network error / خطای شبکه: {e}")

except ZarrinGoldError as e:
    # Catch-all for any SDK error / گرفتن تمام خطاهای SDK
    print(f"SDK error / خطای SDK: {e}")
```

### سلسله‌مراتب استثناها / Exception Hierarchy

```
ZarrinGoldError          ← Base exception / استثنای پایه
├── AuthenticationError  ← Invalid credentials / اعتبارنامه نامعتبر
├── PaymentError         ← Payment operation failed / عملیات پرداخت ناموفق
├── WebhookError         ← Webhook processing failed / پردازش وب‌هوک ناموفق
├── NetworkError         ← Network failure / خطای شبکه
└── ValidationError      ← Invalid input parameters / پارامترهای ورودی نامعتبر
```

---

## 🔗 نقاط پایانی API / API Endpoints

| روش / Method | مسیر / Path | توضیحات / Description |
|---|---|---|
| `POST` | `/api/gateway/pay/create` | ایجاد پرداخت / Create payment |
| `GET` | `/api/gateway/pay/:id/status` | وضعیت پرداخت / Payment status |
| `POST` | `/api/gateway/pay/:id/execute` | اجرای پرداخت / Execute payment |
| `POST` | `/api/gateway/pay/:id/cancel` | لغو پرداخت / Cancel payment |
| `GET` | `/api/gateway/pay/:id/detail` | جزئیات پرداخت / Payment details |

### احراز هویت / Authentication

- **کلید API** از طریق هدر `X-API-Key` ارسال می‌شود
- **رمز API** در بدنه درخواست (POST) یا query string (GET) ارسال می‌شود

### وضعیت‌های پرداخت / Payment Statuses

| وضعیت / Status | توضیحات / Description |
|---|---|
| `pending` | پرداخت ایجاد شده، منتظر اقدام کاربر / Payment created, awaiting user |
| `processing` | در حال پردازش / Being processed |
| `paid` | پرداخت موفق / Payment successful |
| `failed` | پرداخت ناموفق / Payment failed |
| `expired` | منقضی شده / Expired |
| `cancelled` | لغو شده / Cancelled |

---

## 🔧 Context Manager / مدیریت منابع

```python
# استفاده از Context Manager برای بستن خودکار نشست
with ZarrinGold(api_key="key", api_secret="secret") as client:
    result = client.create_payment(
        merchant_order_id="ORDER-001",
        callback_url="https://example.com/webhook",
        amount_fiat=500_000,
    )
# نشست HTTP به صورت خودکار بسته می‌شود

# یا به صورت دستی / Or manually
client = ZarrinGold(api_key="key", api_secret="secret")
try:
    client.create_payment(...)
finally:
    client.close()
```

---

## 📜 ساختار پکیج / Package Structure

```
zarrin-gold-python-sdk/
├── zarringold/
│   ├── __init__.py          # Package exports / خروجی‌های پکیج
│   ├── client.py            # Main SDK client / کلاینت اصلی SDK
│   ├── exceptions.py        # Custom exceptions / استثناهای سفارشی
│   ├── models.py            # Data classes / کلاس‌های داده
│   └── webhook.py           # Webhook handler / مدیر وب‌هوک
├── setup.py                 # Package setup / تنظیمات پکیج
├── pyproject.toml           # Modern packaging / بسته‌بندی مدرن
└── README.md                # Documentation / مستندات
```

---

## 🛡️ بهترین شیوه‌ها / Best Practices

1. **تأیید سرور-به-سرور** — همیشه پس از دریافت وب‌هوک، وضعیت پرداخت را با `verify_payment()` تأیید کنید
2. **مدیریت خطا** — تمام استثناها را به درستی مدیریت کنید و لاگ بگیرید
3. **بستن نشست** — از Context Manager استفاده کنید یا `client.close()` را فراخوانی کنید
4. **اعتبارسنجی ورودی** — پارامترها را قبل از ارسال اعتبارسنجی کنید
5. **وب‌هوک امن** — وب‌هوک خود را با CSRF protection و IP filtering محافظت کنید

---

## 📄 مجوز / License

MIT License — برای اطلاعات بیشتر فایل LICENSE را مطالعه کنید.
