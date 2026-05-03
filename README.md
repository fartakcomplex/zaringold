# زرین گلد (ZarrinGold) - Django + React

<p align="center">
  <strong>پلتفرم معاملات طلای نوین ایران</strong><br>
  <em>Iran's Modern Gold Trading Platform</em>
</p>

---

## 🏗️ معماری پروژه / Architecture

| لایه | تکنولوژی |
|------|----------|
| **بک‌اند** | Django 6 + Django REST Framework |
| **فرانت‌اند** | React 19 + Vite + TypeScript |
| **دیتابیس** | PostgreSQL (تولید) / SQLite (توسعه) |
| **Realtime** | Django Channels + WebSocket |
| **احراز هویت** | OTP + رمز عبور + Token Session |

## 📁 ساختار پروژه / Project Structure

```
django-backend/
├── zarringold/          # تنظیمات اصلی Django
├── authentication/     # احراز هویت، OTP، کاربران
├── gold/               # قیمت طلا، خرید و فروش
├── wallet/             # کیف پول، وام، پرداخت
├── gateway/            # درگاه پرداخت فروشندگان
├── gamification/       # گیمیفیکیشن، دستاوردها، VIP
├── social/             # هدیه، خانواده، فید اجتماعی
├── content/            # بلاگ، CMS، صفحه‌ساز
├── insurance/          # بیمه
├── services/           # خدمات خودرو، قبوض
├── admin_panel/        # پنل مدیریت
├── communications/     # اعلان‌ها، SMS، ایمیل، تلگرام
├── core/               # مدل‌های پایه، تنظیمات
└── frontend/           # React SPA
```

## 🚀 اجرای سریع / Quick Start

### توسعه (Development)
```bash
cd django-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser --phone 09120000000
python manage.py runserver
```

### تولید (Production) با Docker
```bash
cd django-backend
docker-compose up -d
```

## 🔑 کاربر پیش‌فرض / Default User

| فیلد | مقدار |
|------|-------|
| شماره تلفن | `09120000000` |
| رمز عبور | `Admin@123` |
| نقش | `super_admin` |

## 📡 API Endpoints

- `POST /api/auth/send-otp` — ارسال OTP
- `POST /api/auth/verify-otp` — تأیید OTP
- `POST /api/auth/password-login` — ورود با رمز
- `GET /api/gold/price` — قیمت لحظه‌ای طلا
- `POST /api/gold/buy` — خرید طلا
- `POST /api/gold/sell` — فروش طلا
- `GET /api/wallet/` — موجودی کیف پول
- `GET /api/health/` — بررسی سلامت سرور

**+300 endpoint دیگر**

## 🗄️ دیتابیس

### PostgreSQL (تولید)
متغیرهای محیطی:
```
POSTGRES_DB=zarringold
POSTGRES_USER=zarringold
POSTGRES_PASSWORD=your-secure-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### SQLite (توسعه)
بدون تنظیم اضافی، به صورت خودکار از SQLite استفاده می‌شود.

## 📄 مجوز / License

این پروژه متعلق به فراتک کمپلکس است.
