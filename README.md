<div align="center">

# 🏆 زرین‌گلد | ZarinGold

### پلتفرم جامع خرید و فروش آنلاین طلا و کیف پول دیجیتال

**Comprehensive Digital Gold Trading & Wallet Platform**

[![Version](https://img.shields.io/badge/version-5.0.0-gold?style=for-the-badge&logo=semantic-release)](https://github.com/fartakcomplex/zaringold/releases/tag/v4.0.1)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)](./LICENSE)

<img src="zaringold-banner.png" alt="ZarinGold Banner" width="100%"/>

[English](#english-proposal) | [فارسی](#پروپوزال-فارسی)

</div>

---

# English Proposal

## 📋 Project Overview

**ZarinGold** is a full-stack fintech platform that enables users to buy, sell, and manage digital gold assets in real-time. Built with cutting-edge web technologies, it provides a comprehensive suite of financial services including digital wallets, gold-backed cards, loans, savings plans, and merchant payment solutions — all tailored for the Iranian market.

## 🎯 Problem Statement

The Iranian gold market faces several critical challenges:

| Challenge | Description |
|-----------|-------------|
| **Accessibility** | Traditional gold purchasing requires physical visits to dealers with high minimum investment thresholds |
| **Security** | Physical gold storage carries risks of theft and loss |
| **Transparency** | Lack of real-time pricing and market data for informed decision-making |
| **Liquidity** | Converting physical gold back to cash is slow and often involves significant spreads |
| **Fractional Ownership** | No easy way to invest small amounts in gold incrementally |
| **Financial Integration** | Gold assets are disconnected from digital payment ecosystems |

## 💡 Solution

ZarinGold addresses these challenges by providing a **digital-first gold trading platform** with:

- **Real-time gold trading** at market prices with instant settlement
- **Digital gold wallets** with fractional gram precision
- **Gold-backed payment cards** for everyday transactions
- **Smart savings plans** with auto-buy and round-up features
- **AI-powered financial advisor** for portfolio optimization
- **Comprehensive merchant tools** for business integration

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 | Server-side rendering, App Router |
| **UI Framework** | Tailwind CSS 4 + shadcn/ui | Responsive, accessible components |
| **Language** | TypeScript 5 | Type safety across the codebase |
| **Database** | Prisma ORM + SQLite | Data persistence and modeling |
| **State Management** | Zustand + TanStack Query | Client & server state management |
| **Real-time** | Socket.IO | Live price updates, notifications |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Charts** | Recharts + TanStack Table | Data visualization & analytics |
| **i18n** | next-intl | Bilingual support (FA/EN) |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Landing   │  │ Dashboard│  │ Admin     │             │
│  │ Page      │  │ Panel    │  │ Panel     │             │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘             │
│        └──────────────┼──────────────┘                  │
│                       ▼                                  │
│  ┌─────────────────────────────────────────┐            │
│  │         Next.js App Router (SSR/CSR)     │            │
│  └─────────────────┬───────────────────────┘            │
└────────────────────┼────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Auth   │ │ Gold   │ │ Wallet │ │Payment │  ...50+   │
│  │ API    │ │ API    │ │ API    │ │ API    │  APIs     │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘          │
│      └──────────┼──────────┼──────────┘                 │
│                 ▼                                        │
│  ┌─────────────────────────────────────────┐            │
│  │        Prisma ORM + SQLite               │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              External Integrations                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Gold Price│ │ Payment  │ │ SMS      │ │ Telegram  │  │
│  │ API      │ │ Gateway  │ │ Service  │ │ Bot       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

## ✨ Key Features

### 🪙 Core Trading
- **Buy & Sell Gold Instantly** — Real-time market prices with instant settlement
- **Gold Portfolio Management** — Track coins, melted gold, and modern gold assets
- **Advanced Charts** — Professional technical analysis with indicators
- **Price Alerts** — Custom notifications for price thresholds
- **Price Predictions** — Community-driven price prediction game

### 💳 Financial Services
- **Dual Wallet System** — Separate Rial and gold wallets
- **Gold-Backed Card** — Virtual card with EMV chip, NFC, and VISA branding
- **Gold Loans** — Borrow against digital gold collateral
- **Smart Savings** — Auto-buy plans and round-up features
- **Gold Transfer** — Send gold between users instantly
- **Family Wallet** — Shared gold savings for families

### 🏪 Merchant Solutions
- **Payment API** — RESTful API for merchant integration
- **QR Payments** — Scan-to-pay with dynamic QR codes
- **Invoice System** — Create and manage invoices
- **Settlement** — Automated merchant settlements
- **Risk Management** — Fraud detection and risk events

### 🤖 AI & Intelligence
- **AI Financial Advisor** — Portfolio analysis and buy/sell recommendations
- **Gold Scanner** — Market analysis tool
- **Gold Horoscope** — Fun daily gold market predictions
- **Voice Transcription** — Voice-to-text for accessibility

### 🎮 Engagement & Gamification
- **Daily Check-in** — Earn rewards for daily visits
- **Achievements** — Unlock badges and milestones
- **Level System** — Bronze → Silver → Gold → Diamond progression
- **Social Feed** — Community posts and interactions
- **Content Creator Club** — Create content and earn gold

### 🔧 Platform Features
- **Bilingual UI** — Full Persian (RTL) and English support
- **Dark/Light Theme** — Adaptive visual preferences
- **Responsive Design** — Mobile-first, works on all devices
- **Admin Panel** — Complete system management dashboard
- **CMS** — Dynamic content management for landing pages
- **Blog System** — Content marketing with categories and tags
- **Notification System** — In-app, SMS, email, and Telegram alerts

## 📊 Database Schema

The platform operates on **90+ database models** organized across these domains:

| Domain | Models | Description |
|--------|--------|-------------|
| **User Management** | User, Profile, KYC, OTP, Session, Role, Permission | Authentication, authorization, and identity |
| **Gold & Trading** | GoldPrice, GoldWallet, PriceHistory, PriceAlert, GoldReserve | Market data and trading operations |
| **Financial** | Wallet, Transaction, Payment, Invoice, Settlement | Payments and accounting |
| **Lending** | GoldLoan, LoanRepayment, LoanSetting | Gold-backed loans |
| **Card Services** | GoldCard, GoldCardTransaction | Virtual gold cards |
| **Savings** | SavingGoal, AutoBuyPlan | Smart savings automation |
| **Merchant** | Merchant, ApiKey, GatewayPayment, QrCode | Business integrations |
| **Social** | SocialPost, GiftTransfer, FamilyWallet | Community features |
| **Gamification** | UserGamification, Achievement, CheckIn, PricePrediction | Engagement mechanics |
| **Communication** | Notification, SmsConfig, EmailConfig, TelegramUser | Multi-channel messaging |
| **Support** | SupportTicket, TicketMessage, ChatFAQ, ChatOperator | Customer service |
| **Content** | BlogPost, CMSPage, LandingSection | Content management |
| **Insurance** | InsuranceProvider, InsurancePlan, InsuranceOrder | Gold insurance |
| **Auto Services** | UserCar, CarServiceCategory, CarServiceOrder | Vehicle services |
| **Security** | AuditLog, SecurityEvent, BlockedIP, RiskEvent | Platform security |

## 🔌 API Endpoints (50+ Modules)

```
/api/auth          — Authentication & OTP
/api/gold          — Gold trading & pricing
/api/wallet        — Rial wallet operations
/api/transactions  — Transaction history
/api/transfer      — Gold transfers
/api/payment       — Payment processing
/api/loans         — Gold loan management
/api/gold-card     — Virtual gold card
/api/goals         — Savings goals
/api/gamification  — Achievements & check-in
/api/creator       — Content creator tools
/api/merchant      — Merchant dashboard
/api/admin         — Admin panel operations
/api/analytics     — Platform analytics
/api/blog          — Blog management
/api/chat          — Customer support chat
/api/insurance     — Insurance services
/api/car-services  — Auto services
/api/utility       — Utility bill payments
/api/vip           — VIP subscription
/api/cashback      — Cashback rewards
/api/family-wallet — Family shared wallet
/api/social-feed   — Community posts
/api/predictions   — Price predictions
/api/gateway       — Payment gateway
/api/notifications — User notifications
/api/telegram      — Telegram bot integration
/api/sms           — SMS campaigns
/api/email         — Email campaigns
...and more
```

## 📁 Project Structure

```
zaringold/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # 50+ API modules
│   │   ├── checkout/           # Payment checkout
│   │   ├── page.tsx            # Landing page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── admin/              # Admin panel components
│   │   ├── ai/                 # AI advisor components
│   │   ├── analytics/          # Charts & analytics
│   │   ├── auth/               # Authentication UI
│   │   ├── card/               # Gold card components
│   │   ├── chat/               # Chat & support
│   │   ├── creator/            # Content creator tools
│   │   ├── dashboard/          # User dashboard
│   │   ├── gold/               # Gold trading UI
│   │   ├── goldcard/           # Gold card design
│   │   ├── landing/            # Landing page sections
│   │   ├── loan/               # Loan management
│   │   ├── market/             # Market data
│   │   ├── merchant/           # Merchant tools
│   │   ├── trading/            # Trading interface
│   │   ├── wallet/             # Wallet components
│   │   └── ui/                 # shadcn/ui base
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utilities & configs
├── prisma/
│   └── schema.prisma           # 90+ database models
├── mini-services/              # Microservices
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── skills/                     # AI skill modules
└── wordpress-plugin/           # WordPress integration
```

## 🗺️ Roadmap

### ✅ v4.0.x — Current (Stable)
- [x] Core gold trading engine
- [x] Dual wallet system (Rial + Gold)
- [x] Gold-backed virtual card
- [x] Merchant payment API
- [x] AI financial advisor
- [x] Gamification system
- [x] Mobile-responsive design
- [x] Bilingual support (FA/EN)

### 🔄 v4.1.x — Next Release
- [ ] Real bank integration (Iranian banking APIs)
- [ ] Advanced trading features (limit orders, stop-loss)
- [ ] Enhanced AI advisor with portfolio rebalancing
- [ ] Mobile app (React Native)
- [ ] Push notification service

### 📅 v5.0 — Future Vision
- [ ] Multi-asset support (silver, crypto)
- [ ] Social trading (copy trading)
- [ ] Decentralized identity verification
- [ ] Open banking integration
- [ ] International market access

## 📈 Market Opportunity

| Metric | Value |
|--------|-------|
| **Target Market** | Iran's 85M+ population |
| **Gold Market Size** | $10B+ annual gold trade in Iran |
| **Digital Adoption** | 70%+ smartphone penetration |
| **Fintech Growth** | 40%+ YoY in Iranian fintech |
| **Addressable Users** | 15M+ potential digital gold investors |

## 🔒 Security

- **Authentication** — OTP-based login with session management
- **Authorization** — Role-based access control (RBAC) with granular permissions
- **KYC** — Know Your Customer identity verification
- **Audit Logging** — Complete activity tracking
- **IP Blocking** — Automated suspicious activity detection
- **Data Encryption** — Secure storage of sensitive information
- **Risk Engine** — Real-time fraud detection

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/fartakcomplex/zaringold.git
cd zaringold

# Install dependencies
npm install

# Set up the database
npx prisma db push

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📊 Project Stats

| Stat | Value |
|------|-------|
| **Language** | TypeScript (78%), Python (10%), HTML/CSS (5%), Others (7%) |
| **Database Models** | 90+ |
| **API Modules** | 50+ |
| **UI Components** | 40+ component directories |
| **Releases** | 10+ versioned releases |

---

# پروپوزال فارسی

## 📋 معرفی پروژه

**زرین‌گلد** یک پلتفرم فین‌تک تمام‌عیار است که امکان خرید، فروش و مدیریت دارایی‌های طلای دیجیتال را به‌صورت لحظه‌ای فراهم می‌کند. این پلتفرم با استفاده از جدیدترین تکنولوژی‌های وب، مجموعه‌ای جامع از خدمات مالی شامل کیف پول دیجیتال، کارت پشتوانه‌دار طلا، وام، طرح‌های پس‌انداز و راهکارهای پرداخت فروشندگان را ارائه می‌دهد.

## 🎯 بیان مسئله

بازار طلای ایران با چالش‌های اساسی زیر مواجه است:

| چالش | توضیحات |
|------|---------|
| **دسترسی‌پذیری** | خرید طلای سنتی نیازمند مراجعه حضوری با حداقل سرمایه بالا |
| **امنیت** | خطر سرقت و مفقود شدن طلای فیزیکی |
| **شفافیت** | عدم دسترسی به قیمت‌گذاری لحظه‌ای و داده‌های بازار |
| **نقدشوندگی** | تبدیل طلای فیزیکی به نقد زمان‌بر و با حاشیه سود پایین |
| **مالکیت جزئی** | عدم امکان سرمایه‌گذاری تدریجی و خرد در طلا |
| **یکپارچگی مالی** | جدا بودن دارایی طلایی از اکوسیستم پرداخت دیجیتال |

## 💡 راه‌حل پیشنهادی

زرین‌گلد با ارائه **پلتفرم دیجیتال معاملات طلا** این چالش‌ها را حل می‌کند:

- **معاملات لحظه‌ای طلا** با قیمت بازار و تسویه آنی
- **کیف پول دیجیتال طلا** با دقت کسر گرمی
- **کارت پرداخت پشتوانه‌دار طلا** برای تراکنش‌های روزانه
- **پس‌انداز هوشمند** با خرید خودکار و راندآپ
- **مشاور مالی هوش مصنوعی** برای بهینه‌سازی پرتفوی
- **ابزارهای جامع فروشندگان** برای یکپارچه‌سازی کسب‌وکار

## 🏗️ معماری سیستم

### تکنولوژی‌های استفاده‌شده

| لایه | تکنولوژی | کاربرد |
|------|----------|--------|
| **فرانت‌اند** | Next.js 16 + React 19 | رندر سمت سرور، App Router |
| **رابط کاربری** | Tailwind CSS 4 + shadcn/ui | کامپوننت‌های ریسپانسیو و دسترس‌پذیر |
| **زبان** | TypeScript 5 | ایمنی نوع در تمام کدبیس |
| **پایگاه داده** | Prisma ORM + SQLite | ماندگاری و مدل‌سازی داده |
| **مدیریت وضعیت** | Zustand + TanStack Query | مدیریت وضعیت کلاینت و سرور |
| **زمان واقعی** | Socket.IO | به‌روزرسانی لحظه‌ای قیمت‌ها |
| **انیمیشن** | Framer Motion | ترنزیشن‌های نرم UI |
| **نمودار** | Recharts + TanStack Table | تجسم داده و تحلیل |
| **چندزبانگی** | next-intl | پشتیبانی دوزبانه (فارسی/انگلیسی) |

## ✨ ویژگی‌های کلیدی

### 🪙 معاملات اصلی
- **خرید و فروش آنی طلا** — قیمت‌های لحظه‌ای بازار با تسویه فوری
- **مدیریت پرتفوی طلا** — ردیابی سکه، طلای آبشده و طلای نوین
- **نمودار پیشرفته** — تحلیل تکنیکال حرفه‌ای با اندیکاتورها
- **هشدار قیمت** — اعلان‌های سفارشی برای آستانه‌های قیمتی

### 💳 خدمات مالی
- **سیستم کیف پول دوگانه** — کیف پول ریالی و طلایی مجزا
- **کارت طلایی** — کارت مجازی با تراشه EMV، NFC و لوگوی VISA
- **وام طلایی** — دریافت وام با وثیقه طلای دیجیتال
- **پس‌انداز هوشمند** — طرح‌های خرید خودکار و راندآپ
- **انتقال طلا** — ارسال فوری طلا بین کاربران
- **کیف خانوادگی** — پس‌انداز مشترک طلایی برای خانواده

### 🏪 راهکارهای فروشندگان
- **API پرداخت** — API_RESTful برای یکپارچه‌سازی
- **پرداخت QR** — اسکن و پرداخت با QR دینامیک
- **سیستم فاکتور** — ایجاد و مدیریت فاکتورها
- **تسویه خودکار** — تسویه خودکار فروشندگان

### 🤖 هوش مصنوعی
- **مشاور مالی AI** — تحلیل پرتفوی و پیشنهاد خرید/فروش
- **اسکنر طلا** — ابزار تحلیل بازار
- **طالع‌بینی طلا** — پیش‌بینی‌های روزانه سرگرم‌کننده

### 🎮 گیمیفیکیشن و تعامل
- **چک‌این روزانه** — کسب پاداش برای بازدید روزانه
- **دستاوردها** — باز کردن نشان‌ها و نقاط عطف
- **سیستم سطح‌بندی** — برنز → نقره → طلا → الماس
- **فید اجتماعی** — پست‌ها و تعاملات جامعه
- **کلوپ خالقان محتوا** — تولید محتوا و کسب طلا

## 📊 مدل‌های پایگاه داده

پلتفرم بر پایه **بیش از ۹۰ مدل داده‌ای** در حوزه‌های زیر:

| حوزه | تعداد | توضیحات |
|------|-------|---------|
| مدیریت کاربر | ۸ | احراز هویت، پروفایل، KYC، نقش‌ها |
| طلا و معاملات | ۵ | قیمت‌گذاری، کیف پول، هشدار |
| مالی | ۶ | پرداخت، تراکنش، فاکتور |
| وام | ۳ | وام طلایی، بازپرداخت |
| کارت | ۲ | کارت طلایی، تراکنش‌های کارت |
| فروشنده | ۵ | API، پرداخت، QR |
| اجتماعی | ۳ | پست، هدیه، کیف خانوادگی |
| گیمیفیکیشن | ۴ | دستاورد، چک‌این، پیش‌بینی |
| ارتباطات | ۵ | اعلان، SMS، ایمیل، تلگرام |

## 🗺️ نقشه راه

### ✅ نسخه ۴.۰.x — فعلی (پایدار)
- [x] موتور معاملات طلای اصلی
- [x] سیستم کیف پول دوگانه
- [x] کارت مجازی پشتوانه‌دار طلا
- [x] API پرداخت فروشندگان
- [x] مشاور مالی هوش مصنوعی
- [x] سیستم گیمیفیکیشن
- [x] طراحی ریسپانسیو موبایل
- [x] پشتیبانی دوزبانه

### 🔄 نسخه ۴.۱.x — نسخه بعدی
- [ ] یکپارچه‌سازی واقعی بانکی
- [ ] معاملات پیشرفته (حد ضرر، سفارش محدود)
- [ ] مشاور AI پیشرفته با تنظیم مجدد پرتفوی
- [ ] اپلیکیشن موبایل (React Native)

### 📅 نسخه ۵.۰ — چشم‌انداز آینده
- [ ] پشتیبانی چنددارایی (نقره، کریپتو)
- [ ] معاملات اجتماعی (کپی‌تریدینگ)
- [ ] یکپارچه‌سازی بانک باز
- [ ] دسترسی به بازارهای بین‌المللی

## 📈 فرصت بازار

| شاخص | مقدار |
|------|-------|
| **بازار هدف** | جمعیت ۸۵+ میلیون ایران |
| **حجم بازار طلا** | بیش از ۱۰ میلیارد دلار تجارت سالانه طلا در ایران |
| **نفوذ دیجیتال** | بیش از ۷۰٪ نفوذ گوشی هوشمند |
| **رشد فین‌تک** | بیش از ۴۰٪ رشد سالانه فین‌تک ایرانی |
| **کاربران بالقوه** | بیش از ۱۵ میلیون سرمایه‌گذار بالقوه |

## 🔒 امنیت

- **احراز هویت** — ورود مبتنی بر OTP با مدیریت نشست
- **مجوزدهی** — کنترل دسترسی مبتنی بر نقش (RBAC)
- **تأیید هویت** — KYC برای احراز هویت مشتری
- **لاگ حسابرسی** — ردیابی کامل فعالیت‌ها
- **مسدودسازی IP** — تشخیص خودکار فعالیت‌های مشکوک
- **رمزنگاری داده** — ذخیره امن اطلاعات حساس

## 🚀 راه‌اندازی سریع

```bash
# کلون مخزن
git clone https://github.com/fartakcomplex/zaringold.git
cd zaringold

# نصب وابستگی‌ها
npm install

# راه‌اندازی پایگاه داده
npx prisma db push

# اجرای سرور توسعه
npm run dev

# باز کردن http://localhost:3000
```

## 📦 نسخه‌ها

| نسخه | تاریخ | توضیحات |
|-------|--------|---------|
| v4.0.1 | ۱۴۰۵/۰۲/۰۶ | رفع باگ‌ها و بهبود کارت طلایی |
| v4.0.0 | ۱۴۰۵/۰۲/۰۶ | پرتفوی جامع و امکانات جدید |
| v2.9.4 | — | اصلاح چیدمان موبایل |
| v2.9.1 | — | ترجمه انگلیسی و بهبود UI |
| v2.7.0 | — | اصلاح کنتراست کارت |

---

<div align="center">

## 👥 تیم توسعه

**فارکاکس (Fartak Complex)**

[![GitHub](https://img.shields.io/badge/GitHub-fartakcomplex-181717?style=for-the-badge&logo=github)](https://github.com/fartakcomplex)

---

**ساخته‌شده با ❤️ و 🪙**

</div>
