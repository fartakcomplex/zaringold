<div align="center">

# 🚀 راهنمای مقیاس‌پذیری زرین گلد
# Zaringold Scaling Guide

**نسخه / Version:** `v3.0.0`
**هدف / Target:** ۱M+ کاربر همزمان / Concurrent Users
**معماری / Architecture:** Kubernetes + Event-Driven + CDN

</div>

---

## 📑 فهرست / Table of Contents

| # | فارسی | English |
|---|-------|---------|
| 1 | [نمای کلی](#1--نمای-کلی--overview) | [Overview](#1--نمای-کلی--overview) |
| 2 | [معماری مقیاس‌پذیر](#2--معماری-مقیاس‌پذیر--scalable-architecture) | [Scalable Architecture](#2--معماری-مقیاس‌پذیر--scalable-architecture) |
| 3 | [استقرار کوبرنتیز](#3--استقرار-کوبرنتیز--kubernetes-deployment) | [Kubernetes Deployment](#3--استقرار-کوبرنتیز--kubernetes-deployment) |
| 4 | [معماری رویدادمحور](#4--معماری-رویدادمحور--event-driven-architecture) | [Event-Driven Architecture](#4--معماری-رویدادمحور--event-driven-architecture) |
| 5 | [استراتژی کشینگ](#5--استراتژی-کشینگ--caching-strategy) | [Caching Strategy](#5--استراتژی-کشینگ--caching-strategy) |
| 6 | [تنظیم CDN](#6--تنظیم-cdn--cdn-configuration) | [CDN Configuration](#6--تنظیم-cdn--cdn-configuration) |
| 7 | [محدودیت نرخ و امنیت](#7--محدودیت-نرخ-و-امنیت--rate-limiting--security) | [Rate Limiting & Security](#7--محدودیت-نرخ-و-امنیت--rate-limiting--security) |
| 8 | [نظارت و مشاهده‌پذیری](#8--نظارت-و-مشاهدهپذیری--monitoring--observability) | [Monitoring & Observability](#8--نظارت-و-مشاهدهپذیری--monitoring--observability) |
| 9 | [مقیاس‌پذیری پایگاه داده](#9--مقیاسپذیری-پایگاه-داده--database-scaling) | [Database Scaling](#9--مقیاسپذیری-پایگاه-داده--database-scaling) |
| 10 | [خط لوله CI/CD](#10--خط-لوله-cicd--cicd-pipeline) | [CI/CD Pipeline](#10--خط-لوله-cicd--cicd-pipeline) |
| 11 | [برنامه‌ریزی ظرفیت](#11--برنامهریزی-ظرفیت--capacity-planning) | [Capacity Planning](#11--برنامهریزی-ظرفیت--capacity-planning) |
| 12 | [عیب‌یابی](#12--عیبیابی--troubleshooting) | [Troubleshooting](#12--عیبیابی--troubleshooting) |
| 13 | [مرجع سریع](#13--مرجع-سریع--quick-reference) | [Quick Reference](#13--مرجع-سریع--quick-reference) |

---

# 1 | نمای کلی / Overview

## 🇮🇷 نمای کلی

این سند راهنمای کامل مقیاس‌پذیری پلتفرم زرین گلد برای پشتیبانی از **بیش از ۱ میلیون کاربر همزمان** است. معماری شامل سه ستون اصلی است:

- **کوبرنتیز (Kubernetes)**: استقرار خودکار، مقیاس‌پذیری افقی و توزیع بار
- **رویدادمحور (Event-Driven)**: پردازش ناهمگام با Redis Pub/Sub و صف کارها
- **شبکه توزیع محتوا (CDN)**: کشینگ در لبه شبکه و کاهش بار سرور

### نقشه راه مقیاس‌پذیری

| فاز / Phase | ظرفیت / Capacity | معماری / Architecture |
|---|---|---|
| **v2.9 فعلی** | تا ۱۰K کاربر | تک سرور، SQLite، کش حافظه |
| **رشد** | تا ۱۰۰K کاربر | Load Balancer، PostgreSQL، Redis |
| **v3.0 مقیاس** | **۱M+ کاربر** | **Kubernetes، Event-Driven، CDN** |

## 🇬🇧 Overview

This document is the comprehensive scaling guide for the Zaringold platform to support **1M+ concurrent users**. The architecture relies on three pillars:

- **Kubernetes**: Auto-deployment, horizontal scaling, and load distribution
- **Event-Driven**: Asynchronous processing with Redis Pub/Sub and job queues
- **CDN**: Edge caching and server load reduction

---

# 2 | معماری مقیاس‌پذیر / Scalable Architecture

## 🇮🇷 معماری کلی

```
┌─────────────────────────────────────────────────────────────────────┐
│                        کاربران نهایی / Users                       │
│                     (وب، موبایل، API، تلگرام)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    CDN (Cloudflare / Fastly)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  آسیا    │  │  اروپا   │  │ آمریکا   │  │ خاورمیانه│           │
│  │ (TEH)   │  │ (FRA)   │  │ (IAD)   │  │ (DXB)   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│              Kubernetes Cluster (3+ نود / Nodes)                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              NGINX Ingress Controller                        │    │
│  │  (SSL Termination, Rate Limiting, Sticky Sessions)          │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌────────────┐  ┌──────────▼──┐  ┌──────────────┐                 │
│  │  Next.js   │  │Chat Service │  │Price Service │                 │
│  │  5-100 pod │  │  3-20 pod   │  │  2-5 pod     │                 │
│  │  (HPA)     │  │  (HPA)      │  │  (HPA)       │                 │
│  └──────┬─────┘  └──────┬──────┘  └──────┬───────┘                 │
│         │               │               │                           │
│  ┌──────▼───────────────▼───────────────▼──────┐                  │
│  │           Event Worker (3-10 pod)            │                  │
│  │  (Job Queue, Event Handlers, Background)     │                  │
│  └───────────────────┬─────────────────────────┘                  │
│                       │                                              │
│  ┌────────────────────▼─────────────────────────┐                  │
│  │              Redis Cluster                     │                  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐            │                  │
│  │  │ Master │ │ Master │ │ Master │            │                  │
│  │  └───┬────┘ └───┬────┘ └───┬────┘            │                  │
│  │  ┌───▼────┐ ┌───▼────┐ ┌───▼────┐            │                  │
│  │  │ Slave  │ │ Slave  │ │ Slave  │            │                  │
│  │  └────────┘ └────────┘ └────────┘            │                  │
│  │  Cache + Pub/Sub + Sessions + Queue           │                  │
│  └────────────────────┬──────────────────────────┘                  │
│                        │                                              │
│  ┌─────────────────────▼─────────────────────────┐                 │
│  │              PostgreSQL Cluster                │                 │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │                 │
│  │  │ Primary  │  │ Replica  │  │ Replica  │    │                 │
│  │  │ (Write)  │  │ (Read)   │  │ (Read)   │    │                 │
│  │  └──────────┘  └──────────┘  └──────────┘    │                 │
│  └───────────────────────────────────────────────┘                 │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │ Prometheus   │  │   Grafana    │                                 │
│  │ (Metrics)    │  │ (Dashboards) │                                 │
│  └──────────────┘  └──────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## 🇬🇧 Architecture Components

| Component | Role | Scaling |
|-----------|------|---------|
| **CDN** | Static assets, edge caching | Global edge network |
| **NGINX Ingress** | Load balancing, SSL, routing | Auto (K8s) |
| **Next.js Pods** | Main application | HPA: 5→100 pods |
| **Chat Service** | Socket.IO real-time | HPA: 3→20 pods |
| **Price Service** | Gold price feeds | HPA: 2→5 pods |
| **Event Worker** | Background processing | HPA: 3→10 pods |
| **Redis Cluster** | Cache, pub/sub, sessions | 3 master + 3 replica |
| **PostgreSQL** | Primary database | 1 primary + 2 read replicas |
| **Prometheus** | Metrics collection | Dedicated pod |
| **Grafana** | Dashboards & alerting | Dedicated pod |

---

# 3 | استقرار کوبرنتیز / Kubernetes Deployment

## 🇮🇷 پیش‌نیازها

```bash
# ابزارهای مورد نیاز / Required tools
kubectl >= 1.28
helm >= 3.14
kustomize >= 5.3
docker >= 24.0
```

## 🇬🇧 Quick Deploy with Helm

```bash
# ۱. کلون / Clone
git clone https://github.com/fartakcomplex/zaringold.git
cd zaringold

# ۲. ساخت تصویر / Build image
docker build -t zaringold:latest .

# ۳. نصب با Helm / Install with Helm
helm install zaringold deploy/helm/zaringold \
  --namespace zaringold --create-namespace \
  -f deploy/helm/zaringold/values.yaml \
  --set image.tag=latest

# ۴. بررسی وضعیت / Check status
helm status zaringold -n zaringold
kubectl get pods -n zaringold -w
```

## Deploy with Kustomize (Alternative)

```bash
# Production
kubectl apply -k deploy/kubernetes/overlays/production/

# Staging
kubectl apply -k deploy/kubernetes/overlays/staging/
```

## Helm Values Reference

```yaml
# deploy/helm/zaringold/values.yaml (key sections)

replicaCount: 3
image:
  repository: zaringold
  tag: v3.0.0
  pullPolicy: IfNotPresent

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 100
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: "2"
    memory: 2Gi

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: zaringold.ir
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: zaringold-tls
      hosts:
        - zaringold.ir

redis:
  enabled: true
  cluster:
    enabled: true
    nodes: 6  # 3 master + 3 replica

postgresql:
  enabled: true
  primary:
    resources:
      requests:
        cpu: 1
        memory: 2Gi
  readReplicas: 2

chatService:
  replicaCount: 3
  autoscaling:
    maxReplicas: 20

eventWorker:
  replicaCount: 3
  autoscaling:
    maxReplicas: 10
```

## HPA Configuration

```yaml
# Horizontal Pod Autoscaler - Production
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: zaringold-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zaringold
  minReplicas: 5
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

## Multi-Zone Deployment

```yaml
# Topology spread for high availability
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: zaringold
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: zaringold
```

---

# 4 | معماری رویدادمحور / Event-Driven Architecture

## 🇮🇷 سیستم رویداد

پلتفرم زرین گلد از معماری رویدادمحور استفاده می‌کند. تمام عملیات‌های ناهمگام (ایمیل، نوتیفیکیشن، به‌روزرسانی آمار) از طریق سیستم رویداد پردازش می‌شوند.

```
┌──────────────┐     Publish      ┌──────────────┐
│  Next.js Pod │ ──────────────▶  │  Redis       │
│              │                  │  Pub/Sub     │
└──────────────┘                  └──────┬───────┘
                                         │ Subscribe
┌──────────────┐     Subscribe   ┌───────▼───────┐
│ Event Worker │ ◀────────────── │  Event Bus    │
│   Pod 1-N    │                  │  (Channels)   │
└──────────────┘                  └───────────────┘
       │
       ├── trading.* → Process gold trades, update portfolios
       ├── wallet.*  → Update balances, send notifications
       ├── payment.* → Verify payments, trigger webhooks
       ├── user.*    → Send welcome emails, KYC processing
       ├── notification.* → Email, SMS, Push
       ├── gamification.* → Award XP, check achievements
       └── system.*   → Health, metrics, errors
```

## Event Categories

| دسته / Category | رویدادها / Events | مثال / Example |
|---|---|---|
| `trading` | gold.buy, gold.sell, gold.gift, price.updated | کاربر ۱ گرم طلا خرید |
| `wallet` | wallet.deposit, wallet.withdraw, wallet.transfer | واریز ۵ میلیون ریال |
| `payment` | payment.created, payment.verified, payment.failed | پرداخت زرین‌پال تأیید شد |
| `user` | user.registered, user.login, kyc.submitted | ثبت‌نام کاربر جدید |
| `notification` | email.sent, sms.sent, push.sent | ارسال ایمیل خوش‌آمدگویی |
| `gamification` | checkin.completed, xp.earned, level.up | کسب ۵۰ XP از چک‌این |
| `insurance` | order.created, order.processed, order.completed | سفارش بیمه شخص ثالث |
| `system` | health.check, metrics.reported, error.occurred | بررسی سلامت سرور |

## 🇬🇧 Job Queue System

```typescript
// Priority levels
enum JobPriority {
  CRITICAL = 0,  // Payment verification, security alerts
  HIGH     = 1,  // Trade execution, balance updates
  NORMAL   = 5,  // Notifications, emails
  LOW      = 10  // Analytics, reports, cleanup
}

// Usage example
import { createEventSystem } from '@/lib/events';

const eventSystem = createEventSystem();

// Publish an event
await eventSystem.publisher.publish('trading.gold.buy', {
  userId: 'user-123',
  amount: 1.5, // grams
  pricePerGram: 3500000,
  total: 5250000
});

// Queue a delayed job
await eventSystem.queue.add('notification.welcome-email', {
  userId: 'user-123',
  email: 'user@example.com'
}, {
  priority: JobPriority.HIGH,
  delay: 5000, // 5 seconds
  attempts: 3
});
```

## Event Worker Service

```bash
# Event Worker runs as a separate mini-service (port 3008)
cd mini-services/event-worker
bun run dev
```

---

# 5 | استراتژی کشینگ / Caching Strategy

## 🇮🇷 کش چندلایه

```
درخواست کاربر / User Request
       │
       ▼
┌──────────────┐      Hit      ┌──────────┐
│  L1 Cache    │ ───────────▶  │  Return  │
│  (In-Memory) │               │  Data    │
│  100ms TTL   │               └──────────┘
│  LRU 5000    │
└──────┬───────┘
       │ Miss
       ▼
┌──────────────┐      Hit      ┌──────────┐
│  L2 Cache    │ ───────────▶  │  Return  │
│  (Redis)     │               │  Data    │
│  Configurable│               └──────────┘
│  TTL         │
└──────┬───────┘
       │ Miss
       ▼
┌──────────────┐      Write     ┌──────────┐
│  Database /  │ ───────────▶   │  Cache   │
│  API         │  (Cache the    │  Update  │
│              │   result)      │          │
└──────────────┘               └──────────┘
```

## Cache Strategies per Domain

| Domain / دامنه | L1 TTL | L2 TTL | توضیحات / Description |
|---|---|---|---|
| Gold Prices (Live) | 50ms | 5s | قیمت لحظه‌ای - حساس به زمان |
| Gold Prices (API) | 50ms | 60s | داده‌های API - بلوک کمتر |
| User Sessions | 100ms | 30min | سشن کاربران |
| User Profiles | 100ms | 5min | پروفایل کاربران |
| Site Settings | 100ms | 10min | تنظیمات سایت |
| Market Data | 100ms | 15min | داده‌های بازار |
| Leaderboards | 100ms | 1min | رده‌بندی گیمیفیکیشن |
| Wallet Balance | 50ms | 5s | موجودی کیف پول - حساس |
| CMS Pages | 100ms | 5min | صفحات محتوا |
| Blog Posts | 100ms | 10min | پست‌های وبلاگ |

## 🇬🇧 Cache Stampede Prevention

The cache manager uses a **singleflight pattern** to prevent cache stampedes:

```typescript
import { cacheManager } from '@/lib/cache';

// getOrSet automatically handles concurrent requests
const prices = await cacheManager.getOrSet(
  'gold:prices:live',
  async () => {
    return fetchGoldPricesFromAPI();
  },
  { ttl: 5000 } // 5 seconds
);
```

## Cache Invalidation

```bash
# Via API
POST /api/cache/invalidate
{
  "pattern": "gold:prices:*",
  "purgeCdn": true
}

# Via event
await eventSystem.publisher.publish('cache.invalidate', {
  pattern: 'user:profile:*',
  tags: ['user-updated']
});
```

---

# 6 | تنظیم CDN / CDN Configuration

## Cache-Control Headers

| مسیر / Path | Cache-Control | توضیح / Purpose |
|---|---|---|
| `/_next/static/*` | `public, max-age=31536000, immutable` | فایل‌های استاتیک Next.js |
| `/fonts/*` | `public, max-age=31536000, immutable` | فونت‌ها |
| `/images/*` | `public, max-age=86400, stale-while-revalidate=300` | تصاویر |
| `/sdk/*` | `public, max-age=3600` | SDK توسعه‌دهندگان |
| `/api/*` | `no-store` | API ها (مگر غیرفعال) |
| Pages | `s-maxage=60, stale-while-revalidate=300` | صفحات SSR |

## CDN Providers

| Provider | استخدام / Usage | توضیحات |
|---|---|---|
| **Cloudflare** | Primary | ربات‌های ایرانی را مسدود نمی‌کند |
| **Fastly** | Alternative | کشینگ در لبه |
| **ArvanCloud** | Iran Edge | نقطه حضور در ایران |

## Environment Variables

```bash
# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://cdn.zaringold.ir
CDN_PROVIDER=cloudflare
CDN_PURGE_API_URL=https://api.cloudflare.com/client/v4
CDN_PURGE_API_KEY=your-api-key
CDN_ZONE_ID=your-zone-id
CDN_DEFAULT_TTL=86400
```

---

# 7 | محدودیت نرخ و امنیت / Rate Limiting & Security

## Rate Limiting Rules

| مسیر / Route | محدودیت / Limit | دوره / Window |
|---|---|---|
| `/api/auth/*` | 5 in-flight | 1 minute |
| `/api/payment/*` | 10 requests | 1 minute |
| `/api/gold/buy` | 30 requests | 1 minute |
| `/api/gold/sell` | 30 requests | 1 minute |
| `/api/chat/*` | 60 requests | 1 minute |
| `/api/admin/*` | 60 requests | 1 minute |
| `/api/*` (default) | 100 requests | 1 minute |
| Pages | 200 requests | 1 minute |
| Static assets | 1000 requests | 1 minute |

## Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1719000000
Retry-After: 30
```

## Circuit Breaker

| سرویس / Service | Threshold | Recovery | Timeout |
|---|---|---|---|
| Payment Gateway | 5 failures | 30s | 10s |
| SMS Provider | 10 failures | 60s | 5s |
| Email Provider | 10 failures | 60s | 10s |
| Gold Price API | 5 failures | 15s | 5s |

## Security Headers

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Bot Detection

| بات / Bot | عملکرد / Action |
|---|---|
| Googlebot, Yandex | ✅ اجازه دسترسی |
| sqlmap, nikto, masscan | ❌ مسدود |
| Semrush, Ahrefs | ⚠️ محدود |
| Abnormal patterns | ⚠️ CAPTCHA |

---

# 8 | نظارت و مشاهده‌پذیری / Monitoring & Observability

## Health Endpoints

| Endpoint | نوع / Type | توضیح / Description |
|---|---|---|
| `GET /api/health/live` | Liveness | فرآیند در حال اجراست |
| `GET /api/health/ready` | Readiness | تمام وابستگی‌ها سالم هستند |
| `GET /api/metrics` | Prometheus | معیارهای عملکرد |

## Prometheus Metrics

| Metric | Type | توضیح / Description |
|---|---|---|
| `http_requests_total` | Counter | تعداد کل درخواست‌ها |
| `http_request_duration_seconds` | Histogram | زمان پاسخ‌دهی |
| `http_requests_active` | Gauge | درخواست‌های فعال |
| `cache_hits_total` | Counter | تعداد کش Hit |
| `cache_misses_total` | Counter | تعداد کش Miss |
| `events_published_total` | Counter | رویدادهای منتشرشده |
| `events_processed_total` | Counter | رویدادهای پردازش‌شده |
| `jobs_queued_total` | Counter | کارهای در صف |
| `jobs_completed_total` | Counter | کارهای تکمیل‌شده |
| `jobs_failed_total` | Counter | کارهای شکست‌خورده |
| `db_query_duration_seconds` | Histogram | زمان کوئری دیتابیس |
| `redis_commands_total` | Counter | دستورات Redis |
| `circuit_breaker_state` | Gauge | وضعیت Circuit Breaker |

## Distributed Tracing

```
Request ID: req-abc-123
├── Span: api/gold/buy (45ms)
│   ├── Span: db/goldPrice.find (5ms)
│   ├── Span: db/wallet.update (8ms)
│   └── Span: event/publish (2ms)
└── Span: response (1ms)
Total: 61ms
```

## Grafana Dashboards

| Dashboard | معیارها / Metrics |
|---|---|
| System Overview | CPU, Memory, Pods, Network |
| API Performance | Latency (p50/p95/p99), Error Rate, Throughput |
| Gold Trading | Trades/min, Volume, Price Updates |
| Cache Performance | Hit Rate, Eviction, Memory Usage |
| Event Processing | Events/sec, Queue Length, Error Rate |
| Database | Connections, Query Time, Replication Lag |

---

# 9 | مقیاس‌پذیری پایگاه داده / Database Scaling

## 🇮🇷 مهاجرت از SQLite به PostgreSQL

```bash
# ۱. تغییر DATABASE_URL
DATABASE_URL=postgresql://user:pass@primary:5432/zaringold

# ۲. آپدیت Prisma schema (engine = postgresql)
# در prisma/schema.prisma:
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }

# ۳. اجرای migration
bunx prisma migrate dev --name init-postgres
bunx prisma generate
```

## Connection Pooling

```typescript
// src/lib/db.ts - Production configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['query', 'info', 'warn', 'error'],
});

// Connection pool settings in DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30
```

## Read Replicas

```typescript
// Read from replica for non-critical queries
const replicaUrl = process.env.DATABASE_REPLICA_URL;
const primaryUrl = process.env.DATABASE_URL;

// Use PgBouncer or Prisma's built-in replication support
```

## Backup Strategy

| نوع / Type | فرکانس / Frequency | نگهداری / Retention |
|---|---|---|
| Full Backup | هر روز ۰۲:۰۰ | ۳۰ روز |
| Incremental | هر ساعت | ۷ روز |
| WAL Archive | پیوسته | ۷ روز |
| Point-in-Time Recovery | هر ۵ دقیقه | ۳ روز |

---

# 10 | خط لوله CI/CD / CI/CD Pipeline

## GitHub Actions CI

```
Push/PR to main/develop
  │
  ├── Checkout
  ├── Setup Bun
  ├── Install Dependencies
  ├── Lint (eslint)
  ├── Type Check
  ├── Build (next build)
  ├── Docker Build
  ├── Push to Registry
  └── Deploy to Staging (develop branch)
```

## CD Pipeline (Production)

```
Release Tag (v3.0.0)
  │
  ├── Build Docker Image
  ├── Push to Registry
  ├── Deploy with Helm
  │   ├── Pre-deploy health check
  │   ├── Rolling update (maxUnavailable=0)
  │   ├── Post-deploy health check
  │   └── Smoke tests
  ├── Success → Tag release
  └── Failure → Auto rollback
```

## Deployment Strategies

| استراتژی / Strategy | توضیح / Description |
|---|---|
| **Rolling Update** | پیش‌فرض - آپدیت تدریجی پادها |
| **Blue-Green** | برای آپدیت‌های بزرگ - بدون دان‌تایم |
| **Canary** | ۱۰٪ ترافیک به نسخه جدید اول |

---

# 11 | برنامه‌ریزی ظرفیت / Capacity Planning

## Resource Requirements

| Component | v2.9 (10K) | v3.0 (1M) | Growth |
|---|---|---|---|
| **Next.js Pods** | 2 pods (1 CPU/1Gi) | 20 pods avg (2 CPU/4Gi) | 10x |
| **Chat Pods** | 1 pod (0.5 CPU/512Mi) | 10 pods (1 CPU/1Gi) | 10x |
| **Event Workers** | — | 5 pods (1 CPU/1Gi) | New |
| **Redis** | — | 6-node cluster (4Gi each) | New |
| **PostgreSQL** | SQLite | Primary + 2 Replicas (8Gi) | New |
| **CDN** | — | 10TB/month bandwidth | New |
| **K8s Nodes** | 1 node (4 CPU/8Gi) | 5+ nodes (16 CPU/32Gi each) | 20x |

## Cost Estimation (Monthly)

| Service | Spec | Cost (USD) |
|---|---|---|
| K8s Nodes (5x) | 16 CPU, 32Gi RAM | $500-800 |
| Redis Cluster | 6 nodes, 4Gi each | $200-400 |
| PostgreSQL | Managed, 3 nodes | $300-500 |
| CDN | 10TB bandwidth | $100-200 |
| Load Balancer | NGINX Ingress | $50-100 |
| Monitoring | Prometheus + Grafana | $50-100 |
| **Total** | | **$1,200-2,100/mo** |

## Scaling Thresholds

| معیار / Metric | آستانه / Threshold | عملکرد / Action |
|---|---|---|
| CPU Usage | > 70% | Scale up pods |
| Memory Usage | > 80% | Scale up pods |
| Response Time p95 | > 500ms | Scale up + investigate |
| Error Rate | > 1% | Alert + investigate |
| Queue Length | > 1000 | Scale up workers |
| DB Connections | > 80% | Add replicas |
| Cache Hit Rate | < 90% | Increase cache size |

---

# 12 | عیب‌یابی / Troubleshooting

## مشکلات رایج / Common Issues

### 1. Pod در حال CrashLoopBackOff

```bash
kubectl logs <pod-name> -n zaringold
kubectl describe pod <pod-name> -n zaringold

# Check resources
kubectl top pods -n zaringold
```

### 2. HPA مقیاس نمی‌دهد

```bash
# Check HPA status
kubectl describe hpa zaringold -n zaringold

# Check metrics server
kubectl get deployment metrics-server -n kube-system

# Check resource requests (HPA needs them)
kubectl get deployment zaringold -n zaringold -o yaml | grep -A5 resources
```

### 3. Redis connection failures

```bash
# Check Redis pods
kubectl get pods -n zaringold -l app=redis

# Test connection
kubectl exec -it <redis-pod> -n zaringold -- redis-cli ping

# Check Redis logs
kubectl logs <redis-pod> -n zaringold
```

### 4. Socket.IO disconnects

```bash
# Check sticky session annotations
kubectl get ingress zaringold -n zaringold -o yaml

# Verify nginx ingress config
kubectl exec -it <nginx-pod> -n ingress-nginx -- cat /etc/nginx/nginx.conf | grep sticky
```

## Performance Tuning

| مشکل / Issue | راه‌حل / Solution |
|---|---|
| High p99 latency | Increase cache TTL, add more pods |
| Memory leaks | Profile with Node.js --inspect, check event listeners |
| DB slow queries | Add indexes, use read replicas |
| High CPU on Next.js | Enable ISR, optimize images with next/image |
| Socket.IO issues | Check sticky sessions, increase worker count |

---

# 13 | مرجع سریع / Quick Reference

## Important Commands

```bash
# Deploy
helm upgrade --install zaringold deploy/helm/zaringold -n zaringold -f values.yaml

# Scale manually
kubectl scale deployment zaringold --replicas=10 -n zaringold

# Rollback
helm rollback zaringold 1 -n zaringold
# or
kubectl rollout undo deployment/zaringold -n zaringold

# Check status
kubectl get all -n zaringold
kubectl top pods -n zaringold
kubectl logs -f deployment/zaringold -n zaringold --tail=100

# Port forward for debugging
kubectl port-forward svc/zaringold 3000:3000 -n zaringold

# Redis CLI
kubectl exec -it <redis-pod> -n zaringold -- redis-cli

# Database access
kubectl exec -it <postgres-pod> -n zaringold -- psql -U zaringold

# Cache invalidation via API
curl -X POST https://zaringold.ir/api/cache/invalidate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"pattern": "*"}'
```

## Environment Variables

| Variable | توضیح / Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_REPLICA_URL` | Read replica URL |
| `REDIS_URL` | Redis connection URL |
| `REDIS_CLUSTER_NODES` | Comma-separated cluster nodes |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | Public app URL |
| `ZARINPAL_MERCHANT_ID` | Payment gateway merchant ID |
| `KAVENEGAR_API_KEY` | SMS provider API key |
| `AI_API_KEY` | AI SDK API key |
| `NEXT_PUBLIC_CDN_URL` | CDN base URL |
| `CDN_PROVIDER` | cloudflare / fastly / arvancloud |
| `NODE_ENV` | production |
| `LOG_LEVEL` | info / warn / error / debug |
| `RATE_LIMIT_ENABLED` | true |
| `CIRCUIT_BREAKER_ENABLED` | true |

## Useful URLs

| URL | توضیح / Description |
|---|---|
| `/api/health/live` | Liveness probe |
| `/api/health/ready` | Readiness probe |
| `/api/metrics` | Prometheus metrics |
| `/api/cache/stats` | Cache statistics |
| Grafana: `:3000` | Monitoring dashboards |
| Prometheus: `:9090` | Metrics query |

---

<div align="center">

**آماده مقیاس‌پذیری / Ready to Scale** 🚀

*ZarinGold v3.0 — fartakcomplex*

</div>
