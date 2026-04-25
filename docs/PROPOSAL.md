<div align="center">

![Cover](../public/proposal-cover.png)

# زرین گلد — Zaringold

## پلتفرم معاملات طلای هوشمند
## Smart Gold Trading Platform

**نسخه / Version:** `v2.9.4`
**تاریخ / Date:** June 2025
**مخزن کد / Repository:** [github.com/fartakcomplex/zaringold](https://github.com/fartakcomplex/zaringold)
**مجوز / License:** Proprietary & Confidential

<br/>
<img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" />
<img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
<img src="https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socket.io" />
<img src="https://img.shields.io/badge/Bun-Runtime-F9A825?style=flat-square" />

</div>

---

> **سند محرمانه — Confidential Document**
>
> این سند حاوی اطلاعات محرمانه مربوط به پروژه زرین گلد است. بازتولید، توزیع یا افشای محتوای این سند بدون کسب مجوز کتبی از طرف شرکت فارتاک کمپلکس ممنوع می‌باشد.
>
> This document contains confidential information about the Zaringold project. Reproduction, distribution, or disclosure of this document's content without written permission from Fartak Complex is strictly prohibited.

---

## فهرست مطالب — Table of Contents

| # | فارسی | English |
|---|-------|---------|
| 1 | [چکیده اجرایی](#1--چکیده-اجرایی--executive-summary) | [Executive Summary](#1--چکیده-اجرایی--executive-summary) |
| 2 | [بیان مسئله](#2--بیان-مسئله--problem-statement) | [Problem Statement](#2--بیان-مسئله--problem-statement) |
| 3 | [راه‌حل پیشنهادی](#3--راهحل-پیشنهادی--proposed-solution) | [Proposed Solution](#3--راهحل-پیشنهادی--proposed-solution) |
| 4 | [معماری سیستم](#4--معماری-سیستم--system-architecture) | [System Architecture](#4--معماری-سیستم--system-architecture) |
| 5 | [ماژول‌ها و امکانات](#5--ماژولها-و-امکانات--modules--features) | [Modules & Features](#5--ماژولها-و-امکانات--modules--features) |
| 6 | [طراحی رابط کاربری](#6--طراحی-رابط-کاربری--uiux-design) | [UI/UX Design](#6--طراحی-رابط-کاربری--uiux-design) |
| 7 | [امنیت و حریم خصوصی](#7--امنیت-و-حریم-خصوصی--security--privacy) | [Security & Privacy](#7--امنیت-و-حریم-خصوصی--security--privacy) |
| 8 | [زیرساخت فنی](#8--زیرساخت-فنی--technical-infrastructure) | [Technical Infrastructure](#8--زیرساخت-فنی--technical-infrastructure) |
| 9 | [تحلیل بازار](#9--تحلیل-بازار--market-analysis) | [Market Analysis](#9--تحلیل-بازار--market-analysis) |
| 10 | [مدل درآمدی](#10--مدل-درآمدی--revenue-model) | [Revenue Model](#10--مدل-درآمدی--revenue-model) |
| 11 | [نقشه راه توسعه](#11--نقشه-راه-توسعه--development-roadmap) | [Development Roadmap](#11--نقشه-راه-توسعه--development-roadmap) |
| 12 | [تحلیل ریسک](#12--تحلیل-ریسک--risk-analysis) | [Risk Analysis](#12--تحلیل-ریسک--risk-analysis) |
| 13 | [تیم و منابع](#13--تیم-و-منابع--team--resources) | [Team & Resources](#13--تیم-و-منابع--team--resources) |
| 14 | [نتیجه‌گیری](#14--نتیجهگیری--conclusion) | [Conclusion](#14--نتیجهگیری--conclusion) |

---

# 1 | چکیده اجرایی / Executive Summary

## 🇮🇷 چکیده اجرایی

زرین گلد یک پلتفرم فین‌تک جامع و یکپارچه برای معاملات و سرمایه‌گذاری طلای دیجیتال است که با هدف دگرگونی بازار سنتی طلا در ایران طراحی و توسعه یافته است. این پلتفرم با استفاده از فناوری‌های نوین وب، هوش مصنوعی و زیرساخت‌های پرداخت امن، تجربه‌ای مدرن و قابل اعتماد برای خرید، فروش و مدیریت سرمایه طلایی کاربران فراهم می‌کند.

### بازار فرصت

بازار طلای ایران یکی از بزرگ‌ترین بازارهای خاورمیانه با حجم معاملات سالانه بیش از **۳۰ میلیارد دلار** است. با این حال، بیش از ۹۰٪ معاملات طلا هنوز به روش‌های سنتی و فیزیکی انجام می‌شود. تحول دیجیتال در حال تغییر ذهنیت مصرف‌کنندگان ایرانی است و بیش از **۷۰٪** جمعیت ایران از طریق موبایل به اینترنت دسترسی دارند. این شکاف بین تقاضای بالای طلا و فقدان زیرساخت دیجیتال، فرصتی استثنایی برای زرین گلد ایجاد کرده است.

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

Iran's gold market is one of the largest in the Middle East, with an estimated annual trading volume exceeding **$30 billion**. However, over 90% of gold transactions still occur through traditional physical channels. Digital transformation is rapidly shifting Iranian consumer behavior, with over 70% of the population accessing the internet via mobile devices. This gap between high gold demand and lack of digital infrastructure creates an extraordinary opportunity for Zaringold.

### Key Value Proposition

- **Real-time gold trading** with live pricing connected to global markets via WebSocket
- **Dual wallet system** (Fiat + Gold) for unified asset management
- **AI-powered intelligence** for investment advisory, market analysis, and smart support
- **Gold payment gateway** enabling merchants to accept digital gold payments
- **Comprehensive service suite** including insurance, utility payments, vehicle services, and Gold Card
- **Gamification engine** driving engagement and financial literacy
- **Developer API ecosystem** for building gold-based financial applications

### Target Audience

| Segment | Description |
|---------|-------------|
| Retail Investors | Everyday individuals seeking secure gold-backed savings |
| Professional Traders | Active market participants needing advanced tools |
| Merchants | Businesses and e-commerce stores seeking gold payments |
| Gen Z Users | Tech-savvy youth interested in fintech & digital assets |
| Developers | Programmers and fintech startups building on the platform |

---

# 2 | بیان مسئله / Problem Statement

## 🇮🇷 بیان مسئله

بازار طلای ایران با وجود سابقه طولانی و حجم بالای معاملات، با چالش‌های ساختاری متعددی روبه‌رو است که نیاز به تحول دیجیتال را آشکار می‌کند:

### ۱. بازار تکه‌تکه و نامتمرکز

معاملات طلا در ایران به شکل غیرمتمرکز در هزاران طلافروشی خرد انجام می‌شود. عدم وجود یک بازار دیجیتال یکپارچه باعث:

- عدم شفافیت قیمت‌گذاری بین پذیرندگان مختلف
- تفاوت قیمت قابل توجه بین خرید و فروش (اسپرد بالا)
- عدم امکان مقایسه آنی قیمت‌ها توسط مصرف‌کننده
- نوسانات قیمتی غیرمنطقی در بازار محلی

### ۲. فقدان زیرساخت دیجیتال

بخش عمده‌ای از بازار طلای ایران فاقد زیرساخت‌های لازم برای تحول دیجیتال است:

```
وضعیت فعلی بازار طلای ایران:
┌─────────────────────────────────────────────────┐
│  معاملات فیزیکی         ████████████████████ 92%│
│  پلتفرم‌های آنلاین      ██ 5%                   │
│  صندوق‌های طلای بورس    █ 3%                    │
│  توکن‌های دیجیتال طلا    ░ 0%                    │
└─────────────────────────────────────────────────┘
```

### ۳. مسائل اعتماد و امنیت

- خطر سرقت و نگهداری فیزیکی طلا
- تقلب در عیار و وزن طلای فروخته شده
- عدم شفافیت در منشأ طلای عرضه‌شده
- نبود ضمانت‌های قانونی کافی برای معاملات خرد

### ۴. موانع دسترسی

- ساعات محدود کاری بازار فیزیکی (۹ صبح تا ۶ عصر)
- نیاز به حضور حضوری برای معامله
- حداقل مبلغ خرید بالا در بازار سنتی
- عدم امکان معامله خرد (کمتر از ۱ گرم)

### ۵. چالش‌های نظارتی

- عدم وجود چارچوب نظارتی شفاف برای معاملات دیجیتال طلا
- الزامات تطبیق KYC/AML
- محدودیت‌های ارزی و نقل‌وانتقال مالی
- نیاز به مجوزهای متعدد از نهادهای نظارتی

---

## 🇬🇧 Problem Statement

Iran's gold market, despite its long history and massive trading volume, faces structural challenges that demand digital transformation:

### 1. Fragmented & Decentralized Market

Gold transactions in Iran occur across thousands of small, independent jewelry shops. The absence of a unified digital marketplace leads to:

- Lack of pricing transparency across different vendors
- Significant bid-ask spreads between buy and sell prices
- No real-time price comparison capability for consumers
- Irrational price volatility in local markets

### 2. Missing Digital Infrastructure

The vast majority of Iran's gold market lacks the necessary infrastructure for digital transformation:

```
Current State of Iran's Gold Market:
┌─────────────────────────────────────────────────┐
│  Physical Transactions    ████████████████████ 92%│
│  Online Platforms         ██ 5%                   │
│  Exchange-Traded Gold     █ 3%                    │
│  Digital Gold Tokens      ░ 0%                    │
└─────────────────────────────────────────────────┘
```

### 3. Trust & Security Issues

- Risk of physical theft and storage challenges
- Fraud in gold purity and weight
- Lack of transparency in gold sourcing
- Insufficient legal protections for retail transactions

### 4. Accessibility Barriers

- Limited operating hours of physical markets (9 AM – 6 PM)
- In-person presence required for transactions
- High minimum purchase amounts in traditional markets
- Inability to trade fractional amounts (less than 1 gram)

### 5. Regulatory Challenges

- Absence of clear regulatory framework for digital gold
- KYC/AML compliance requirements
- Currency and financial transfer restrictions
- Multiple licensing requirements from regulatory bodies

---

# 3 | راه‌حل پیشنهادی / Proposed Solution

## 🇮🇷 راه‌حل پیشنهادی

زرین گلد یک پلتفرم جامع و یکپارچه است که تمام چالش‌های بازار طلای ایران را با رویکردی نوآورانه و فناوری‌محور حل می‌کند:

### معماری راه‌حل

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

### مزیت‌های رقابتی

| ویژگی | زرین گلد | رقبا |
|-------|----------|-------|
| معاملات لحظه‌ای | ✅ WebSocket Real-time | ❌ تأخیر ۱-۵ دقیقه |
| کیف پول طلایی | ✅ ریالی + طلایی | ❌ فقط ریالی |
| هوش مصنوعی | ✅ مشاور + تحلیل + پشتیبانی | ❌ ندارد |
| درگاه پرداخت | ✅ پرداخت با طلای دیجیتال | ❌ فقط درگاه بانکی |
| گیمیفیکیشن | ✅ کامل با سیستم XP و لول | ❌ محدود |
| API توسعه‌دهندگان | ✅ Node.js, Python, PHP, WordPress | ❌ محدود |
| خدمات جانبی | ✅ بیمه، خودرو، قبوض، کارت | ❌ ندارد |

### انطباق با مقررات

- **KYC** — احراز هویت سه‌مرحله‌ای (شخصی، شغلی، مالی)
- **AML** — سیستم نظارت بر معاملات مشکوک
- **پرونده‌سازی** — ثبت و نگهداری تمامی تراکنش‌ها
- **شفافیت** — گزارش‌دهی به نهادهای ناظر

---

## 🇬🇧 Proposed Solution

Zaringold is a comprehensive, integrated platform that addresses all challenges in Iran's gold market through an innovative, technology-driven approach:

### Solution Architecture

```
                    ┌──────────────────────────┐
                    │      End User / Client    │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼───────────────┐
                    │    Web App (PWA-ready)    │
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

### Competitive Advantages

| Feature | Zaringold | Competitors |
|---------|-----------|-------------|
| Real-time Trading | ✅ WebSocket Real-time | ❌ 1–5 min delay |
| Gold Wallet | ✅ Fiat + Gold | ❌ Fiat only |
| AI Intelligence | ✅ Advisory + Analysis + Support | ❌ None |
| Payment Gateway | ✅ Digital gold payments | ❌ Bank gateway only |
| Gamification | ✅ Full XP + Level system | ❌ Limited |
| Developer API | ✅ Node.js, Python, PHP, WordPress | ❌ Limited |
| Auxiliary Services | ✅ Insurance, Auto, Bills, Card | ❌ None |

### Regulatory Compliance

- **KYC** — Three-stage identity verification (personal, professional, financial)
- **AML** — Suspicious transaction monitoring system
- **Record-keeping** — Full transaction audit trail
- **Transparency** — Regulatory reporting capabilities

---

# 4 | معماری سیستم / System Architecture

## 🇮🇷 معماری سیستم

### معماری فرانت‌اند

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Architecture                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Next.js 16 App Router                  │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐             │   │
│  │  │  Layout   │ │   Page    │ │ Loading   │             │   │
│  │  │  System   │ │  Router   │ │  States   │             │   │
│  │  └───────────┘ └───────────┘ └───────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  UI Layer (React 19)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ shadcn/ui│ │  Framer  │ │  Lucide  │ │  Recharts│  │   │
│  │  │Component │ │  Motion  │ │  Icons   │ │  Charts  │  │   │
│  │  │ Library  │ │Animation │ │          │ │          │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  State Management                        │   │
│  │  ┌────────────────────┐ ┌────────────────────────────┐  │   │
│  │  │   Zustand Store    │ │   TanStack Query           │  │   │
│  │  │   (Client State)   │ │   (Server State / Cache)   │  │   │
│  │  └────────────────────┘ └────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Real-time Layer                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │           Socket.IO Client                       │   │   │
│  │  │   • قیمت لحظه‌ای طلا / Live gold prices          │   │   │
│  │  │   • نوتیفیکیشن‌ها / Notifications                │   │   │
│  │  │   • چت پشتیبانی / Support chat                  │   │   │
│  │  │   • آلارم قیمت / Price alerts                   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### معماری بک‌اند

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Architecture                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Caddy Reverse Proxy (:3000)                 │   │
│  │  • SSL Termination    • Rate Limiting                   │   │
│  │  • Static Assets      • WebSocket Upgrade               │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                        │                                        │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │              Next.js 16 API Routes                       │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Route Handlers                       │    │   │
│  │  │  /api/auth/*      → احراز هویت                   │    │   │
│  │  │  /api/gold/*      → معاملات طلا                  │    │   │
│  │  │  /api/payment/*   → پرداخت‌ها                    │    │   │
│  │  │  /api/gateway/*   → درگاه پذیرندگان              │    │   │
│  │  │  /api/chat/*      → چت و پشتیبانی                │    │   │
│  │  │  /api/insurance/* → خدمات بیمه                   │    │   │
│  │  │  /api/autosave/*  → پس‌انداز خودکار               │    │   │
│  │  │  /api/loans/*     → وام و تسهیلات                │    │   │
│  │  │  /api/gamification/* → گیمیفیکیشن                │    │   │
│  │  │  /api/admin/*     → پنل مدیریت                   │    │   │
│  │  │  ...80+ API endpoints                            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Mini Services (Socket.IO)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Chat Service │  │Price Service │  │ Dev Server   │  │   │
│  │  │   (:3001)    │  │   (:3002)    │  │   (:3003)    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### طراحی پایگاه داده

پایگاه داده زرین گلد با بیش از **۸۰ مدل** در Prisma طراحی شده و شامل ماژول‌های زیر است:

| دسته | مدل‌ها | تعداد تقریبی |
|------|--------|-------------|
| **احراز هویت و کاربران** | User, Session, Account, VerificationToken, KYC, FamilyWallet, FamilyMember | 8 |
| **کیف پول و تراکنش‌ها** | Wallet, WalletTransaction, FiatWallet, GoldWallet, Transfer | 5 |
| **معاملات طلا** | GoldPrice, GoldTrade, GoldHold, AutoTrade, PriceAlert | 5 |
| **پرداخت‌ها** | Payment, PaymentGateway, ZarinpalTransaction | 3 |
| **درگاه پذیرندگان** | Merchant, MerchantSettlement, Invoice, QRCode | 4 |
| **بیمه** | InsuranceCategory, InsuranceProvider, InsurancePlan, InsuranceOrder | 4 |
| **وام و تسهیلات** | Loan, LoanSettings, LoanRepayment | 3 |
| **پس‌انداز و اهداف** | AutoSavePlan, SavingGoal, GoalContribution | 3 |
| **گیمیفیکیشن** | Achievement, UserAchievement, DailyCheckIn, PricePrediction, XPRecord, Quest | 6 |
| **چت و پشتیبانی** | ChatMessage, ChatFAQ, CannedResponse, Ticket | 4 |
| **محتوا و وبلاگ** | BlogPost, BlogCategory, CMSPage, BlogComment | 4 |
| **کارت طلایی** | GoldCard, CardTransaction, CardDesign | 3 |
| **خدمات کارو و قبوض** | UtilityPayment, CarService, UserCar | 3 |
| **VIP و وفاداری** | VIPSubscription, CashbackReward, LoyaltyPoint, Referral | 4 |
| **شبکه اجتماعی** | SocialPost, PostComment, PostLike, CreatorContent | 4 |
| **هدايا و پاداش** | GoldGift, GiftRedemption | 2 |
| **ابر طلایی** | VaultItem, VaultTransaction | 2 |
| **بازاریابی** | SMSTemplate, SMSCampaign, EmailTemplate, EmailCampaign | 4 |
| **ادمین و تنظیمات** | SiteSettings, AdminRole, AdminPermission, Backup | 4 |
| **ابزارهای AI** | AIConversation, MarketAnalysis, WealthCoachSession | 3 |
| **سایر** | Notification, APILog, AuditLog, RateLimit, Captcha | 5 |

```prisma
// نمونه ساختار مدل — Sample Model Structure
model User {
  id            String    @id @default(cuid())
  phone         String    @unique
  firstName     String?
  lastName      String?
  nationalCode  String?   @unique
  email         String?   @unique
  avatar        String?
  level         Int       @default(1)
  xp            Int       @default(0)
  role          UserRole  @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  fiatWallet    FiatWallet?
  goldWallet    GoldWallet?
  kyc           KYC?
  achievements  UserAchievement[]
  transactions  WalletTransaction[]
  trades        GoldTrade[]
  // ... 40+ relations
}
```

### الگوی API Gateway

```
 Client Request
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│   Caddy      │────▶│   XTransformPort │──▶ Main App (:3000)
│   Proxy      │     │   Header Check   │──▶ Chat Service (:3001)
│   (:443)     │     └──────────────────┘──▶ Price Service (:3002)
└──────────────┘                            ──▶ Dev Server (:3003)
       │
       ▼
  Rate Limiting → Auth Middleware → Route Handler → Response
```

### موتور ارتباط لحظه‌ای

```
┌──────────────────────────────────────────────────┐
│           Real-time Communication Engine          │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │           Socket.IO Server                 │  │
│  │                                            │  │
│  │  Events:                                   │  │
│  │  ├── gold:price:update     (هر ثانیه)      │  │
│  │  ├── gold:alert:trigger    (رویدادمحور)    │  │
│  │  ├── chat:message:new       (بلادرنگ)      │  │
│  │  ├── notification:push      (بلادرنگ)      │  │
│  │  ├── trade:status:update    (رویدادمحور)   │  │
│  │  ├── user:presence:update   (دوره‌ای)       │  │
│  │  └── system:announcement    (رویدادمحور)   │  │
│  │                                            │  │
│  │  Rooms:                                    │  │
│  │  ├── user:{userId}           (خصوصی)       │  │
│  │  ├── gold:market             (عمومی)       │  │
│  │  ├── chat:support:{ticketId} (پشتیبانی)    │  │
│  │  └── admin:dashboard         (مدیران)      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 🇬🇧 System Architecture

### Frontend Architecture

The frontend is built with **Next.js 16 App Router** and **React 19**, following a mobile-first progressive web application approach:

- **Component Library**: shadcn/ui (New York style) with full RTL support
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Icons**: Lucide React icon library
- **Charts**: Recharts for data visualization
- **State Management**: Zustand for client-side state + TanStack Query for server state caching
- **Real-time**: Socket.IO client for live price feeds, notifications, and chat

### Backend Architecture

The backend leverages **Next.js API Routes** as the primary request handler, supplemented by **Socket.IO mini-services** for real-time features:

- **API Gateway**: Caddy reverse proxy with SSL termination and automatic routing via `XTransformPort`
- **Authentication**: NextAuth.js v4 with custom OTP-based provider
- **ORM**: Prisma with SQLite for type-safe database access
- **AI Integration**: z-ai-web-dev-sdk for LLM chat, VLM image analysis, TTS, and ASR
- **80+ REST API Endpoints** covering all platform modules

### Database Design

The database schema includes **80+ models** across all platform modules, managed through Prisma ORM with SQLite:

| Category | Models | Est. Count |
|----------|--------|------------|
| Auth & Users | User, Session, Account, KYC, FamilyWallet | 8 |
| Wallets & Transactions | Wallet, WalletTransaction, FiatWallet, GoldWallet, Transfer | 5 |
| Gold Trading | GoldPrice, GoldTrade, GoldHold, AutoTrade, PriceAlert | 5 |
| Payments | Payment, PaymentGateway, ZarinpalTransaction | 3 |
| Merchant Gateway | Merchant, MerchantSettlement, Invoice, QRCode | 4 |
| Insurance | InsuranceCategory, InsuranceProvider, InsurancePlan, InsuranceOrder | 4 |
| Loans | Loan, LoanSettings, LoanRepayment | 3 |
| Savings & Goals | AutoSavePlan, SavingGoal, GoalContribution | 3 |
| Gamification | Achievement, UserAchievement, DailyCheckIn, PricePrediction, XPRecord, Quest | 6 |
| Chat & Support | ChatMessage, ChatFAQ, CannedResponse, Ticket | 4 |
| Content & Blog | BlogPost, BlogCategory, CMSPage, BlogComment | 4 |
| Gold Card | GoldCard, CardTransaction, CardDesign | 3 |
| VIP & Loyalty | VIPSubscription, CashbackReward, LoyaltyPoint, Referral | 4 |
| Social | SocialPost, PostComment, PostLike, CreatorContent | 4 |
| Gifts & Rewards | GoldGift, GiftRedemption | 2 |
| Marketing | SMSTemplate, SMSCampaign, EmailTemplate, EmailCampaign | 4 |
| Admin & Settings | SiteSettings, AdminRole, AdminPermission, Backup | 4 |
| AI Tools | AIConversation, MarketAnalysis, WealthCoachSession | 3 |
| Other | Notification, APILog, AuditLog, RateLimit, Captcha | 5 |

### API Gateway Pattern

All client requests pass through the Caddy reverse proxy, which routes traffic to the appropriate service using the `XTransformPort` query parameter. This allows multiple services to coexist behind a single exposed port while maintaining clean separation of concerns.

### WebSocket Real-time Engine

The platform uses Socket.IO for all real-time features, organized into logical rooms:

- **`user:{userId}`** — Private user-specific events (notifications, trade updates)
- **`gold:market`** — Public gold price broadcast (updated every second)
- **`chat:support:{ticketId}`** — Support chat rooms
- **`admin:dashboard`** — Admin real-time monitoring

---

# 5 | ماژول‌ها و امکانات / Modules & Features

## 🇮🇷 ماژول‌ها و امکانات

### ۵.۱ معاملات هسته‌ای طلا (Core Gold Trading)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| خرید لحظه‌ای | خرید طلا با قیمت لحظه‌ای بازار | `POST /api/gold/buy` + WebSocket price |
| فروش لحظه‌ای | فروش طلا با قیمت لحظه‌ای بازار | `POST /api/gold/sell` + ذخیره اضطراری |
| قیمت‌گذاری آنلاین | اتصال به منابع متعدد قیمت | Price Service + WebSocket streaming |
| نمودار پیشرفته | نمودار قیمت با تایم‌فریم‌های مختلف | Recharts + AdvancedGoldChart |
| محاسبه‌گر طلای هوشمند | محاسبه ارزش طلای فیزیکی | GoldCalculator component |
| هدیه طلایی | ارسال و دریافت هدیه طلایی | `POST /api/gifts/send` |
| فروش اضطراری | فروش سریع در شرایط بحرانی | EmergencySellButton |
| ردیابی موشک قیمت | نمایش روند حرکت قیمت | PriceMissileTracker |

### ۵.۲ کیف پول و پرداخت‌ها (Wallet & Payments)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| کیف پول ریالی | موجودی ریالی کاربر | FiatWallet model |
| کیف پول طلایی | موجودی طلایی بر حسب گرم | GoldWallet model |
| انتقال بین کاربران | انتقال طلا و ریال بین حساب‌ها | `POST /api/transfer/create` + OTP |
| انتقال به کیف پول طلایی | تبدیل ریال به طلا | `POST /api/gold/buy` |
| پرداخت زرین‌پال | اتصال به درگاه ZarinPal | Payment callbacks + verify |
| تاریخچه تراکنش‌ها | گزارش کامل تراکنش‌ها | TransactionsView + filters |

### ۵.۳ هوش مصنوعی و ابزارهای هوشمند (AI & Smart Tools)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| چت هوشمند پشتیبانی | پاسخگویی خودکار به سؤالات | z-ai-web-sdk LLM + ChatView |
| مشاور خرید هوشمند | پیشنهاد بهترین زمان خرید | SmartBuyAdvisor + AI analysis |
| مربی ثروت AI | مشاوره شخصی‌سازی‌شده سرمایه‌گذاری | AIWealthCoach + session history |
| فال طلایی | تحلیل نمادین و سرگرم‌کننده | GoldHoroscope component |
| اسکنر بازار طلا | تحلیل الگوهای بازار | GoldScanner + market data |
| چکاپ سلامت مالی | بررسی وضعیت مالی کاربر | HealthCheck component |
| تحلیل بازار AI | تحلیل هوشمند روند بازار | AIMarketAnalysis + LLM |
| پیام‌رسان صوتی | ضبط و تبدیل صدا به متن | VoiceRecorder + ASR |
| سؤالات متداول هوشمند | FAQ با جستجوی هوشمند | ChatFAQ + semantic search |

### ۵.۴ شبکه اجتماعی و گیمیفیکیشن (Social & Gamification)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| فید اجتماعی | اشتراک‌گذاری تجربیات و تحلیل‌ها | SocialFeedView + PostComment |
| چک‌این روزانه | پاداش برای ورود روزانه | DailyCheckIn + XP rewards |
| بازی پیش‌بینی قیمت | پیش‌بینی قیمت فردا و کسب امتیاز | PricePredictionGame + leaderboard |
| سیستم دستاوردها | نشان‌ها و مدال‌های افتخار | AchievementsView + UserAchievement |
| سیستم XP و لول | سطح‌بندی کاربران بر اساس فعالیت | XPRecord + LevelBadge |
| مأموریت طلایی | وظایف روزانه و هفتگی | GoldQuest + Quest tracking |
| باشگاه سازندگان محتوا | ایجاد محتوای آموزشی مالی | CreatorHub + rewards |
| جدول رده‌بندی | رتبه‌بندی کاربران فعال | Leaderboard across modules |

### ۵.۵ خدمات (Insurance, Utility, Car)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| بیمه شخص ثالث | خرید بیمه شخص ثالث خودرو | InsuranceForm + provider API |
| بیمه آتش‌سوزی | بیمه منازل و مشاغل | InsuranceCheckout |
| بیمه بدنه | بیمه بدنه خودرو | InsurancePlans comparison |
| بیمه عمر و زندگی | بیمه عمر و سرمایه‌گذاری | InsuranceCategories |
| شارژ سیم‌کارت | شارژ مستقیم ایرانسل، همراه اول، رایتل | `POST /api/utility/topup` |
| خرید بسته اینترنت | بسته‌های اینترنت اپراتورها | `POST /api/utility/internet` |
| پرداخت قبوض | قبوض آب، برق، گاز، تلفن | `POST /api/utility/bills` |
| سرویس خودرو | تعویض روغن، بیمه، معاینه فنی | CarServiceRequest + UserCar |

### ۵.۶ درگاه پذیرندگان (Merchant Gateway)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| ثبت‌نام پذیرنده | ایجاد حساب پذیرنده تجاری | `POST /api/gateway/merchant/register` |
| پرداخت با طلای دیجیتال | مشتریان با طلای دیجیتال پرداخت کنند | `POST /api/gateway/pay/create` |
| پرداخت با QR | اسکن QR برای پرداخت سریع | QrPaymentView |
| تسویه‌حساب | تسویه خودکار یا دستی | `POST /api/gateway/merchant/settlement` |
| پنل پذیرنده | مدیریت تراکنش‌ها و گزارش‌ها | MerchantPanel + MerchantDashboard |
| پورتال توسعه‌دهندگان | مستندات API و ابزارها | DeveloperPortal + ApiDocsView |
| افزونه وردپرس | پلاگین برای فروشگاه‌های وردپرسی | zarrin-gold-gateway.php |
| SDK چندزبانه | Node.js, Python, PHP | زرین گلد SDK |

### ۵.۷ پنل مدیریت (Admin Dashboard)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| داشبورد مدیریت | نمای کلی از وضعیت سیستم | AdminDashboard + charts |
| مدیریت کاربران | مشاهده و ویرایش حساب کاربران | AdminUsers + KYC review |
| مدیریت تراکنش‌ها | بررسی و تأیید تراکنش‌های مشکوک | AdminTransactions |
| مدیریت پذیرندگان | تأیید و مدیریت پذیرندگان | AdminMerchants |
| مدیریت محتوا | وبلاگ، CMS و صفحات | AdminBlog + AdminContent |
| مدیریت قیمت‌ها | تنظیم قیمت‌ها و اسپردها | AdminPrices |
| مدیریت گیمیفیکیشن | تنظیم دستاوردها و پاداش‌ها | AdminGamification |
| مدیریت بیمه | ارائه‌دهندگان و طرح‌ها | AdminInsurance |
| مدیریت وام | تنظیم شرایط وام | AdminLoans |
| مدیریت بازاریابی | پیامک و ایمیل کمپین | SMS + Email settings |
| مدیریت ربات تلگرام | تنظیم و نظارت ربات | TelegramBotAdmin |
| سیستم RBAC | نقش‌ها و دسترسی‌های مدیریتی | AdminRoles + permissions |
| پشتیبان‌گیری | ایجاد و بازیابی بکاپ | AdminBackups + scheduler |
| لاگ‌های امنیتی | نظارت بر فعالیت‌های مشکوک | AdminSecurity + audit |
| تنظیمات سایت | تنظیمات عمومی پلتفرم | AdminSettings |

### ۵.۸ زیرساخت و ابزارهای عمومی (Infrastructure)

| امکان | توضیحات | پیاده‌سازی فنی |
|--------|---------|----------------|
| کیف پول خانوادگی | مدیریت مالی خانواده | FamilyWalletView + members |
| پس‌انداز خودکار | خرید خودکار طلا | AutoSaveView + plans |
| اهداف پس‌انداز | تعریف اهداف مالی | SavingGoalsView |
| کارت طلایی | کارت نقدی مجازی/فیزیکی | GoldCardView |
| ابر طلایی | انبار امن طلای فیزیکی | GoldVaultView |
| عضویت VIP | سطوح مختلف اعضای ویژه | VIPMembershipView |
| سیستم کاش‌بک | بازگشت وجه خریدها | CashbackCenter |
| سیستم دعوت از دوستان | کمیسیون معرفی | ReferralView |
| سیستم وفاداری | امتیاز وفاداری | LoyaltyView |
| مرکز آموزش | محتوای آموزشی مالی | EducationCenter |
| لاگین با رمز یکبار مصرف | OTP-based authentication | LoginDialog + send-otp |
| احراز هویت KYC | تأیید هویت سه‌مرحله‌ای | KYCWizard |
| احراز هویت ادمین | ورود امن مدیران | Admin login + 2FA |
| نوتیفیکیشن‌ها | اعلان‌های درون‌برنامه‌ای | NotificationsView + push |
| آلارم قیمت | هشدار رسیدن به قیمت دلخواه | PriceAlarmWidget |

---

## 🇬🇧 Modules & Features

### 5.1 Core Gold Trading

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Instant Buy | Buy gold at real-time market price | `POST /api/gold/buy` + WebSocket price feed |
| Instant Sell | Sell gold at real-time market price | `POST /api/gold/sell` + emergency hold |
| Live Pricing | Multi-source price aggregation | Price Service + WebSocket streaming |
| Advanced Charts | Multi-timeframe candlestick/line charts | Recharts + AdvancedGoldChart component |
| Smart Gold Calculator | Physical gold value calculator | GoldCalculator with live rates |
| Gold Gifts | Send and receive gold gifts | `POST /api/gifts/send` |
| Emergency Sell | Fast liquidation during crises | EmergencySellButton with safety checks |
| Price Missile Tracker | Visual price trend indicator | PriceMissileTracker component |

### 5.2 Wallet & Payments

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Fiat Wallet | Rial/Toman balance management | FiatWallet model |
| Gold Wallet | Gold balance in grams | GoldWallet model |
| Peer-to-Peer Transfer | Send gold/rial between users | `POST /api/transfer/create` + OTP verification |
| Fiat-to-Gold Conversion | Buy gold from fiat wallet | `POST /api/gold/buy` |
| ZarinPal Integration | Iranian payment gateway connection | Payment callbacks + verification |
| Transaction History | Full transaction audit trail | TransactionsView with filters |

### 5.3 AI & Smart Tools

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Smart Support Chat | Automated customer support | z-ai-web-sdk LLM + ChatView |
| Smart Buy Advisor | Best-time-to-buy recommendations | SmartBuyAdvisor + AI market analysis |
| AI Wealth Coach | Personalized investment coaching | AIWealthCoach + session persistence |
| Gold Horoscope | Entertaining symbolic analysis | GoldHoroscope component |
| Gold Market Scanner | Pattern recognition & analysis | GoldScanner + market data feeds |
| Financial Health Check | User financial assessment | HealthCheck component |
| AI Market Analysis | Intelligent market trend analysis | AIMarketAnalysis + LLM inference |
| Voice Messenger | Voice recording with speech-to-text | VoiceRecorder + z-ai-web-sdk ASR |
| Smart FAQ | Intelligent FAQ search | ChatFAQ + semantic search |

### 5.4 Social & Gamification

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Social Feed | Share experiences and analyses | SocialFeedView + PostComment |
| Daily Check-in | Daily login rewards | DailyCheckIn + XP distribution |
| Price Prediction Game | Predict tomorrow's price | PricePredictionGame + leaderboard |
| Achievement System | Badges and medals | AchievementsView + UserAchievement |
| XP & Level System | Activity-based user leveling | XPRecord + LevelBadge display |
| Gold Quests | Daily & weekly missions | GoldQuest + Quest tracking |
| Creator Club | User-generated financial content | CreatorHub + reward distribution |
| Leaderboards | Active user rankings | Cross-module leaderboard system |

### 5.5 Services (Insurance, Utility, Car)

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Third-party Insurance | Auto liability insurance | InsuranceForm + provider API |
| Fire Insurance | Home and business coverage | InsuranceCheckout |
| Body Insurance | Comprehensive auto insurance | InsurancePlans comparison |
| Life Insurance | Life and investment insurance | InsuranceCategories |
| SIM Top-up | Direct mobile recharge (MCI, MTN, RighTel) | `POST /api/utility/topup` |
| Internet Packages | Mobile data packages | `POST /api/utility/internet` |
| Bill Payment | Utility bill payments | `POST /api/utility/bills` |
| Car Services | Oil change, insurance, vehicle inspection | CarServiceRequest + UserCar manager |

### 5.6 Merchant Gateway

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Merchant Registration | Business account creation | `POST /api/gateway/merchant/register` |
| Digital Gold Payments | Accept gold as payment | `POST /api/gateway/pay/create` |
| QR Payments | Scan QR code for quick payments | QrPaymentView component |
| Settlements | Auto/manual merchant payouts | `POST /api/gateway/merchant/settlement` |
| Merchant Panel | Transaction management | MerchantPanel + MerchantDashboard |
| Developer Portal | API docs and tools | DeveloperPortal + ApiDocsView |
| WordPress Plugin | E-commerce integration | zarrin-gold-gateway.php |
| Multi-language SDK | Node.js, Python, PHP | Zaringold SDK packages |

### 5.7 Admin Dashboard

A comprehensive management panel with **15+ admin pages** covering:

- **Dashboard** — System overview with real-time metrics and charts
- **User Management** — User listing, KYC review, account controls
- **Transaction Management** — Suspicious transaction review and approval
- **Merchant Management** — Merchant verification and fee configuration
- **Content Management** — Blog, CMS pages, and landing page builder
- **Price Management** — Spread configuration and price source management
- **Gamification Admin** — Achievement creation, quest configuration
- **Insurance Admin** — Provider management and plan configuration
- **Loan Management** — Loan settings, interest rates, approval
- **Marketing** — SMS/email campaigns, templates, blacklists
- **Telegram Bot** — Bot configuration and monitoring
- **RBAC System** — Role and permission management
- **Backup** — Automated backup scheduling and restoration
- **Security Logs** — Audit trail and suspicious activity monitoring
- **Site Settings** — Platform-wide configuration management

### 5.8 Infrastructure & General Tools

| Feature | Description | Technical Implementation |
|---------|-------------|------------------------|
| Family Wallet | Multi-member family finance | FamilyWalletView + member roles |
| Auto-Save | Automated gold purchases | AutoSaveView + scheduled plans |
| Savings Goals | Financial goal setting & tracking | SavingGoalsView |
| Gold Card | Virtual/physical debit card | GoldCardView + PIN management |
| Gold Vault | Secure physical gold storage | GoldVaultView + audit trail |
| VIP Membership | Tiered premium membership | VIPMembershipView |
| Cashback System | Purchase reward program | CashbackCenter |
| Referral System | Invitation commission | ReferralView |
| Loyalty Program | Loyalty point accumulation | LoyaltyView |
| Education Center | Financial literacy content | EducationCenter |
| OTP Authentication | SMS-based login | LoginDialog + send-otp |
| KYC Verification | Three-stage identity verification | KYCWizard |
| Admin Authentication | Secure admin login | Admin login + 2FA |
| Notifications | In-app notification system | NotificationsView + push |
| Price Alerts | Custom price threshold alerts | PriceAlarmWidget |

---

# 6 | طراحی رابط کاربری / UI/UX Design

## 🇮🇷 طراحی رابط کاربری

### سیستم طراحی (Design System)

```
┌─────────────────────────────────────────────────────────┐
│                  Zaringold Design System                 │
│                                                           │
│  Colors:                                                  │
│  ├── Primary Gold:    #D4AF37 (زرین طلایی)              │
│  ├── Dark Gold:       #B8860B                           │
│  ├── Light Gold:      #F5E6B8                           │
│  ├── Background:      #FFFFFF (Light) / #0A0A0A (Dark)  │
│  ├── Surface:         rgba(255,255,255,0.05) (Glass)     │
│  ├── Text Primary:    #171717 (Light) / #FAFAFA (Dark)  │
│  ├── Success:         #22C55E                           │
│  ├── Danger:          #EF4444                           │
│  └── Warning:         #F59E0B                           │
│                                                           │
│  Typography:                                             │
│  ├── Primary Font:   IRANSansWeb (Persian)              │
│  ├── Fallback Font:  Inter / System UI (English)        │
│  ├── Scale:          xs(12) sm(14) base(16)             │
│  │                   lg(18) xl(20) 2xl(24)              │
│  │                   3xl(30) 4xl(36)                    │
│  └── Line Height:    1.5 (Persian) / 1.6 (English)     │
│                                                           │
│  Spacing:                                                │
│  └── Scale: 4 8 12 16 20 24 32 40 48 64                 │
│                                                           │
│  Border Radius:                                           │
│  ├── sm: 6px   (badges, small elements)                  │
│  ├── md: 8px   (buttons, inputs)                         │
│  ├── lg: 12px  (cards, dialogs)                          │
│  ├── xl: 16px  (panels, modals)                          │
│  └── 2xl: 24px (feature sections)                        │
│                                                           │
│  Shadows:                                                │
│  ├── Glass:     0 8px 32px rgba(0,0,0,0.08)             │
│  ├── Card:      0 1px 3px rgba(0,0,0,0.1)               │
│  └── Elevated:  0 10px 40px rgba(0,0,0,0.15)            │
└─────────────────────────────────────────────────────────┘
```

### اصول طراحی

| اصل | توضیحات |
|-----|---------|
| **موبایل اول** | طراحی ابتدا برای موبایل، سپس واکنش‌گرا برای دسکتاپ |
| **حس اپلیکیشن** | تجربه‌ای شبیه اپلیکیشن‌های موبایل با Bottom Navigation و Swipe |
| **RTL اولیه** | رابط کاربری فارسی به‌صورت پیش‌فرض با پشتیبانی انگلیسی |
| **Glass-morphism** | استفاده از افکت‌های شیشه‌ای برای عمق بصری |
| **تم روشن/تاریک** | پشتیبانی کامل از هر دو تم با Theme Switcher |
| **انیمیشن ملایم** | Framer Motion برای ترنزیشن‌ها و میکرو-تعاملات |
| **لمس بهینه** | ابعاد حداقل ۴۴px برای المان‌های تعاملی |

### الگوهای طراحی کلیدی

#### ۱. صفحه اصلی (Dashboard)

```
┌─────────────────────────────────┐
│  Header (آواتار + سلام + اعلان) │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │   کیف پول طلایی (گرم)     │  │
│  │   ████ 2.5 گرم            │  │
│  │   قیمت: ████████ 85,000   │  │
│  │   [+خرید] [+فروش]         │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │   📊 قیمت لحظه‌ای طلا     │  │
│  │   ████████████████████    │  │
│  │   نمودار خطی →            │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  دسترسی سریع (Quick Actions)    │
│  [💳 کارت] [🎯 اهداف] [🎁 هدیه]│
├─────────────────────────────────┤
│  [🏠] [📊] [💳] [💬] [👤]      │
│  Bottom Navigation               │
└─────────────────────────────────┘
```

#### ۲. صفحه معامله (Trade View)

```
┌─────────────────────────────────┐
│  ← معامله طلا                   │
├─────────────────────────────────┤
│  ┌──────┐  ┌──────┐            │
│  │ خرید │  │فروش  │ ← Tabs     │
│  └──────┘  └──────┘            │
├─────────────────────────────────┤
│  مقدار (گرم):                   │
│  [____1.0____] [- ] [+]        │
│  ─────────────                  │
│  مبلغ پرداختی: 85,000,000 ریال │
│  قیمت هر گرم: 85,000,000 ریال  │
├─────────────────────────────────┤
│  قیمت لحظه‌ای:                  │
│  ████████████████████████████   │
│  نمودار ۲۴ ساعته                │
├─────────────────────────────────┤
│  [مشاور خرید هوشمند 🤖]        │
├─────────────────────────────────┤
│  [       تأیید معامله        ]  │
└─────────────────────────────────┘
```

#### ۳. سیستم تم (Theme System)

```css
/* سیستم تم دوگانه */
:root {
  /* Light Theme */
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 9%;
  --primary: 43 74% 49%;       /* Gold #D4AF37 */
  --primary-foreground: 0 0% 100%;
  --muted: 0 0% 96%;
  --border: 0 0% 90%;
}

.dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 98%;
  --card: 0 0% 7%;
  --card-foreground: 0 0% 98%;
  --primary: 43 74% 49%;       /* Gold #D4AF37 */
  --primary-foreground: 0 0% 4%;
  --muted: 0 0% 14%;
  --border: 0 0% 18%;
}
```

### دسترسی‌پذیری (Accessibility)

| استاندارد | پیاده‌سازی |
|-----------|------------|
| WCAG 2.1 AA | کنتراست رنگ مناسب در تمام المان‌ها |
| Navigation | پشتیبانی کامل از کیبورد (Tab, Enter, Escape) |
| Screen Readers | ARIA labels و roles برای تمام المان‌ها |
| RTL Support | dir="rtl" و خواص منطقی CSS |
| Touch Targets | حداقل 44x44px برای عناصر تعاملی |
| Font Scaling | پشتیبانی از بزرگ‌نمایی تا ۲۰۰٪ |
| Motion | احترام به تنظیمات prefers-reduced-motion |

---

## 🇬🇧 UI/UX Design

### Design System

The Zaringold design system follows a **glass-morphism** aesthetic with a **gold (#D4AF37)** accent color, creating a premium financial experience:

- **Colors**: Gold accent with warm neutrals, full dark/light theme support via CSS custom properties
- **Typography**: IRANSansWeb (Persian) + Inter (English) with a consistent scale from xs (12px) to 4xl (36px)
- **Spacing**: 4px base unit scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Border Radius**: Progressive rounding from sm (6px) to 2xl (24px)
- **Shadows**: Glass, card, and elevated shadow levels for visual depth

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Mobile-First** | Design for mobile screens first, then progressively enhance for tablet and desktop |
| **App-Like Feel** | Native app experience with bottom navigation, swipe gestures, and pull-to-refresh |
| **RTL-First** | Persian interface as default with seamless English LTR support |
| **Glass-morphism** | Translucent backgrounds with backdrop blur for visual depth |
| **Dark/Light Theme** | Full theme support with next-themes and smooth transitions |
| **Subtle Animation** | Framer Motion for page transitions, micro-interactions, and loading states |
| **Touch-Optimized** | Minimum 44px touch targets, swipe gestures, and haptic feedback |

### Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `default` | 0–639px | Mobile (primary) |
| `sm` | 640px+ | Large phones |
| `md` | 768px+ | Tablets |
| `lg` | 1024px+ | Laptops |
| `xl` | 1280px+ | Desktops |

### Accessibility Compliance

The platform adheres to **WCAG 2.1 AA** standards including proper color contrast, full keyboard navigation, ARIA labels, RTL text direction support, and motion reduction preferences.

---

# 7 | امنیت و حریم خصوصی / Security & Privacy

## 🇮🇷 امنیت و حریم خصوصی

### معماری امنیتی

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Architecture                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 1: Network Security                          │  │
│  │  • SSL/TLS Encryption (Caddy)                        │  │
│  │  • DDoS Protection                                  │  │
│  │  • Rate Limiting                                    │  │
│  │  • CORS Policy                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 2: Authentication & Authorization             │  │
│  │  • OTP-based Login (SMS)                             │  │
│  │  • JWT Token Management                              │  │
│  │  • Session Management (NextAuth.js)                  │  │
│  │  • RBAC (Role-Based Access Control)                  │  │
│  │  • Admin 2FA                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 3: Identity Verification                      │  │
│  │  • KYC Level 1: Phone + Name                         │  │
│  │  • KYC Level 2: National ID + Selfie                │  │
│  │  • KYC Level 3: Financial Documents                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 4: Data Protection                            │  │
│  │  • Database Encryption at Rest                       │  │
│  │  • Sensitive Field Encryption (AES-256)             │  │
│  │  • Secure File Storage                              │  │
│  │  • Audit Logging                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 5: Fraud Detection & Prevention               │  │
│  │  • Transaction Pattern Analysis                      │  │
│  │  • Velocity Checks                                   │  │
│  │  • IP Reputation Scoring                             │  │
│  │  • Device Fingerprinting                             │  │
│  │  • Smart CAPTCHA                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### احراز هویت (Authentication)

| مکانیزم | توضیحات |
|---------|---------|
| **OTP ورود** | ارسال رمز یکبار مصرف به شماره موبایل |
| **JWT** | توکن دسترسی با زمان انقضای قابل تنظیم |
| **Session** | مدیریت نشست با NextAuth.js و ذخیره امن |
| **Password Login** | ورود با رمز عبور (برای ادمین) |
| **Admin 2FA** | تأیید دو مرحله‌ای برای مدیران |

### تطبیق KYC/AML

```
سطوح تأیید هویت:
┌─────────────┬──────────────────┬────────────────┐
│    سطح     │     مستندات       │     محدودیت‌ها    │
├─────────────┼──────────────────┼────────────────┤
│ Level 0     │ شماره موبایل     │ مشاهده فقط     │
│ Level 1     │ نام و نام خانوادگی│ معامله تا ۵ گرم│
│ Level 2     │ کد ملی + سلفی    │ معامله تا ۵۰ گرم│
│ Level 3     │ مدارک مالی        │ بدون محدودیت   │
└─────────────┴──────────────────┴────────────────┘
```

### رمزنگاری داده‌ها (Data Encryption)

| نوع داده | روش رمزنگاری |
|----------|-------------|
| رمز عبور | bcrypt (cost factor: 12) |
| اطلاعات حساس | AES-256-GCM |
| توکن‌ها | JWT RS256 |
| اتصال | TLS 1.3 |
| فایل‌ها | Encryption at rest |

### محدودیت نرخ (Rate Limiting)

| اندپوینت | محدودیت |
|----------|--------|
| احراز هویت | ۵ درخواست در دقیقه |
| معاملات | ۳۰ درخواست در دقیقه |
| API عمومی | ۱۰۰ درخواست در دقیقه |
| WebSocket | ۱۰ پیام در ثانیه |

---

## 🇬🇧 Security & Privacy

### Security Architecture

The platform implements a **5-layer security architecture**:

1. **Network Security** — SSL/TLS via Caddy, DDoS protection, rate limiting, CORS policy
2. **Authentication & Authorization** — OTP login, JWT tokens, NextAuth.js sessions, RBAC, admin 2FA
3. **Identity Verification** — Three-level KYC (phone → national ID → financial docs)
4. **Data Protection** — Database encryption, AES-256 field-level encryption, audit logging
5. **Fraud Detection** — Pattern analysis, velocity checks, IP reputation, device fingerprinting, smart CAPTCHA

### Authentication Flow

```
User enters phone → OTP sent via SMS → User enters OTP
→ Server validates → JWT issued → Session created
→ User redirected to appropriate level
```

### KYC Compliance

| Level | Requirements | Transaction Limits |
|-------|-------------|-------------------|
| Level 0 | Phone number | View-only |
| Level 1 | Full name | Up to 5g |
| Level 2 | National ID + Selfie | Up to 50g |
| Level 3 | Financial documents | Unlimited |

### Data Encryption

| Data Type | Encryption Method |
|-----------|-------------------|
| Passwords | bcrypt (cost factor: 12) |
| Sensitive Fields | AES-256-GCM |
| Tokens | JWT RS256 |
| Connections | TLS 1.3 |
| File Storage | Encryption at rest |

---

# 8 | زیرساخت فنی / Technical Infrastructure

## 🇮🇷 زیرساخت فنی

### معماری سرور

```
┌───────────────────────────────────────────────────────────────┐
│                    Server Architecture                         │
│                                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                   Production Server                     │   │
│  │                                                        │   │
│  │  ┌─────────────┐    ┌──────────────┐                  │   │
│  │  │   Caddy     │    │   Bun        │                  │   │
│  │  │   (:443)    │───▶│   Runtime    │                  │   │
│  │  └─────────────┘    └──────┬───────┘                  │   │
│  │                            │                           │   │
│  │  ┌─────────────────────────┼──────────────────────┐   │   │
│  │  │                         │                      │   │   │
│  │  │  ┌──────────┐  ┌───────▼──────┐  ┌──────────┐  │   │   │
│  │  │  │  Next.js  │  │Chat Service  │  │  Price   │  │   │   │
│  │  │  │  (:3000)  │  │  (:3001)     │  │ (:3002)  │  │   │   │
│  │  │  └──────────┘  └──────────────┘  └──────────┘  │   │   │
│  │  │                         Mini Services          │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │              Data Layer                         │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │   │
│  │  │  │  SQLite  │  │  Upload  │  │  Logs    │    │    │   │
│  │  │  │   DB     │  │  Storage │  │  (/var)  │    │    │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘    │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Monitoring & Maintenance                    │   │
│  │  • Watchdog (auto-restart on crash)                    │   │
│  │  • Health Check endpoint (/api/health)                 │   │
│  │  • Daily/Weekly automated backups                      │   │
│  │  • Dev log rotation                                    │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### لوله CI/CD

```
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│  Push  │───▶│  Test  │───▶│  Build │───▶│ Deploy │───▶│ Verify │
│  Code  │    │  Lint  │    │ Bundle │    │ Server │    │ Health │
└────────┘    └────────┘    └────────┘    └────────┘    └────────┘
```

| مرحله | ابزار | عملیات |
|--------|------|--------|
| Test | ESLint + TypeScript | بررسی کیفیت کد |
| Build | Next.js Build | ساخت بهینه‌شده |
| Deploy | Shell Scripts | استقرار خودکار |
| Verify | Health Check | تأیید سلامت سرویس |

### پشتیبان‌گیری و بازیابی

| نوع بکاپ | فرکانس | مکان ذخیره |
|----------|--------|------------|
| بکاپ روزانه | هر روز ساعت ۱۵:۳۰ | `db/backups/daily-*` |
| بکاپ هفتگی | هر سه‌شنبه ساعت ۱۵:۳۰ | `db/backups/weekly-*` |
| فایل متادیتا | هر بکاپ | `db/backups/backup-meta.json` |

### نقشه مقیاس‌پذیری

```
Phase 1 (Current): Single Server
├── Bun Runtime
├── SQLite (single file)
├── Memory Cache
└── File Storage

Phase 2 (Growth): Horizontal Scaling
├── Load Balancer
├── Multiple App Servers
├── PostgreSQL Migration
├── Redis Cache
└── Object Storage (S3-compatible)

Phase 3 (Scale): Microservices
├── Kubernetes Orchestration
├── Service Mesh
├── Event-Driven Architecture
├── CDN for Static Assets
└── Multi-region Deployment
```

---

## 🇬🇧 Technical Infrastructure

### Server Architecture

The platform runs on a single server with the **Bun runtime** for optimal JavaScript/TypeScript performance:

- **Reverse Proxy**: Caddy handles SSL termination, static assets, and WebSocket upgrades
- **Application Server**: Next.js 16 serving SSR pages and API routes on port 3000
- **Mini Services**: Socket.IO services for real-time chat (3001) and price streaming (3002)
- **Database**: SQLite with Prisma ORM for type-safe data access
- **Process Management**: Custom watchdog scripts for automatic crash recovery

### CI/CD Pipeline

| Stage | Tool | Operation |
|-------|------|-----------|
| Test | ESLint + TypeScript | Code quality check |
| Build | Next.js Build | Optimized production bundle |
| Deploy | Shell Scripts | Automated deployment |
| Verify | Health Check | Service health verification |

### Backup & Recovery

| Type | Frequency | Storage Location |
|------|-----------|-----------------|
| Daily Backup | Every day at 3:30 PM | `db/backups/daily-*` |
| Weekly Backup | Every Wednesday at 3:30 PM | `db/backups/weekly-*` |
| Metadata | Every backup | `db/backups/backup-meta.json` |

### Scalability Plan

| Phase | Architecture | Capacity |
|-------|-------------|----------|
| **Current** | Single server, SQLite, memory cache | Up to 10K concurrent users |
| **Growth** | Load balancer, PostgreSQL, Redis | Up to 100K concurrent users |
| **Scale** | Kubernetes, event-driven, CDN | 1M+ concurrent users |

---

# 9 | تحلیل بازار / Market Analysis

## 🇮🇷 تحلیل بازار

### اندازه بازار

| شاخص | مقدار |
|--------|------|
| حجم معاملات سالانه طلا در ایران | ۳۰+ میلیارد دلار |
| تعداد طلافروشی‌های فعال | ۱۲,۰۰۰+ |
| تعداد سرمایه‌گذاران خرد بالقوه | ۱۵+ میلیون نفر |
| رشد بازار فین‌تک ایران | ۳۵٪ سالانه (CAGR) |
| نفوذ اینترنت موبایل | ۷۰٪+ جمعیت |
| نفوذ اینترنت پهن‌باند | ۸۰٪+ خانوارهای شهری |

### دموگرافی هدف

```
توزیع سنی مخاطبان هدف:
┌────────────────────────────────────────┐
│  ۱۸-۲۴ سال    ██████████████████ 35% │
│  ۲۵-۳۴ سال    ████████████████ 30%   │
│  ۳۵-۴۴ سال    ██████████ 20%          │
│  ۴۵-۵۴ سال    █████ 10%              │
│  ۵۵+ سال      ██ 5%                  │
└────────────────────────────────────────┘

توزیع جغرافیایی:
┌────────────────────────────────────────┐
│  تهران          ██████████████ 45%    │
│  کلان‌شهرها     ██████████ 30%       │
│  شهرهای متوسط  ████████ 20%         │
│  روستاها/شهرک   ██ 5%               │
└────────────────────────────────────────┘
```

### رقبا و موقعیت

| رقیب | نوع | مزایا | ضعف‌ها |
|------|-----|-------|--------|
| طلافروشی‌های سنتی | فیزیکی | اعتماد بالا، لمس طلا | قیمت بالا، ساعات محدود |
| صندوق‌های طلای بورس | سنتی-دیجیتال | شفافیت | حداقل سرمایه بالا، پیچیدگی |
| بورس کالا | حکومتی | قانونی | غیرقابل دسترس برای عموم |
| اپلیکیشن‌های محدود | دیجیتال | راحتی | امکانات محدود، عدم اعتماد |
| **زرین گلد** | **دیجیتال جامع** | **تمام امکانات** | **نیاز به رشد برند** |

### روندهای بازار

1. **طلای دیجیتال** — رشد سریع توکن‌های پشتوانه طلا
2. **تحول دیجیتال** — افزایش استفاده از موبایل بانکینگ
3. **تورم** — تمایل بیشتر به سرمایه‌گذاری در طلای واقعی
4. **نسل Z** — علاقه‌مندی فزاینده به فین‌تک
5. **وب ۳** — پتانسیل بلاکچین در شفافیت معاملات

---

## 🇬🇧 Market Analysis

### Market Size

| Metric | Value |
|--------|-------|
| Annual Gold Trading Volume (Iran) | $30+ Billion |
| Active Jewelry Shops | 12,000+ |
| Potential Retail Investors | 15+ Million |
| Iran Fintech Market Growth | 35% CAGR |
| Mobile Internet Penetration | 70%+ of population |
| Broadband Penetration | 80%+ urban households |

### Target Demographics

```
Age Distribution:
┌────────────────────────────────────────┐
│  18-24        ██████████████████ 35%   │
│  25-34        ████████████████ 30%     │
│  35-44        ██████████ 20%           │
│  45-54        █████ 10%                │
│  55+          ██ 5%                    │
└────────────────────────────────────────┘

Geographic Distribution:
┌────────────────────────────────────────┐
│  Tehran          ██████████████ 45%    │
│  Metro Cities    ██████████ 30%       │
│  Mid-size Cities ████████ 20%         │
│  Rural/Small     ██ 5%               │
└────────────────────────────────────────┘
```

### Competitive Landscape

| Competitor | Type | Strengths | Weaknesses |
|-----------|------|-----------|------------|
| Traditional Jewelers | Physical | High trust, physical gold | High prices, limited hours |
| Exchange Gold Funds | Semi-digital | Transparency | High minimum investment |
| Commodity Exchange | Government | Legal | Inaccessible to public |
| Limited Apps | Digital | Convenience | Limited features, trust issues |
| **Zaringold** | **Comprehensive Digital** | **All features integrated** | **Brand building needed** |

### Market Trends

1. **Digital Gold** — Rapid growth in gold-backed tokens globally
2. **Digital Transformation** — Increasing mobile banking adoption
3. **Inflation Hedge** — Growing preference for gold as inflation hedge
4. **Gen Z Adoption** — Rising fintech interest among younger demographics
5. **Web3 Integration** — Blockchain potential for transaction transparency

---

# 10 | مدل درآمدی / Revenue Model

## 🇮🇷 مدل درآمدی

### جریان‌های درآمدی

| منبع درآمد | مدل | درصد تخمینی از کل درآمد |
|------------|------|------------------------|
| کارمزد معاملات | ۰.۳٪ تا ۰.۷٪ هر معامله | ۴۰٪ |
| حق اشتراک VIP | ۹۹,۰۰۰ تا ۴۹۹,۰۰۰ ریال/ماه | ۲۰٪ |
| کارمزد درگاه پذیرندگان | ۰.۵٪ تا ۱.۵٪ هر تراکنش | ۱۵٪ |
| حق دسترسی API | ۴۹,۰۰۰ تا ۴۹۹,۰۰۰ ریال/ماه | ۱۰٪ |
| کارمزد برداشت | ۰.۱٪ برداشت ریالی | ۸٪ |
| تبلیغات و پروموشن | هزینه پروموشن پذیرندگان | ۵٪ |
| سایر خدمات | بیمه، کارت، خدمات کارو | ۲٪ |

### سطوح عضویت VIP

| سطح | قیمت ماهانه | مزایا |
|-----|-------------|-------|
| **برنزی (Bronze)** | ۹۹,۰۰۰ ریال | کارمزد ۰.۳٪، آلارم ۵ قیمت |
| **نقره‌ای (Silver)** | ۱۹۹,۰۰۰ ریال | کارمزد ۰.۲۵٪، آلارم ۲۰ قیمت، مربی AI |
| **طلایی (Gold)** | ۲۹۹,۰۰۰ ریال | کارمزد ۰.۲٪، نامحدود آلارم، مربی AI پیشرفته |
| **الماسی (Diamond)** | ۴۹۹,۰۰۰ ریال | کارمزد ۰.۱۵٪، تمام امکانات، پشتیبانی اختصاصی |

### پیش‌بینی مالی (۳ سال آینده)

```
                    ┌────────────────────────────────────────────┐
                    │       Revenue Projection (Billion IRR)     │
                    │                                            │
     ۱۲۰ ───────────┤                                    ████    │
                    │                                      ████  │
      ۸۰ ───────────┤                                ████      │
                    │                                  ████    │
      ۴۰ ───────────┤                          ████          │
                    │                            ████        │
       ۰ ───────────┤    ████              ████              │
                    │      ████            ████                │
                    │        ████        ████                  │
                    └────────┴────────┴────────┴────────────────┤
                        Year 1     Year 2     Year 3
```

| سال | تعداد کاربران | درآمد (میلیارد ریال) | هزینه‌ها | سود خالص |
|-----|-------------|---------------------|---------|----------|
| سال ۱ | ۱۰,۰۰۰ | ۴۰ | ۳۵ | ۵ |
| سال ۲ | ۵۰,۰۰۰ | ۸۰ | ۵۵ | ۲۵ |
| سال ۳ | ۲۰۰,۰۰۰ | ۱۲۰ | ۷۰ | ۵۰ |

---

## 🇬🇧 Revenue Model

### Revenue Streams

| Source | Model | Estimated % of Total |
|--------|-------|---------------------|
| Transaction Fees | 0.3%–0.7% per trade | 40% |
| VIP Subscriptions | 99K–499K IRR/month | 20% |
| Merchant Gateway Fees | 0.5%–1.5% per transaction | 15% |
| API Access Fees | 49K–499K IRR/month | 10% |
| Withdrawal Fees | 0.1% fiat withdrawal | 8% |
| Advertising & Promotions | Merchant promotion fees | 5% |
| Auxiliary Services | Insurance, card, auto services | 2% |

### VIP Membership Tiers

| Tier | Monthly Price | Benefits |
|------|--------------|----------|
| **Bronze** | 99,000 IRR | 0.3% fee, 5 price alerts |
| **Silver** | 199,000 IRR | 0.25% fee, 20 alerts, AI Coach |
| **Gold** | 299,000 IRR | 0.2% fee, unlimited alerts, advanced AI |
| **Diamond** | 499,000 IRR | 0.15% fee, all features, dedicated support |

### Financial Projection (3 Years)

| Year | Users | Revenue (B IRR) | Costs (B IRR) | Net Profit (B IRR) |
|------|-------|-----------------|---------------|-------------------|
| Year 1 | 10,000 | 40 | 35 | 5 |
| Year 2 | 50,000 | 80 | 55 | 25 |
| Year 3 | 200,000 | 120 | 70 | 50 |

---

# 11 | نقشه راه توسعه / Development Roadmap

## 🇮🇷 نقشه راه توسعه

### فاز ۱: MVP ✅ (تکمیل‌شده)

> **وضعیت: تکمیل شده** | **نسخه: v1.0 – v2.0**

| ماژول | وضعیت | جزئیات |
|-------|-------|--------|
| احراز هویت OTP | ✅ | ورود با شماره موبایل + رمز یکبار مصرف |
| کیف پول ریالی و طلایی | ✅ | کیف پول دوگانه با تاریخچه تراکنش‌ها |
| خرید و فروش طلا | ✅ | معاملات لحظه‌ای با قیمت آنلاین |
| اتصال به ZarinPal | ✅ | درگاه پرداخت بانکی |
| پروفایل کاربر | ✅ | اطلاعات شخصی و تنظیمات |
| داشبورد مدیریتی | ✅ | پنل مدیریت جامع |
| وبلاگ و CMS | ✅ | سیستم مدیریت محتوا |

### فاز ۲: رشد 🔄 (فعلی)

> **وضعیت: در حال توسعه** | **نسخه: v2.1 – v2.9.4**

| ماژول | وضعیت | جزئیات |
|-------|-------|--------|
| هوش مصنوعی | ✅ | چت هوشمند، مشاور خرید، مربی ثروت |
| گیمیفیکیشن | ✅ | XP، لول، دستاوردها، چک‌این، پیش‌بینی |
| درگاه پذیرندگان | ✅ | پرداخت طلایی، QR، تسویه |
| بیمه | ✅ | شخص ثالث، آتش‌سوزی، بدنه |
| کارت طلایی | ✅ | کارت مجازی با طراحی شخصی‌سازی |
| خدمات کارو و قبوض | ✅ | شارژ، بسته اینترنت، قبوض، خودرو |
| باشگاه سازندگان | ✅ | محتوای تولیدی کاربران |
| شبکه اجتماعی | ✅ | فید اجتماعی و تعامل |
| کیف پول خانوادگی | ✅ | مدیریت مالی خانواده |
| ابر طلایی | ✅ | انبار امن طلا |
| سیستم وفاداری | ✅ | کاش‌بک و امتیاز |
| SDK و API | ✅ | Node.js, Python, PHP, WordPress |
| VIP و عضویت | ✅ | ۴ سطح عضویت ویژه |

### فاز ۳: گسترش 📋 (آینده)

> **وضعیت: برنامه‌ریزی‌شده** | **نسخه: v3.0 – v3.9**

| ماژول | اولویت | جزئیات |
|-------|-------|--------|
| اپلیکیشن موبایل (React Native) | بالا | نسخه iOS و Android بومی |
| صندوق سرمایه‌گذاری | بالا | صندوق طلای مشترک |
| معاملات P2P | بالا | معاملات مستقیم بین کاربران |
| بازار NFT طلایی | متوسط | توکن‌های هنری طلایی |
| اپلیکیشن تلگرام | متوسط | ربات تلگرام پیشرفته |
| اتصال به بلاکچین | بالا | شفافیت معاملات با بلاکچین |
| وام بر اساس طلای دیجیتال | بالا | وام با وثیقه طلای حساب |
| کارت فیزیکی طلایی | متوسط | صدور کارت فیزیکی |

### فاز ۴: اکوسیستم 🌐 (چشم‌انداز)

> **وضعیت: تحقیقاتی** | **نسخه: v4.0+**

| ماژول | جزئیات |
|-------|--------|
| زرین گلد اکسچنج | صرافی آنلاین طلا و ارز |
| API Marketplace | بازار API شخص ثالث |
| White-label Solution | راه‌حل آماده برای کسب‌وکارها |
| بین‌المللی‌سازی | گسترش به کشورهای منطقه |
| بانک طلایی دیجیتال | خدمات بانکی مبتنی بر طلا |
| دفتر کل توزیع‌شده (DLT) | فناوری دفتر کل برای شفافیت کامل |

### نمودار زمانی

```
2024 Q3-Q4          2025 Q1-Q2          2025 Q3-Q4          2026 Q1-Q2
    │                    │                    │                    │
    ▼                    ▼                    ▼                    ▼
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Phase 1 │       │  Phase 2 │       │  Phase 3 │       │  Phase 4 │
│   MVP    │──────▶│  Growth  │──────▶│Expansion │──────▶│Ecosystem│
│          │       │          │       │          │       │          │
│ ✅ Done  │       │ 🔄 Now   │       │ 📋 Plan  │       │ 🔮 Vision│
└──────────┘       └──────────┘       └──────────┘       └──────────┘
     v1.0-v2.0         v2.1-v2.9         v3.0-v3.9         v4.0+
```

---

## 🇬🇧 Development Roadmap

### Phase 1: MVP ✅ (Completed)

| Module | Status | Details |
|--------|--------|---------|
| OTP Authentication | ✅ | Mobile number + one-time password login |
| Fiat & Gold Wallets | ✅ | Dual wallet with transaction history |
| Gold Buy/Sell | ✅ | Real-time trading with online pricing |
| ZarinPal Integration | ✅ | Iranian payment gateway connection |
| User Profile | ✅ | Personal info and settings |
| Admin Dashboard | ✅ | Comprehensive management panel |
| Blog & CMS | ✅ | Content management system |

### Phase 2: Growth 🔄 (Current)

| Module | Status | Details |
|--------|--------|---------|
| AI Intelligence | ✅ | Smart chat, buy advisor, wealth coach |
| Gamification | ✅ | XP, levels, achievements, daily check-in |
| Merchant Gateway | ✅ | Gold payments, QR, settlements |
| Insurance | ✅ | Third-party, fire, body coverage |
| Gold Card | ✅ | Virtual card with custom design |
| Utility & Car Services | ✅ | Top-up, internet, bills, auto services |
| Creator Club | ✅ | User-generated financial content |
| Social Feed | ✅ | Community interaction |
| Family Wallet | ✅ | Multi-member family finance |
| Gold Vault | ✅ | Secure gold storage |
| Loyalty & Cashback | ✅ | Reward programs |
| SDK & API | ✅ | Node.js, Python, PHP, WordPress |
| VIP Membership | ✅ | Four-tier premium membership |

### Phase 3: Expansion 📋 (Planned)

| Module | Priority | Details |
|--------|----------|---------|
| Mobile App (React Native) | High | Native iOS & Android apps |
| Investment Fund | High | Gold mutual fund |
| P2P Trading | High | Direct user-to-user trades |
| Gold NFT Marketplace | Medium | Digital art gold tokens |
| Telegram Bot (Advanced) | Medium | Enhanced Telegram integration |
| Blockchain Integration | High | Transaction transparency |
| Digital Gold Loans | High | Crypto-collateralized lending |
| Physical Gold Card | Medium | Physical card issuance |

### Phase 4: Ecosystem 🌐 (Vision)

| Module | Details |
|--------|---------|
| Zaringold Exchange | Online gold & currency exchange |
| API Marketplace | Third-party API marketplace |
| White-label Solution | Ready-made solution for businesses |
| Internationalization | Regional market expansion |
| Digital Gold Bank | Gold-based banking services |
| Distributed Ledger | Full transaction transparency |

### Timeline

```
2024 Q3-Q4          2025 Q1-Q2          2025 Q3-Q4          2026 Q1-Q2
    │                    │                    │                    │
    ▼                    ▼                    ▼                    ▼
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Phase 1 │       │  Phase 2 │       │  Phase 3 │       │  Phase 4 │
│   MVP    │──────▶│  Growth  │──────▶│Expansion │──────▶│Ecosystem│
│          │       │          │       │          │       │          │
│ ✅ Done  │       │ 🔄 Now   │       │ 📋 Plan  │       │ 🔮 Vision│
└──────────┘       └──────────┘       └──────────┘       └──────────┘
     v1.0-v2.0         v2.1-v2.9         v3.0-v3.9         v4.0+
```

---

# 12 | تحلیل ریسک / Risk Analysis

## 🇮🇷 تحلیل ریسک

### ماتریس ریسک

| ریسک | احتمال | شدت | امتیاز | راهکار کاهش |
|------|--------|-----|--------|------------|
| **نوسانات شدید قیمت طلا** | بالا | بالا | 🔴 ۹ | سیستم هدجینگ خودکار + آلارم |
| **تغییرات نظارتی** | متوسط | بالا | 🟠 ۷ | تیم حقوقی + تطبیق مداوم |
| **حملات سایبری** | متوسط | بالا | 🟠 ۷ | امنیت چندلایه + تست نفوذ |
| **رقابت از سمت بانک‌ها** | بالا | متوسط | 🟡 ۶ | نوآوری مداوم + مزیت رقابتی |
| **اختلال زیرساخت اینترنت** | کم | بالا | 🟡 ۶ | CDN + ذخیره آفلاین |
| **عدم پذیرش کاربران** | متوسط | متوسط | 🟡 ۶ | UX عالی + کمپین بازاریابی |
| **خطر نقدشوندگی** | کم | بالا | 🟡 ۵ | ذخایر طلایی + پذیرندگان |
| **مشکلات فنی (Downtime)** | کم | متوسط | 🟢 ۴ | مانیتورینگ + بکاپ خودکار |
| **نوسانات نرخ ارز** | بالا | متوسط | 🟡 ۶ | اتصال لحظه‌ای به قیمت جهانی |
| **ریسک شهرت و اعتماد** | کم | بالا | 🟡 ۵ | شفافیت کامل + بیمه سپرده |

### راهکارهای کاهش ریسک

#### ریسک‌های بازار

- **موج‌سواری قیمت طلا**: سیستم خودکار برای تنظیم اسپردها بر اساس نوسانات بازار
- **ریسک نقدشوندگی**: ذخایر طلایی فیزیکی کافی و شبکه پذیرندگان گسترده
- **تأثیر تحریم‌ها**: تمرکز بر بازار داخلی با پشتوانه طلای فیزیکی

#### ریسک‌های نظارتی

- **تیم حقوقی اختصاصی**: همکاری با وکلای متخصص حقوق مالی
- **تطبیق مداوم**: به‌روزرسانی سیستم‌ها بر اساس تغییرات قوانین
- **شفافیت**: گزارش‌دهی منظم به نهادهای ناظر

#### ریسک‌های فنی

- **بکاپ و بازیابی**: پشتیبان‌گیری خودکار روزانه و هفتگی
- **مانیتورینگ**: نظارت ۲۴ ساعته بر وضعیت سیستم
- **تست نفوذ**: تست‌های امنیتی دوره‌ای

---

## 🇬🇧 Risk Analysis

### Risk Matrix

| Risk | Probability | Impact | Score | Mitigation Strategy |
|------|-------------|--------|-------|---------------------|
| **Gold Price Volatility** | High | High | 🔴 9 | Auto-hedging + alerts |
| **Regulatory Changes** | Medium | High | 🟠 7 | Legal team + continuous compliance |
| **Cyber Attacks** | Medium | High | 🟠 7 | Multi-layer security + penetration testing |
| **Bank Competition** | High | Medium | 🟡 6 | Continuous innovation + competitive advantage |
| **Internet Infrastructure** | Low | High | 🟡 6 | CDN + offline caching |
| **User Adoption** | Medium | Medium | 🟡 6 | Excellent UX + marketing campaigns |
| **Liquidity Risk** | Low | High | 🟡 5 | Gold reserves + merchant network |
| **Technical Issues** | Low | Medium | 🟢 4 | Monitoring + auto-backup |
| **Currency Fluctuations** | High | Medium | 🟡 6 | Real-time global price connection |
| **Reputational Risk** | Low | High | 🟡 5 | Full transparency + deposit insurance |

### Mitigation Strategies

#### Market Risks

- **Gold price surfing**: Automated spread adjustment based on market volatility
- **Liquidity risk**: Sufficient physical gold reserves and extensive merchant network
- **Sanctions impact**: Focus on domestic market with physical gold backing

#### Regulatory Risks

- **Dedicated legal team**: Partnership with financial law specialists
- **Continuous compliance**: Regular system updates based on regulatory changes
- **Transparency**: Regular reporting to regulatory authorities

#### Technical Risks

- **Backup & recovery**: Automated daily and weekly backups with metadata tracking
- **Monitoring**: 24/7 system health monitoring with watchdog scripts
- **Penetration testing**: Periodic security audits

---

# 13 | تیم و منابع / Team & Resources

## 🇮🇷 تیم و منابع

### ساختار تیم مورد نیاز

| نقش | تعداد | مسئولیت‌ها | فناوری‌ها |
|-----|-------|-----------|----------|
| **مدیر پروژه** | ۱ | مدیریت اجایل، هماهنگی تیم | Jira, Notion |
| **توسعه‌دهنده فول‌استک ارشد** | ۱ | معماری، توسعه هسته | Next.js, TypeScript |
| **توسعه‌دهنده فول‌استک** | ۲ | توسعه ماژول‌ها و API | Next.js, Prisma |
| **طراح UI/UX** | ۱ | طراحی رابط کاربری | Figma, Tailwind |
| **متخصص AI/ML** | ۱ | هوش مصنوعی و تحلیل | z-ai-web-sdk, Python |
| **مهندس دواپس** | ۱ | زیرساخت و CI/CD | Docker, Linux, Caddy |
| **متخصص امنیت** | ۱ | امنیت و تست نفوذ | OWASP, Pentesting |
| **تیم حقوقی** | ۱ | تطبیق نظارتی | حقوق مالی |
| **بازاریاب دیجیتال** | ۱ | بازاریابی و رشد | SEO, Social, Ads |

### متدولوژی توسعه

```
┌─────────────────────────────────────────────────────┐
│              Agile Development Process               │
│                                                       │
│  Sprint (2 Weeks)                                     │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐  │
│  │Mon  │Tue  │Wed  │Thu  │Fri  │Sat  │Sun  │Mon  │  │
│  │Plan │Dev  │Dev  │Dev  │Rev  │Dev  │Test │Demo │  │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘  │
│                                                       │
│  Tools:                                               │
│  • Version Control: Git + GitHub                      │
│  • Issue Tracking: GitHub Issues                      │
│  • CI/CD: Automated scripts                           │
│  • Communication: Telegram + Discord                  │
│  • Documentation: Notion + README                     │
└─────────────────────────────────────────────────────┘
```

### استک فناوری فعلی

| دسته | فناوری | نسخه |
|------|--------|------|
| فریمورک | Next.js (App Router) | 16 |
| زبان | TypeScript | 5 |
| رابط کاربری | React | 19 |
| استایل | Tailwind CSS | 4 |
| کامپوننت | shadcn/ui | New York |
| دیتابیس | SQLite + Prisma ORM | latest |
| واقع‌نمایی | Zustand + TanStack Query | latest |
| احراز هویت | NextAuth.js | v4 |
| ارتباط لحظه‌ای | Socket.IO | latest |
| انیمیشن | Framer Motion | latest |
| AI | z-ai-web-dev-sdk (LLM, VLM, TTS, ASR) | latest |
| رانتایم | Bun | latest |
| پروکسی | Caddy | latest |

---

## 🇬🇧 Team & Resources

### Required Team Structure

| Role | Count | Responsibilities | Technologies |
|------|-------|-----------------|--------------|
| **Project Manager** | 1 | Agile management, team coordination | Jira, Notion |
| **Senior Full-stack Developer** | 1 | Architecture, core development | Next.js, TypeScript |
| **Full-stack Developers** | 2 | Module & API development | Next.js, Prisma |
| **UI/UX Designer** | 1 | Interface design | Figma, Tailwind |
| **AI/ML Specialist** | 1 | AI & analytics | z-ai-web-sdk, Python |
| **DevOps Engineer** | 1 | Infrastructure & CI/CD | Docker, Linux, Caddy |
| **Security Specialist** | 1 | Security & penetration testing | OWASP |
| **Legal Advisor** | 1 | Regulatory compliance | Financial law |
| **Digital Marketer** | 1 | Marketing & growth | SEO, Social, Ads |

### Development Methodology

The team follows an **Agile Scrum** process with 2-week sprints:

1. **Monday**: Sprint planning and task assignment
2. **Tue–Wed–Thu**: Development sprints
3. **Friday**: Code review and retrospective
4. **Sat–Sun**: Continued development
5. **Monday**: Testing and sprint demo

### Current Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| UI Library | React | 19 |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui (New York) | latest |
| Database | SQLite + Prisma ORM | latest |
| State Management | Zustand + TanStack Query | latest |
| Authentication | NextAuth.js | v4 |
| Real-time | Socket.IO | latest |
| Animation | Framer Motion | latest |
| AI SDK | z-ai-web-dev-sdk (LLM, VLM, TTS, ASR) | latest |
| Runtime | Bun | latest |
| Reverse Proxy | Caddy | latest |

---

# 14 | نتیجه‌گیری / Conclusion

## 🇮🇷 نتیجه‌گیری

### خلاصه ارزش پیشنهادی

زرین گلد با ارائه یک پلتفرم جامع و یکپارچه برای معاملات و سرمایه‌گذاری طلای دیجیتال، فرصتی بی‌نظیر برای تحول بازار طلای ایران فراهم می‌کند. این پلتفرم با ترکیب فناوری‌های نوین، هوش مصنوعی و طراحی کاربرمحور، تجربه‌ای امن، سریع و لذت‌بخش برای مدیریت دارایی‌های طلایی ارائه می‌دهد.

### نکات کلیدی

- ✅ **بازار بزرگ و در حال رشد** — ۳۰+ میلیارد دلار حجم سالانه با پتانسیل بالای دیجیتالی‌سازی
- ✅ **محصول جامع** — بیش از ۵۰ ماژول فعال با ۸۰+ مدل پایگاه داده
- ✅ **فناوری پیشرفته** — Next.js 16, AI, WebSocket, Glass-morphism UI
- ✅ **مدل درآمدی متنوع** — ۷ جریان درآمدی مستقل
- ✅ **تیم متخصص** — ساختار تیمی با ۹ نقش کلیدی
- ✅ **نقشه راه واضح** — ۴ فاز توسعه از MVP تا اکوسیستم
- ✅ **امنیت چندلایه** — ۵ لایه امنیتی با تطبیق KYC/AML

### فراخوان به اقدام

زرین گلد در مرحله رشد قرار دارد و با بیش از ۵۰ ماژول فعال و زیرساخت فنی قدرتمند، آماده ورود به بازار است. ما به دنبال:

1. **سرمایه‌گذاران** — برای تأمین مالی فاز گسترش و بازاریابی
2. **پذیرندگان تجاری** — برای ایجاد شبکه پرداخت طلایی
3. **شرکای استراتژیک** — در حوزه بیمه، بانکداری و فناوری
4. **توسعه‌دهندگان** — برای ساخت اکوسیستم API

---

## 🇬🇧 Conclusion

### Value Proposition Summary

Zaringold presents a unique opportunity to transform Iran's gold market through a comprehensive, integrated digital gold trading and investment platform. By combining cutting-edge technology, artificial intelligence, and user-centric design, it delivers a secure, fast, and enjoyable experience for managing gold assets.

### Key Takeaways

- ✅ **Large, Growing Market** — $30+ billion annual volume with high digitalization potential
- ✅ **Comprehensive Product** — 50+ active modules with 80+ database models
- ✅ **Advanced Technology** — Next.js 16, AI, WebSocket, Glass-morphism UI
- ✅ **Diversified Revenue Model** — 7 independent revenue streams
- ✅ **Expert Team Structure** — 9 key roles with clear responsibilities
- ✅ **Clear Roadmap** — 4-phase development from MVP to ecosystem
- ✅ **Multi-layer Security** — 5 security layers with KYC/AML compliance

### Call to Action

Zaringold is in its growth phase with 50+ active modules and a robust technical foundation. We are seeking:

1. **Investors** — To fund the expansion phase and marketing efforts
2. **Merchants** — To build the gold payment network
3. **Strategic Partners** — In insurance, banking, and technology sectors
4. **Developers** — To build the API ecosystem

---

<div align="center">

---

## 📞 Contact / تماس

**Fartak Complex / فارتاک کمپلکس**

🌐 **GitHub**: [github.com/fartakcomplex/zaringold](https://github.com/fartakcomplex/zaringold)

📧 **Email**: info@fartakcomplex.com

---

> *Zaringold — Where Gold Meets Innovation*

> *زرین گلد — جایی که طلا با نوآوری تلاقی می‌کند*

---

**© 2025 Fartak Complex. All rights reserved.**

</div>
