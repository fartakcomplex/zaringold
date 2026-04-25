<div align="center">

# 🏆 زرین گلد — Zaringold

# پلتفرم جامع معاملات طلای هوشمند
# Smart Gold Trading Platform

**نسخه / Version:** `v2.9.4`
**تاریخ / Date:** June 2025
**مجوز / License:** Proprietary & Confidential

<br/>

<img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" />
<img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
<img src="https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socket.io" />
<img src="https://img.shields.io/badge/Bun-Runtime-F9A825?style=flat-square" />
<img src="https://img.shields.io/badge/Farsi-RTL-6B7280?style=flat-square" />

<br/><br/>

> **زرین گلد** یک پلتفرم فین‌تک نسل جدید برای معاملات و سرمایه‌گذاری طلای دیجیتال در ایران است.
>
> **Zaringold** is a next-generation fintech platform for digital gold trading and investment in Iran.

<br/>

[![Stars](https://img.shields.io/github/stars/fartakcomplex/zaringold?style=social)](https://github.com/fartakcomplex/zaringold)
[![Release](https://img.shields.io/github/v/release/fartakcomplex/zaringold?style=flat-square)](https://github.com/fartakcomplex/zaringold/releases)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

</div>

---

## 📑 فهرست مطالب — Table of Contents

| # | فارسی | English |
|---|-------|---------|
| 1 | [چکیده اجرایی](#1--چکیده-اجرایی--executive-summary) | [Executive Summary](#1--چکیده-اجرایی--executive-summary) |
| 2 | [ویژگی‌های کلیدی](#2--ویژگیهای-کلیدی--key-features) | [Key Features](#2--ویژگیهای-کلیدی--key-features) |
| 3 | [معماری سیستم](#3--معماری-سیستم--system-architecture) | [System Architecture](#3--معماری-سیستم--system-architecture) |
| 4 | [ماژول‌ها و امکانات](#4--ماژولها-و-امکانات--modules--features) | [Modules & Features](#4--ماژولها-و-امکانات--modules--features) |
| 5 | [طراحی رابط کاربری](#5--طراحی-رابط-کاربری--uiux-design) | [UI/UX Design](#5--طراحی-رابط-کاربری--uiux-design) |
| 6 | [امنیت و حریم خصوصی](#6--امنیت-و-حریم-خصوصی--security--privacy) | [Security & Privacy](#6--امنیت-و-حریم-خصوصی--security--privacy) |
| 7 | [زیرساخت فنی](#7--زیرساخت-فنی--technical-infrastructure) | [Technical Infrastructure](#7--زیرساخت-فنی--technical-infrastructure) |
| 8 | [تحلیل بازار](#8--تحلیل-بازار--market-analysis) | [Market Analysis](#8--تحلیل-بازار--market-analysis) |
| 9 | [مدل درآمدی](#9--مدل-درآمدی--revenue-model) | [Revenue Model](#9--مدل-درآمدی--revenue-model) |
| 10 | [نقشه راه توسعه](#10--نقشه-راه-توسعه--development-roadmap) | [Development Roadmap](#10--نقشه-راه-توسعه--development-roadmap) |
| 11 | [تکنولوژی‌ها](#11--تکنولوژیها--tech-stack) | [Tech Stack](#11--تکنولوژیها--tech-stack) |
| 12 | [شروع سریع](#12--شروع-سریع--quick-start) | [Quick Start](#12--شروع-سریع--quick-start) |
| 13 | [ساختار پروژه](#13--ساختار-پروژه--project-structure) | [Project Structure](#13--ساختار-پروژه--project-structure) |

---

# 1 | چکیده اجرایی / Executive Summary

## 🇮🇷 چکیده اجرایی

زرین گلد یک پلتفرم فین‌تک جامع و یکپارچه برای معاملات و سرمایه‌گذاری طلای دیجیتال است که با هدف دگرگونی بازار سنتی طلا در ایران طراحی و توسعه یافته است. این پلتفرم با استفاده از فناوری‌های نوین وب، هوش مصنوعی و زیرساخت‌های پرداخت امن، تجربه‌ای مدرن و قابل اعتماد برای خرید، فروش و مدیریت سرمایه طلایی کاربران فراهم می‌کند.

### بازار فرصت

بازار طلای ایران یکی از بزرگ‌ترین بازارهای خاورمیانه با حجم معاملات سالانه بیش از **۳۰ میلیارد دلار** است. با این حال، بیش از ۹۰٪ معاملات طلا هنوز به روش‌های سنتی و فیزیکی انجام می‌شود. تحول دیجیتال در حال تغییر ذهنیت مصرف‌کنندگان ایرانی است و بیش از **۷۰٪** جمعیت ایران از طریق موبایل به اینترنت دسترسی دارند.

### ارزش پیشنهادی کلیدی

- **معاملات لحظه‌ای طلا** با قیمت‌گذاری آنلاین و اتصال به بازار جهانی
- **کیف پول دوگانه** (ریالی + طلایی) با مدیریت یکپارچه دارایی‌ها
- **هوش مصنوعی** برای مشاوره سرمایه‌گذاری، تحلیل بازار و پشتیبانی هوشمند
- **درگاه پرداخت طلایی** برای پذیرندگان تجاری با امکان پرداخت با طلای دیجیتال
- **سیستم جامع خدمات** شامل بیمه، قبوض، خودرو و کارت طلایی
- **گیمیفیکیشن** برای افزایش تعامل و آموزش مالی کاربران
- **API توسعه‌دهندگان** برای ایجاد اکوسیستم مالی مبتنی بر طلا

### مخاطبان هدف

| بخش | توضیحات |
|-----|---------|
| سرمایه‌گذاران خرد | افراد عادی با پس‌انداز کم که به دنبال سرمایه‌گذاری امن هستند |
| معامله‌گران حرفه‌ای | فعالان بازار طلا که به دنبال ابزارهای پیشرفته هستند |
| پذیرندگان تجاری | کسب‌وکارها و فروشگاه‌های آنلاین |
| جوانان نسل Z | علاقه‌مند به فین‌تک و سرمایه‌گذاری دیجیتال |
| توسعه‌دهندگان | برنامه‌نویسان و استارتاپ‌های مالی |

---

## 🇬🇧 Executive Summary

Zaringold is a comprehensive fintech platform designed to revolutionize gold trading and investment in Iran. Built with cutting-edge web technologies, artificial intelligence, and secure payment infrastructure, it delivers a modern and trustworthy experience for buying, selling, and managing digital gold assets.

### Market Opportunity

Iran's gold market is one of the largest in the Middle East, with an estimated annual trading volume exceeding **$30 billion**. However, over 90% of gold transactions still occur through traditional physical channels. Digital transformation is rapidly shifting Iranian consumer behavior, with over 70% of the population accessing the internet via mobile devices.

### Key Value Proposition

- **Real-time gold trading** with live pricing connected to global markets via WebSocket
- **Dual wallet system** (Fiat + Gold) for unified asset management
- **AI-powered intelligence** for investment advisory, market analysis, and smart support
- **Gold payment gateway** enabling merchants to accept digital gold payments
- **Comprehensive service suite** including insurance, utility payments, vehicle services, and Gold Card
- **Gamification engine** driving engagement and financial literacy
- **Developer API ecosystem** for building gold-based financial applications

---

# 2 | ویژگی‌های کلیدی / Key Features

<div align="center">

| 📊 معاملات طلا | 💰 کیف پول | 🤖 هوش مصنوعی | 🏪 درگاه پذیرندگان |
|:---:|:---:|:---:|:---:|
| خرید/فروش لحظه‌ای | ریالی + طلایی | مشاور سرمایه‌گذاری | پرداخت با طلای دیجیتال |
| قیمت‌گذاری زنده | انتقال بین کاربران | تحلیل بازار AI | QR Code پرداخت |
| نمودار پیشرفته | پرداخت زرین‌پال | چت هوشمند | SDK چندزبانه |
| آلارم قیمت | تاریخچه تراکنش‌ها | پیش‌بینی قیمت | افزونه وردپرس |

| 🎮 گیمیفیکیشن | 🛡️ بیمه و خدمات | 👑 کارت طلایی | 📱 اپلیکیشن موبایل |
|:---:|:---:|:---:|:---:|
| چک‌این روزانه | بیمه شخص ثالث | کارت مجازی/فیزیکی | طراحی موبایل‌اول |
| سیستم XP و لول | بیمه آتش‌سوزی | شارژ و انتقال | Bottom Navigation |
| دستاوردها | شارژ سیم‌کارت | PIN و امنیت | Pull-to-Refresh |
| پیش‌بینی قیمت | پرداخت قبوض | طراحی دلخواه | تم روشن/تاریک |

</div>

### مزیت‌های رقابتی / Competitive Advantages

| ویژگی / Feature | زرین گلد / Zaringold | رقبا / Competitors |
|---------|-----------|-------------|
| معاملات لحظه‌ای / Real-time Trading | ✅ WebSocket Real-time | ❌ ۱-۵ دقیقه تأخیر |
| کیف پول طلایی / Gold Wallet | ✅ ریالی + طلایی | ❌ فقط ریالی |
| هوش مصنوعی / AI Intelligence | ✅ مشاور + تحلیل + پشتیبانی | ❌ ندارد |
| درگاه پرداخت / Payment Gateway | ✅ پرداخت با طلای دیجیتال | ❌ فقط درگاه بانکی |
| گیمیفیکیشن / Gamification | ✅ کامل با سیستم XP و لول | ❌ محدود |
| API توسعه‌دهندگان / Developer API | ✅ Node.js, Python, PHP, WordPress | ❌ محدود |
| خدمات جانبی / Auxiliary Services | ✅ بیمه، خودرو، قبوض، کارت | ❌ ندارد |

---

# 3 | معماری سیستم / System Architecture

## 🇮🇷 معماری سیستم

```
                    ┌──────────────────────────┐
                    │    کاربر نهایی / User     │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼───────────────┐
                    │   اپلیکیشن وب / Web App   │
                    │  (Next.js 16 + React 19)  │
                    └──────────┬───────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼───────┐ ┌──────▼──────────┐
    │  API Gateway   │ │  WebSocket   │ │  AI Engine      │
    │  (Caddy + LB)  │ │  (Socket.IO) │ │  (z-ai-web-sdk) │
    └─────────┬──────┘ └──────┬───────┘ └──────┬──────────┘
              │                │                │
    ┌─────────▼────────────────▼────────────────▼──────────┐
    │              Business Logic Layer                      │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
    │  │ Trading  │ │ Payments │ │ Services │ │  Social  ││
    │  │ Engine   │ │ Gateway  │ │ Module   │ │  Engine  ││
    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
    └────────────────────────┬─────────────────────────────┘
                             │
    ┌────────────────────────▼─────────────────────────────┐
    │              Data Layer                               │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
    │  │  SQLite  │ │  Cache   │ │ File     │             │
    │  │ (Prisma) │ │ (Memory) │ │ Storage  │             │
    │  └──────────┘ └──────────┘ └──────────┘             │
    └──────────────────────────────────────────────────────┘
```

## 🇬🇧 System Architecture

### Frontend

- **Framework**: Next.js 16 App Router with React 19
- **UI Library**: shadcn/ui (New York style) with full RTL support
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Zustand (client) + TanStack Query (server cache)
- **Real-time**: Socket.IO client for live price feeds and chat
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

### Backend

- **API Server**: Next.js 16 API Routes (80+ endpoints)
- **Real-time**: Socket.IO mini-service on port 3005
- **ORM**: Prisma with SQLite (80+ models)
- **Auth**: NextAuth.js v4 with OTP-based provider
- **AI**: z-ai-web-dev-sdk for LLM, VLM, TTS, ASR
- **Gateway**: Caddy reverse proxy with XTransformPort routing

### Database Schema (80+ Prisma Models)

| دسته / Category | مدل‌ها / Models | تعداد |
|------|--------|------|
| احراز هویت و کاربران / Auth & Users | User, Session, KYC, Profile, Role, Permission | 10+ |
| کیف پول و تراکنش‌ها / Wallets | Wallet, GoldWallet, Transaction, FiatWallet | 5+ |
| معاملات طلا / Gold Trading | GoldPrice, GoldTrade, PriceAlert, PriceHistory | 5+ |
| پرداخت‌ها / Payments | Payment, GatewayPayment, Settlement | 8+ |
| درگاه پذیرندگان / Merchant Gateway | Merchant, ApiKey, Invoice, QrCode, WebhookLog | 8+ |
| بیمه / Insurance | InsuranceCategory, InsurancePlan, InsuranceOrder | 4+ |
| وام / Loans | GoldLoan, LoanRepayment, LoanSetting | 3+ |
| پس‌انداز / Savings | AutoBuyPlan, SavingGoal, CheckIn | 3+ |
| گیمیفیکیشن / Gamification | Achievement, UserAchievement, PricePrediction, XPRecord | 8+ |
| چت و پشتیبانی / Chat & Support | SupportTicket, TicketMessage, ChatFAQ | 5+ |
| محتوا / Content | BlogPost, BlogCategory, CMSPage, Media | 6+ |
| کارت طلایی / Gold Card | GoldCard, GoldCardTransaction | 2+ |
| VIP و وفاداری / VIP & Loyalty | VIPSubscription, CashbackReward, Referral | 4+ |
| شبکه اجتماعی / Social | SocialPost, CreatorProfile, CreatorCampaign | 5+ |
| بازاریابی / Marketing | SmsCampaign, SmsLog, EmailCampaign | 6+ |
| امنیت / Security | SecurityEvent, BlockedIP, AuditLog | 4+ |

---

# 4 | ماژول‌ها و امکانات / Modules & Features

## 🇮🇷 ماژول‌ها

### ۴.۱ معاملات هسته‌ای طلا / Core Gold Trading

| امکان / Feature | توضیحات / Description |
|--------|---------|
| خرید/فروش لحظه‌ای | معامله با قیمت زنده بازار از طریق WebSocket |
| نمودار پیشرفته | نمودار شمعی و خطی با تایم‌فریم‌های مختلف |
| محاسبه‌گر طلای هوشمند | محاسبه ارزش طلای فیزیکی (عیار، وزن، اجرت) |
| هدیه طلایی | ارسال و دریافت هدیه طلایی بین کاربران |
| فروش اضطراری | فروش سریع طلای ذخیره‌شده |
| ردیابی موشک قیمت | نمایش جهت حرکت قیمت به‌صورت بصری |
| آلارم قیمت | هشدار رسیدن به قیمت دلخواه |

### ۴.۲ کیف پول و پرداخت‌ها / Wallet & Payments

| امکان / Feature | توضیحات / Description |
|--------|---------|
| کیف پول ریالی | موجودی ریالی کاربر |
| کیف پول طلایی | موجودی طلایی بر حسب گرم |
| انتقال بین کاربران | انتقال طلا و ریال با تأیید OTP |
| پرداخت زرین‌پال | اتصال به درگاه پرداخت ZarinPal |
| تاریخچه تراکنش‌ها | گزارش کامل با فیلتر و جستجو |

### ۴.۳ هوش مصنوعی / AI & Smart Tools

| امکان / Feature | توضیحات / Description |
|--------|---------|
| چت هوشمند پشتیبانی | پاسخگویی خودکار ۲۴/۷ |
| مشاور خرید هوشمند | پیشنهاد بهترین زمان خرید طلا |
| مربی ثروت AI | مشاوره شخصی‌سازی‌شده سرمایه‌گذاری |
| فال طلایی | تحلیل نمادین و سرگرم‌کننده بازار |
| اسکنر بازار طلا | تحلیل الگوها و روندهای بازار |
| چکاپ سلامت مالی | بررسی وضعیت مالی کاربر |
| تحلیل بازار AI | تحلیل هوشمند روند بازار با LLM |
| پیام‌رسان صوتی | ضبط و تبدیل صدا به متن (ASR) |

### ۴.۴ گیمیفیکیشن / Gamification

| امکان / Feature | توضیحات / Description |
|--------|---------|
| چک‌این روزانه | پاداش XP و طلای میل‌گرمی برای ورود روزانه |
| بازی پیش‌بینی قیمت | پیش‌بینی قیمت فردا و کسب امتیاز |
| سیستم دستاوردها | نشان‌ها و مدال‌های افتخار |
| سیستم XP و لول | سطح‌بندی کاربران (Bronze → Diamond) |
| مأموریت طلایی | وظایف روزانه و هفتگی |
| باشگاه سازندگان محتوا | ایجاد محتوای آموزشی مالی و کسب پاداش |
| جدول رده‌بندی | رتبه‌بندی کاربران فعال |

### ۴.۵ خدمات / Services

| امکان / Feature | توضیحات / Description |
|--------|---------|
| بیمه شخص ثالث | خرید آنلاین بیمه شخص ثالث خودرو |
| بیمه آتش‌سوزی | بیمه منازل و مشاغل |
| بیمه بدنه | بیمه بدنه خودرو |
| شارژ سیم‌کارت | شارژ مستقیم MCI، Irancell، Rightel، Taliya |
| خرید بسته اینترنت | بسته‌های اینترنت اپراتورها |
| پرداخت قبوض | قبوض آب، برق، گاز، تلفن |
| سرویس خودرو | تعویض روغن، بیمه، معاینه فنی |

### ۴.۶ درگاه پذیرندگان / Merchant Gateway

| امکان / Feature | توضیحات / Description |
|--------|---------|
| ثبت‌نام پذیرنده | ایجاد حساب پذیرنده تجاری |
| پرداخت با طلای دیجیتال | مشتریان با طلای دیجیتال پرداخت کنند |
| پرداخت با QR | اسکن QR برای پرداخت سریع |
| تسویه‌حساب خودکار | تسویه ریالی یا طلایی |
| پنل پذیرنده | مدیریت تراکنش‌ها و گزارش‌ها |
| پورتال توسعه‌دهندگان | مستندات API و ابزارها |
| افزونه وردپرس | پلاگین برای فروشگاه‌های وردپرسی |
| SDK چندزبانه | Node.js, Python, PHP |

### ۴.۷ پنل مدیریت / Admin Dashboard

- **داشبورد مدیریت** — نمای کلی با نمودارها و آمار زنده
- **مدیریت کاربران** — لیست، KYC، و کنترل حساب‌ها
- **مدیریت تراکنش‌ها** — بررسی و تأیید تراکنش‌ها
- **مدیریت پذیرندگان** — تأیید و تنظیم کارمزد
- **مدیریت محتوا** — وبلاگ، CMS، صفحه‌ساز
- **مدیریت قیمت‌ها** — تنظیم اسپرد و منابع قیمت
- **مدیریت بازاریابی** — کمپین پیامک و ایمیل
- **مدیریت ربات تلگرام** — تنظیم و نظارت
- **سیستم RBAC** — نقش‌ها و دسترسی‌ها
- **لاگ‌های امنیتی** — نظارت بر فعالیت‌های مشکوک
- **پشتیبان‌گیری** — بکاپ خودکار و بازیابی

---

# 5 | طراحی رابط کاربری / UI/UX Design

## سیستم طراحی / Design System

```
┌─────────────────────────────────────────────────────────┐
│                  Zaringold Design System                 │
│                                                           │
│  Colors:                                                  │
│  ├── Primary Gold:    #D4AF37                             │
│  ├── Dark Gold:       #B8860B                             │
│  ├── Light Gold:      #F5E6B8                             │
│  ├── Background:      #FFFFFF (Light) / #0A0A0A (Dark)   │
│  ├── Success:         #22C55E                             │
│  ├── Danger:          #EF4444                             │
│  └── Warning:         #F59E0B                             │
│                                                           │
│  Typography:                                             │
│  ├── Persian:   IRANSansWeb (7 weights)                  │
│  ├── English:   Inter / System UI                         │
│  └── Scale:     12px → 36px                               │
│                                                           │
│  Effects:                                                 │
│  ├── Glass-morphism (backdrop-blur)                      │
│  ├── Smooth transitions (Framer Motion)                  │
│  └── Micro-interactions on all interactive elements      │
└─────────────────────────────────────────────────────────┘
```

### اصول طراحی / Design Principles

| اصل / Principle | توضیحات / Description |
|-----|---------|
| **موبایل اول / Mobile-First** | طراحی ابتدا برای موبایل، سپس واکنش‌گرا |
| **حس اپلیکیشن / App-Like** | Bottom Navigation، Swipe، Pull-to-Refresh |
| **RTL اولیه / RTL-First** | فارسی پیش‌فرض + پشتیبانی انگلیسی |
| **Glass-morphism** | افکت‌های شیشه‌ای برای عمق بصری |
| **تم دوگانه / Dual Theme** | تم روشن و تاریک با انتقال روان |
| **لمس بهینه / Touch-Optimized** | حداقل 44px برای عناصر تعاملی |

### نمونه صفحه موبایل / Mobile Layout Example

```
┌─────────────────────────────────┐
│  Header (آواتار + سلام + اعلان) │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │   کیف پول طلایی (گرم)     │  │
│  │   ████ 2.5 گرم            │  │
│  │   [+خرید] [+فروش]         │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │   📊 قیمت لحظه‌ای طلا     │  │
│  │   نمودار ۲۴ ساعته         │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  دسترسی سریع (Quick Actions)    │
│  [💳 کارت] [🎯 اهداف] [🎁 هدیه]│
├─────────────────────────────────┤
│  [🏠] [📊] [💳] [💬] [👤]      │
│  Bottom Navigation               │
└─────────────────────────────────┘
```

---

# 6 | امنیت و حریم خصوصی / Security & Privacy

## معماری امنیتی ۵ لایه‌ای / 5-Layer Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                               │
│  • SSL/TLS Encryption (Caddy)                            │
│  • DDoS Protection & Rate Limiting                       │
│  • CORS Policy                                           │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Authentication & Authorization                  │
│  • OTP-based Login (SMS)                                 │
│  • JWT Token + NextAuth.js Sessions                      │
│  • RBAC (Role-Based Access Control)                      │
│  • Admin 2FA                                             │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Identity Verification (KYC)                    │
│  • Level 1: Phone + Name                                 │
│  • Level 2: National ID + Selfie                         │
│  • Level 3: Financial Documents                          │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Data Protection                                │
│  • AES-256-GCM Encryption for sensitive fields           │
│  • bcrypt (cost 12) for passwords                        │
│  • Audit Logging                                         │
├─────────────────────────────────────────────────────────┤
│  Layer 5: Fraud Detection & Prevention                   │
│  • Transaction Pattern Analysis                          │
│  • IP Reputation & Device Fingerprinting                 │
│  • Smart CAPTCHA                                         │
│  • Velocity Checks                                       │
└─────────────────────────────────────────────────────────┘
```

### رمزنگاری داده‌ها / Data Encryption

| نوع داده / Data Type | روش / Method |
|----------|-------------|
| رمز عبور / Passwords | bcrypt (cost factor: 12) |
| اطلاعات حساس / Sensitive | AES-256-GCM |
| توکن‌ها / Tokens | JWT RS256 |
| اتصالات / Connections | TLS 1.3 |

---

# 7 | زیرساخت فنی / Technical Infrastructure

## معماری سرور / Server Architecture

```
┌─────────────────────────────────────────────────┐
│              Production Server                   │
│                                                  │
│  ┌─────────────┐    ┌──────────────┐            │
│  │   Caddy     │    │   Bun        │            │
│  │   (:443)    │───▶│   Runtime    │            │
│  └─────────────┘    └──────┬───────┘            │
│                            │                     │
│  ┌──────────┐  ┌──────────▼──┐  ┌──────────┐   │
│  │  Next.js  │  │Chat Service │  │  Price   │   │
│  │  (:3000)  │  │  (:3005)    │  │ Service  │   │
│  └──────────┘  └─────────────┘  └──────────┘   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  SQLite  │  │  Upload  │  │  Logs    │      │
│  │   DB     │  │  Storage │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

### نقشه مقیاس‌پذیری / Scalability Plan

| فاز / Phase | معماری / Architecture | ظرفیت / Capacity |
|-------|-------------|----------|
| **فعلی / Current** | Single server, SQLite, memory cache | تا ۱۰K کاربر همزمان |
| **رشد / Growth** | Load balancer, PostgreSQL, Redis | تا ۱۰۰K کاربر همزمان |
| **مقیاس / Scale** | Kubernetes, event-driven, CDN | ۱M+ کاربر همزمان |

---

# 8 | تحلیل بازار / Market Analysis

## اندازه بازار / Market Size

| شاخص / Metric | مقدار / Value |
|--------|------|
| حجم معاملات سالانه طلا / Annual Gold Volume | **$30+ میلیارد / Billion** |
| تعداد طلافروشی‌ها / Jewelry Shops | ۱۲,۰۰۰+ |
| سرمایه‌گذاران بالقوه / Potential Investors | ۱۵+ میلیون / Million |
| رشد فین‌تک / Fintech Growth (CAGR) | ۳۵٪ |
| نفوذ اینترنت موبایل / Mobile Internet | ۷۰٪+ |
| نفوذ اینترنت پهن‌باند / Broadband | ۸۰٪+ خانوارهای شهری |

### رقبای ما / Competitive Landscape

| رقیب / Competitor | نوع / Type | مزایا / Strengths | ضعف‌ها / Weaknesses |
|------|-----|-------|--------|
| طلافروشی‌های سنتی | فیزیکی | اعتماد بالا | قیمت بالا، ساعات محدود |
| صندوق‌های طلای بورس | سنتی-دیجیتال | شفافیت | حداقل سرمایه بالا |
| اپلیکیشن‌های محدود | دیجیتال | راحتی | امکانات محدود |
| **زرین گلد** | **دیجیتال جامع** | **تمام امکانات** | **نیاز به رشد برند** |

---

# 9 | مدل درآمدی / Revenue Model

## جریان‌های درآمدی / Revenue Streams

| # | منبع درآمد / Source | مدل / Model | سهم تخمینی / Est. Share |
|---|------|------|------|
| 1 | **کارمزد معاملات** | اسپرد خرید/فروش | ۴۰٪ |
| 2 | **درگاه پذیرندگان** | کارمزد تراکنش + تسویه | ۲۵٪ |
| 3 | **خدمات بیمه** | کمیسیون از بیمه‌گران | ۱۵٪ |
| 4 | **عضویت VIP** | اشتراک ماهانه/سالانه | ۱۰٪ |
| 5 | **خدمات جانبی** | شارژ، قبض، خودرو | ۵٪ |
| 6 | **تبلیغات** | بنر و native ads | ۵٪ |

---

# 10 | نقشه راه توسعه / Development Roadmap

```
2024 Q4          2025 Q1          2025 Q2          2025 Q3
   │                │                │                │
   ▼                ▼                ▼                ▼
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ v2.0   │────▶│ v2.5   │────▶│ v2.9   │────▶│ v3.0   │
│ MVP    │     │ Complete│     │ Growth │     │ Scale  │
└────────┘     └────────┘     └────────┘     └────────┘
│               │               │               │
├ Core Trading  ├ All Services  ├ AI Engine     ├ Mobile App
├ Wallet        ├ Insurance     ├ Gamification  ├ PostgreSQL
├ Auth (OTP)    ├ Car Services  ├ Creator Club  ├ Redis Cache
├ Basic Admin   ├ Merchant GW   ├ Telegram Bot  ├ Kubernetes
└ ZarinPal      ├ Full Admin    └ Multi-SDK     └ Multi-region
                └ Blog + CMS                    └ Blockchain
```

### نسخه v2.9.4 (فعلی / Current)

- ✅ معاملات لحظه‌ای طلا با WebSocket
- ✅ کیف پول دوگانه (ریالی + طلایی)
- ✅ پنل مدیریت کامل (۱۵+ صفحه)
- ✅ سیستم بیمه، شارژ، قبوض، خودرو
- ✅ درگاه پرداخت پذیرندگان + SDK
- ✅ گیمیفیکیشن (XP, چک‌این, دستاوردها, پیش‌بینی)
- ✅ هوش مصنوعی (چت، مشاور، تحلیل بازار)
- ✅ لوگوی اپراتورها (SVG - MCI, Irancell, Rightel, Taliya)
- ✅ طراحی موبایل‌پسند حرفه‌ای
- ✅ پشتیبانی دوزبانه (فارسی/انگلیسی)
- ✅ تم روشن/تاریک
- ✅ لاگین OTP + احراز هویت KYC
- ✅ ربات تلگرام + بازاریابی پیامک/ایمیل

### برنامه v3.0 (آینده / Future)

- 🔲 اپلیکیشن موبایل بومی (React Native)
- 🔲 مهاجرت به PostgreSQL
- 🔲 Redis برای کش و Session
- 🔲 سیستم بلاکچین برای شفافیت ذخیره طلا
- 🔲 Kubernetes orchestration
- 🔲 استقرار چند منطقه‌ای (Multi-region)

---

# 11 | تکنولوژی‌ها / Tech Stack

<div align="center">

### فرانت‌اند / Frontend
| تکنولوژی / Technology | نسخه / Version | نقش / Role |
|---|---|---|
| Next.js | 16.1 | Framework (App Router, SSR, API Routes) |
| React | 19 | UI Library |
| TypeScript | 5 | Language |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | New York | Component Library |
| Framer Motion | 12 | Animations |
| Recharts | 2.15 | Charts |
| Zustand | 5 | Client State |
| TanStack Query | 5.82 | Server State Cache |
| Socket.IO Client | 4.8 | Real-time |
| Lucide React | 0.525 | Icons |

### بک‌اند / Backend
| تکنولوژی / Technology | نسخه / Version | نقش / Role |
|---|---|---|
| Bun | Runtime | JavaScript Runtime |
| Next.js API Routes | 16 | REST API (80+ endpoints) |
| Socket.IO | 4.8 | WebSocket Server |
| Prisma ORM | 6.11 | Database ORM |
| SQLite | — | Database |
| NextAuth.js | 4 | Authentication |
| z-ai-web-dev-sdk | 0.0.17 | AI Integration (LLM, VLM, TTS, ASR) |
| Zod | 4 | Validation |
| ZarinPal SDK | — | Payment Gateway |

### ابزارهای توسعه / Dev Tools
| تکنولوژی / Technology | نقش / Role |
|---|---|
| ESLint | Code Quality |
| Caddy | Reverse Proxy & SSL |
| Sharp | Image Processing |
| date-fns | Date Formatting |
| react-hook-form | Form Management |
| tiptap | Rich Text Editor |
| react-markdown | Markdown Rendering |

</div>

---

# 12 | شروع سریع / Quick Start

## پیش‌نیازها / Prerequisites

- **Node.js** 18+ یا **Bun** 1.0+
- **Git**
- **پایگاه داده / Database**: SQLite (خودکار نصب می‌شود / auto-installed)

## نصب و اجرا / Installation & Run

```bash
# ۱. کلون کردن مخزن / Clone the repository
git clone https://github.com/fartakcomplex/zaringold.git
cd zaringold

# ۲. نصب وابستگی‌ها / Install dependencies
bun install

# ۳. تنظیم متغیرهای محیطی / Set environment variables
cp .env.example .env
# ویرایش .env با تنظیمات خود / Edit .env with your settings

# ۴. راه‌اندازی پایگاه داده / Setup database
bun run db:push
bun run db:generate

# ۵. اجرای سرور توسعه / Start development server
bun run dev
```

سپس مرورگر را در [http://localhost:3000](http://localhost:3000) باز کنید.

## متغیرهای محیطی / Environment Variables

| متغیر / Variable | توضیحات / Description |
|---|---|
| `DATABASE_URL` | آدرس فایل SQLite |
| `NEXTAUTH_SECRET` | کلید رمزنگاری Sessions |
| `ZARINPAL_MERCHANT_ID` | کد پذیرنده زرین‌پال |
| `KAVENEGAR_API_KEY` | کلید API پیامک |
| `AI_API_KEY` | کلید API هوش مصنوعی |

---

# 13 | ساختار پروژه / Project Structure

```
zaringold/
├── src/                          # Source Code
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Landing Page
│   │   ├── layout.tsx            # Root Layout
│   │   ├── globals.css           # Global Styles
│   │   └── api/                  # API Routes (80+ endpoints)
│   │       ├── auth/             # Authentication
│   │       ├── gold/             # Gold Trading
│   │       ├── payment/          # Payments
│   │       ├── gateway/          # Merchant Gateway
│   │       ├── chat/             # Chat & Support
│   │       ├── gold-card/        # Gold Card
│   │       ├── insurance/        # Insurance
│   │       ├── autosave/         # Auto-Save Plans
│   │       ├── loans/            # Loans
│   │       ├── goals/            # Savings Goals
│   │       ├── gamification/     # Gamification
│   │       ├── gifts/            # Gold Gifts
│   │       ├── predictions/      # Price Predictions
│   │       ├── family-wallet/    # Family Wallet
│   │       ├── vip/              # VIP Membership
│   │       ├── transfer/         # Transfers
│   │       ├── kyc/              # KYC Verification
│   │       ├── alerts/           # Price Alerts
│   │       ├── tickets/          # Support Tickets
│   │       ├── sms/              # SMS Marketing
│   │       ├── email/            # Email Marketing
│   │       ├── telegram/         # Telegram Bot
│   │       ├── blog/             # Blog CMS
│   │       ├── cms/              # CMS Pages
│   │       ├── market/           # Market Analysis
│   │       ├── site-settings/    # Site Configuration
│   │       └── health/           # Health Check
│   ├── components/               # React Components
│   │   ├── ui/                   # shadcn/ui Components (40+)
│   │   ├── layout/               # App Layout, Header, Sidebar, BottomNav
│   │   ├── landing/              # Landing Page Sections (20+)
│   │   ├── gold/                 # Gold Trading Views
│   │   ├── wallet/               # Wallet & Transfer
│   │   ├── ai/                   # AI Tools (6 components)
│   │   ├── gamification/         # Gamification (4 components)
│   │   ├── insurance/            # Insurance (7 components)
│   │   ├── utility-services/     # Charge & Bills (with OperatorLogos)
│   │   ├── car-services/         # Car Services (4 components)
│   │   ├── gateway/              # Merchant Gateway (9 components)
│   │   ├── admin/                # Admin Panel (20+ pages)
│   │   ├── chat/                 # Chat & Support
│   │   ├── dashboard/            # User Dashboard
│   │   ├── trading/              # Auto Trading
│   │   ├── analytics/            # Portfolio Analytics
│   │   ├── creator/              # Creator Hub
│   │   ├── education/            # Education Center
│   │   ├── shared/               # Shared Components (20+)
│   │   └── ...more               # 100+ total components
│   ├── hooks/                    # Custom React Hooks
│   ├── lib/                      # Utilities & Libraries
│   │   ├── db.ts                 # Prisma Client
│   │   ├── i18n.ts               # Internationalization (fa/en)
│   │   ├── utils.ts              # Utility Functions
│   │   └── ...more
│   └── stores/                   # Zustand State Stores
│       └── authStore.ts          # Authentication Store
├── mini-services/                # Microservices
│   └── chat-service/             # Socket.IO Chat Service (:3005)
│       └── index.ts
├── prisma/
│   └── schema.prisma             # Database Schema (80+ models)
├── public/                       # Static Assets
│   ├── fonts/                    # IRANSansWeb (7 weights)
│   ├── images/                   # Images & Banners
│   ├── uploads/                  # User Uploads
│   ├── sdk/                      # Developer SDKs
│   │   ├── zarrin-gold-node-sdk/
│   │   ├── zarrin-gold-python-sdk/
│   │   └── zarrin-gold-php-sdk/
│   ├── logo.svg                  # Platform Logo
│   └── robots.txt
├── wordpress-plugin/             # WordPress Integration
│   └── zarrin-gold-gateway/      # Payment Gateway Plugin
├── docs/
│   └── PROPOSAL.md               # Full Project Proposal
├── package.json                  # Dependencies (50+ packages)
├── tailwind.config.ts            # Tailwind Configuration
├── next.config.ts                # Next.js Configuration
├── components.json               # shadcn/ui Configuration
└── Caddyfile                     # Reverse Proxy Configuration
```

---

<div align="center">

## 📄 مجوز / License

**Proprietary & Confidential**

تمامی حقوق مادی و معنوی این پروژه متعلق به شرکت **فارتاک کمپلکس** است.

All rights reserved. This project is proprietary and confidential to **Fartak Complex**.

<br/><br/>

---

**Built with ❤️ by [Fartak Complex](https://github.com/fartakcomplex)**

<p>
<img src="https://img.shields.io/badge/Made_with-Next.js-black?style=flat-square" />
<img src="https://img.shields.io/badge/Made_with-React-61DAFB?style=flat-square" />
<img src="https://img.shields.io/badge/Made_with-TypeScript-blue?style=flat-square" />
<img src="https://img.shields.io/badge/Made_with-Tailwind-06B6D4?style=flat-square" />
</p>

</div>
