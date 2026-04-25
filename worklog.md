# ZarinGold v2.9.0 - Project Setup Worklog

## Project Overview
ZarinGold (زرین گلد) is a comprehensive gold trading and investment platform built with Next.js 16.

## Current Status: Successfully Deployed

### Setup Steps Completed:
1. **Repository Clone**: Cloned `https://github.com/fartakcomplex/zaringold` and checked out the latest release tag `v2.9.0`
2. **File Migration**: Copied all project files to `/home/z/my-project/` including:
   - `src/` - All source code (components, API routes, hooks, lib)
   - `prisma/schema.prisma` - Full database schema (1737 lines, 80+ models)
   - `mini-services/` - Chat service (Socket.IO on port 3005)
   - `public/` - Fonts (IRANSans), images, uploads
   - Configuration files (package.json, tailwind.config.ts, next.config.ts, etc.)
3. **Dependencies**: Installed all packages via `bun install` (68 packages)
4. **Database**: Prisma schema pushed to SQLite, database already in sync
5. **Services**: Chat-service started on port 3005
6. **Dev Server**: Next.js 16.1.3 (Turbopack) running on port 3000

### Key Features in v2.9.0:
- Gold trading (buy/sell) with real-time prices
- Wallet system (fiat + gold)
- Payment gateway integration (ZarinPal)
- User authentication (OTP-based, password login)
- KYC verification system
- Blog/CMS system
- Chat support with AI
- Gold Card (virtual/physical)
- Merchant payment gateway
- Savings goals & auto-buy plans
- Gamification (achievements, daily check-in, quests)
- Creator club (UGC content)
- Insurance, car services, utility payments
- Admin dashboard with comprehensive management
- SMS & Email marketing
- Landing page builder
- And many more features...

### Running Services:
- **Next.js Dev Server**: Port 3000 (main application)
- **Chat Service**: Port 3005 (Socket.IO + HTTP)

### Database:
- SQLite at `file:/home/z/my-project/db/custom.db`
- 80+ models covering all platform features

### Current Goals:
- Application is running and serving pages
- All API routes are available
- Landing page renders correctly (GET / 200)

### Unresolved Issues:
- Need to seed initial data (prices, site settings, landing sections)
- Some external integrations (SMS, email) need API key configuration
- Telegram bot needs configuration

---
Task ID: 1
Agent: Main Agent
Task: Add English translations to landing pages (Terms, Privacy, Contact, Blog, BlogPostDetail)

Work Log:
- Analyzed existing i18n system (`src/lib/i18n.ts` with `useTranslation` hook)
- Identified 5 landing page components with hardcoded Farsi text
- Updated TermsPage.tsx: Added bilingual sections (7 articles, 38 content items, all UI strings)
- Updated PrivacyPage.tsx: Added bilingual sections (6 sections, 6 quick badges, all UI strings)
- Updated ContactPage.tsx: Added bilingual contact info, departments, social links, form labels
- Updated BlogPage.tsx: Added bilingual mock data (8 posts, categories), UI strings, date formatting
- Updated BlogPostDetailPage.tsx: Added bilingual UI strings (back button, share, meta labels)
- Verified all files compile with no new lint errors
- Dev server running and serving pages correctly (200)

Stage Summary:
- All 5 landing pages now support both Farsi (fa) and English (en) via `useTranslation` hook
- Translations use local locale-conditional objects (not i18n.ts keys) for long-form content
- Date formatting is locale-aware (fa-IR for Farsi, en-US for English)
- Direction (RTL/LTR) handled correctly in ContactPage form fields
- No changes to i18n.ts needed - all translations kept local to each component

---
Task ID: 2
Agent: Main Agent
Task: Fix mobile landing preview button overlap with bottom nav

Work Log:
- Modified `src/components/landing/LandingPreviewToggle.tsx`
- Changed mobile `bottom-4` to `bottom-20` to avoid overlap with fixed footer navigation

Stage Summary:
- Landing preview toggle button no longer overlaps with mobile bottom navigation bar

---
Task ID: 3
Agent: Main Agent
Task: Remove login requirement, auto-login as super_admin for testing

Work Log:
- Modified `src/stores/authStore.ts` to hardcode super_admin user state
- Set `isAuthenticated: true` with super_admin role and default user data

Stage Summary:
- Application now auto-logs in as super_admin without requiring credentials

---
Task ID: 4
Agent: Main Agent
Task: Rename "util" service label to "فروش شارژ و پرداخت قبوض" in admin panel

Work Log:
- Verified AdminSidebar.tsx already has label "فروش شارژ و پرداخت قبوض" (line 103)
- Verified i18n.ts has `admin.utilityOrders: 'فروش شارژ و پرداخت قبوض'` (both fa and en)
- Fixed `nav.utility` i18n key from "خدمات_util" to proper Persian/English labels

Stage Summary:
- Admin panel utility services tab shows "فروش شارژ و پرداخت قبوض" in Farsi and "Charge Sales & Bill Payment" in English

---
Task ID: 5
Agent: Main Agent
Task: Push to GitHub and create release v2.9.3

Work Log:
- Pushed 2 new commits to `fartakcomplex/zaringold` main branch
- Created GitHub release v2.9.3 with comprehensive changelog (Farsi + English)
- Release URL: https://github.com/fartakcomplex/zaringold/releases/tag/v2.9.3

Stage Summary:
- v2.9.3 released with all recent changes (label rename, auto-login, mobile fix, English translations)
- Cron job for webDevReview every 15 minutes attempted but failed due to auth infrastructure issue (non-blocking)

---
Task ID: 6
Agent: Main Agent
Task: Redesign mobile UI for Insurance, Charge/Bill Payment, and Car Services

Work Log:
- Added MobileQuickActions for insurance (شخص ثالث, آتش‌سوزی, بدنه, بیمه‌نامه‌ها)
- Added MobileQuickActions for utility (شارژ, اینترنت, قبوض, تاریخچه)
- Added MobileQuickActions for car-services (تعویض روغنی, بیمه خودرو, ثبت خودرو, سفارش‌ها)
- Added missing icon imports (Shield, Flame, Car, Wrench, ShieldAlert) to MobileQuickActions.tsx
- Redesigned InsuranceView.tsx: compact header, hero banner, quick access 4x2 category grid with colored icons, back button on sub-views
- Redesigned UtilityServicesView.tsx: compact header, hero banner, tab labels always visible on mobile (removed `hidden sm:inline`)
- Redesigned CarServicesView.tsx: compact header with inline add-car button, hero banner

Stage Summary:
- All 3 service pages now have app-like mobile UI with:
  - Compact sticky headers with icon + title + quick action buttons
  - Gradient hero banners for visual appeal
  - Quick access grids (4 columns) for fast category/service navigation
  - MobileQuickActions for iOS-style quick action buttons
  - Always-visible tab labels on mobile
  - Proper touch-friendly sizing and spacing

---
Task ID: 7
Agent: Main Agent
Task: Replace emoji operator icons with real SIM card operator logos

Work Log:
- Created `/src/components/utility-services/operators/OperatorLogos.tsx` with SVG logo components:
  - MCILogo: Yellow circle with "MCI" letter mark (همراه اول brand)
  - IrancellLogo: Orange rounded rect with signal wave pattern (ایرانسل brand)
  - RightelLogo: Purple gradient with "R" letter mark (رایتل brand)
  - TaliyaLogo: Teal circle with "T" letter mark (تالیا brand)
  - ShatelLogo: Blue rounded rect (شاتل موبایل brand, optional)
- Updated `UtilityServicesView.tsx`:
  - Imported real logo components instead of using emoji icons (📱📲📶☕)
  - Updated OPERATORS constant to remove `icon` property
  - Replaced emoji rendering in topup operator selection with SVG logos (44px size)
  - Replaced emoji rendering in internet operator selection with SVG logos
  - Updated operator auto-detection hint to show logo + name badge
  - Updated summary card to show operator logo next to operator name
  - Updated history list to show operator logo in each transaction item
- Updated `AdminServices.tsx`:
  - Imported operator logo components
  - Replaced generic Lucide icons (Smartphone, Wifi, Phone) in API settings with real logos
  - Updated operator column in orders table to show logo next to operator name

Stage Summary:
- All 4 Iranian SIM card operators (MCI, Irancell, Rightel, Taliya) now show their branded SVG logos
- Logos appear in: operator selection grids, phone number detection hints, payment summary, transaction history, admin API settings, admin orders table
- Professional app-like appearance with brand-accurate colors and design elements
- No external image dependencies - all logos are inline SVG components

---
Task ID: 8
Agent: Main Agent
Task: Fix mobile black screen (70% of page covered) and scrolling issue

Work Log:
- Investigated mobile layout structure in `AppLayout.tsx`
- Found root cause: Content wrapper div had `h-0 min-h-0` which set height to literally 0px
  - Parent root div was `flex` (row direction), so `flex-1` on child only affected WIDTH, not HEIGHT
  - Combined with `overflow-hidden` on parent, the 0px height content was clipped
  - In dark mode, the dark background (oklch(0.08)) showed through as a "black screen"
- Fixed root div: Added `flex-col` on mobile so `flex-1` on children controls HEIGHT
  - Before: `isMobile ? 'h-dvh overflow-hidden'`
  - After: `isMobile ? 'h-dvh flex-col overflow-hidden'`
- Fixed content wrapper: Removed `h-0` so height is determined by flex stretch
  - Before: `isMobile ? 'h-0 min-h-0'`
  - After: `isMobile ? 'min-h-0'`
- Fixed mobile scrolling: Added `user-select: auto` to scrollable `<main>` element
  - Body has `user-select: none` globally which can interfere with touch scrolling on some mobile browsers
  - Added `WebkitUserSelect: 'auto', userSelect: 'auto'` to main element's style prop
  - Added `main` to CSS selector list for re-enabling user-select
- Server compiled successfully and serves 200 responses

Stage Summary:
- Mobile black screen issue fixed (content area was 0px height due to CSS bug)
- Mobile scrolling fixed (re-enabled user-select on scrollable content area)
- Changed files: `src/components/layout/AppLayout.tsx`, `src/app/globals.css`

---
Task ID: 3 (Docker & K8s)
Agent: Main Agent
Task: Create Docker & Kubernetes deployment configs for scaling to 1M+ concurrent users

Work Log:
- Created 38 deployment configuration files across Docker, Kubernetes, and Helm
- Created `Dockerfile` - Multi-stage production build (deps → build → runner) with:
  - node:20-alpine base, corepack + bun support
  - Prisma client generation in build stage
  - Standalone Next.js output with dumb-init entrypoint
  - Non-root user (nextjs:1001), read-only filesystem, dropped capabilities
  - Health check on /api/health, 60s grace period
- Created `.dockerignore` - Comprehensive Next.js dockerignore (excludes node_modules, .next, .env, deploy/, db/, docs/, etc.)
- Created `docker-compose.yml` - Full development/staging stack with:
  - nextjs-app (port 3000), chat-service (port 3005), price-service (port 3006), telegram-bot
  - redis (7-alpine, 512mb maxmemory, LRU, AOF persistence, auth)
  - postgres (16-alpine, production migration path)
  - nginx (reverse proxy with SSL-ready config)
  - prometheus + grafana (monitoring with dashboards)
  - 3 isolated networks (backend/internal, frontend, monitoring/internal)
  - 8 persistent volumes (app-data, uploads, chat-logs, redis, postgres, nginx-logs, prometheus, grafana)
  - Resource limits, health checks, structured logging for all services
- Created `deploy/kubernetes/base/` - 11 base K8s manifests:
  - namespace.yaml (zaringold namespace with labels)
  - configmap.yaml (feature flags, Redis config, rate limits, CORS, session TTL, logging)
  - secret.yaml (template with DATABASE_URL, REDIS, JWT, ZarinPal, SMS, SMTP, Telegram, AI keys)
  - service-account.yaml (automountServiceAccountToken: false)
  - nextjs-deployment.yaml (3 replicas, rolling update, topologySpreadConstraints for multi-zone,
    podAntiAffinity, initContainers for Redis/Postgres wait, liveness/readiness/startup probes,
    2 CPU / 2Gi memory limits, PVC for uploads, emptyDir tmp+cache, preStop lifecycle)
  - chat-service-deployment.yaml (2 replicas, Socket.IO ready, ClientIP session affinity)
  - price-service-deployment.yaml (2 replicas, external API egress)
  - nextjs-service.yaml (ClusterIP port 3000)
  - chat-service-service.yaml (ClusterIP + headless service for Socket.IO direct pod addressing)
  - hpa.yaml (Next.js: 3-50 pods CPU70%/Mem80%, Chat: 2-20 pods, Price: 2-10 pods, custom scaleUp/scaleDown behavior)
  - pdb.yaml (minAvailable: 1 for nextjs/chat, maxUnavailable: 1 for price)
  - network-policy.yaml (3 policies restricting pod communication, DNS/Redis/Postgres egress)
- Created `deploy/kubernetes/overlays/production/` - Production kustomize overlay:
  - kustomization.yaml (5 replicas, 4CPU/4Gi limits, production labels, env secrets, configmap merge)
  - hpa-patch.yaml (scale 5-100 pods with aggressive scaleUp: 200%/15s, conservative scaleDown)
  - ingress.yaml (NGINX Ingress with TLS, rate limiting 100rps/30conn, CORS, security headers,
    CSP, Socket.IO sticky sessions via cookie affinity, WebSocket support, cert-manager annotations)
- Created `deploy/kubernetes/overlays/staging/` - Staging kustomize overlay:
  - kustomization.yaml (2 replicas, 1Gi limits, namePrefix: staging-, relaxed rate limits, debug logging)
  - ingress.yaml (single host staging.zaringold.ir, letsencrypt-staging, wildcard CORS)
- Created `deploy/helm/zaringold/` - Full Helm chart (17 template files):
  - Chart.yaml (zaringold v3.0.0, type: application)
  - values.yaml (comprehensive 400+ line config: replicas, resources, autoscaling, ingress,
    topologySpread, nodeSelector, tolerations, affinity, securityContext, initContainers,
    probes, lifecycle, persistence, monitoring, Redis/PostgreSQL sub-chart config, networkPolicy)
  - _helpers.tpl (15 named templates: labels, selectors, image refs, serviceAccount, secretEnvs)
  - Templates: namespace, configmap, secret, serviceaccount, deployment, chat-deployment,
    price-deployment, service, chat-service, hpa, ingress, pdb, networkpolicy, pvc, NOTES.txt
- Created `deploy/scripts/deploy.sh` - Comprehensive deployment script:
  - Prerequisites check (kubectl, helm, kustomize, cluster access)
  - Namespace creation with labels
  - Secrets management from .env.secrets files
  - Helm deploy/install/uninstall/rollback
  - Kustomize deploy (as alternative)
  - Status reporting (pods, services, HPA, ingress, PDB)
  - Rollout wait with configurable timeout
  - Log tailing
  - Colorized output, dry-run, --wait, --timeout flags

Stage Summary:
- Complete Docker + Kubernetes + Helm deployment infrastructure for 1M+ concurrent users
- Multi-stage Dockerfile optimized for minimal image size with security hardening
- docker-compose.yml provides full local/staging environment with monitoring
- K8s base manifests with production best practices (PodSecurityContext, NetworkPolicy, PDB, topology spread)
- Production overlay scales to 5-100 pods with aggressive auto-scaling and rate limiting
- Staging overlay provides cost-effective smaller deployment
- Helm chart offers maximum configurability with 400+ lines of values
- Socket.IO handled with sticky sessions (cookie affinity + headless service)
- Redis configured for pub/sub, caching, and session storage with persistence
- All deployments include init containers, health probes, resource limits, and lifecycle hooks

---
Task ID: 8-9-10
Agent: Main Agent
Task: Add observability, health checks, and distributed rate limiting for 1M+ concurrent users

Work Log:
- Created `src/lib/middleware/rate-limiter.ts` - Distributed rate limiter with:
  - Redis-based sliding window with in-memory fallback (50% limit reduction)
  - Three strategies: fixed-window, sliding-window, token-bucket
  - Per-user and per-IP rate limiting via identifier composition
  - Route-based rate configs: auth (5/min), payment (10/min), gold (30/min), chat (60/min), api (100/min), pages (200/min)
  - X-RateLimit-Limit/Remaining/Reset + Retry-After headers
  - Redis Lua scripts for atomic counter operations
  - Graceful degradation with automatic Redis health checking
- Created `src/lib/middleware/request-logger.ts` - Structured request logger with:
  - Pino-compatible JSON output with configurable pretty-print
  - Request ID generation and tracking (X-Request-ID)
  - Response time measurement and log correlation
  - User agent parsing (browser, OS, device type detection)
  - IP extraction from X-Forwarded-For / X-Real-IP headers
  - Log levels: debug, info, warn, error, fatal with configurable min level
  - Sensitive field redaction (password, token, OTP, etc.)
  - Geolocation stub (GeoInfo interface ready for integration)
- Created `src/lib/middleware/circuit-breaker.ts` - Circuit breaker pattern with:
  - Three states: CLOSED, OPEN, HALF_OPEN with configurable transitions
  - Configurable failure threshold, reset timeout, success threshold, call timeout
  - Per-service circuit breakers via registry pattern
  - Async and sync execution through breakers with timeout wrapping
  - State change callbacks and metric reporting hooks
  - Pre-configured breakers: payment-gateway, sms-provider, email-provider, gold-price-feed
- Created `src/lib/observability/metrics.ts` - Prometheus-compatible metrics collector with:
  - Counter, Histogram, Gauge metric types with custom labels
  - Pre-registered application metrics: http_requests_total, http_request_duration_ms, http_requests_in_progress, active_connections, cache_operations_total, errors_total, circuit_breaker_state, business_events_total, gold_trades_total, gold_trade_amount, queue_length, rate_limit_total, wallet_operations_total
  - Default latency buckets (5ms-10s) and size buckets
  - Histogram timer API (startTimer returns end function)
  - Approximate percentile calculation from bucket counts
  - Process-level metrics: uptime, memory (rss, heap, external)
  - Clean Prometheus text format serialization
- Created `src/lib/observability/health.ts` - Health check system with:
  - Database connectivity check (SQLite with query timeout)
  - Memory usage monitoring (heap, RSS with degradation thresholds)
  - CPU availability check
  - Filesystem accessibility check (uploads directory)
  - External APIs health via circuit breaker status aggregation
  - Health check registry with per-check timeout configuration
  - Health history tracking (last 100 checks) with auto-recovery logging
  - Critical vs non-critical check classification
  - Periodic health check runner (30s default interval)
- Created `src/lib/observability/tracer.ts` - Lightweight distributed tracing with:
  - Span creation with trace/span ID generation (crypto.getRandomValues)
  - Trace context propagation (W3C traceparent, B3, custom X-Trace-Id headers)
  - Span events, attributes, error recording, status management
  - Parent-child span relationships for nested tracing
  - Configurable sampling rate (0.0-1.0, 10% in production, 100% in dev)
  - No-op span optimization for unsampled traces
  - Active span tracking and completed trace history
  - within() method for automatic span lifecycle management
- Created `src/app/api/health/live/route.ts` - Liveness probe: returns 200 with PID + uptime
- Created `src/app/api/health/ready/route.ts` - Readiness probe: runs all health checks, returns 503 on critical failure
- Created `src/app/api/metrics/route.ts` - Prometheus endpoint: text/plain v0.0.4 format
- Updated `src/lib/db.ts` - Enhanced database configuration with:
  - Configurable connection timeout (10s default), query timeout (30s default)
  - Connection pool size config for PostgreSQL migration path
  - Retry wrapper with exponential backoff + jitter (3 attempts default)
  - Query timeout wrapper with Promise.race
  - Connection health monitoring with 10s cache
  - Smart error classification for retry decisions (connection/timeout vs constraint/validation)
  - Config export for observability dashboards
- Created barrel exports: `src/lib/observability/index.ts`, `src/lib/middleware/index.ts`
- All TypeScript compiles cleanly (no new errors; pre-existing errors in mini-services/telegram-bot only)

Stage Summary:
- Full observability stack for production deployment at 1M+ concurrent scale
- Rate limiting supports Redis distributed mode with automatic in-memory fallback
- Circuit breaker pattern protects against cascading external service failures
- Prometheus metrics cover HTTP, business, trading, and infrastructure dimensions
- Health system distinguishes liveness (process alive) from readiness (all deps OK)
- Distributed tracing supports W3C and B3 propagation standards
- All components are lightweight with zero external dependencies

---
Task ID: PG-Migration
Agent: Main Agent
Task: مهاجرت کامل دیتابیس از SQLite به PostgreSQL

Work Log:
- بررسی جامع تمام وابستگی‌های SQLite در پروژه (10 فایل شناسایی شد)
- نصب PostgreSQL 16.9 از سورس (build from source) در ~/.local/pgsql
- راه‌اندازی PostgreSQL با تنظیمات بهینه (200 connections, 256MB shared buffers)
- ایجاد دیتابیس zaringold با user=zaringold
- تغییر prisma/schema.prisma از provider=sqlite به provider=postgresql
- رفع خطای FK constraint name duplication (CreatorSubmission و CreatorReward) با اضافه کردن map
- به‌روزرسانی .env DATABASE_URL به PostgreSQL
- بازنویسی src/lib/db.ts: حذف sqlite_BUSY، اضافه کردن خطاهای PostgreSQL retry
- بازنویسی src/lib/observability/health.ts: تغییر پیام‌ها به PostgreSQL
- بازنویسی src/lib/backup.ts کامل برای pg_dump/psql
- بازنویسی src/lib/easy-installer.ts: اطلاعات‌شماری و pg_dump
- به‌روزرسانی docker-compose.yml: 3 سرویس به PostgreSQL متصل شدند
- به‌روزرسانی UI کامپوننت‌ها: AdminEasyInstaller و AdminBackups (SQLite → PostgreSQL)
- اجرای prisma db push: 97 جدول ساخته شد
- مهاجرت 8 ردیف داده CarServiceCategory از SQLite به PostgreSQL

Stage Summary:
- PostgreSQL 16.9 نصب و راه‌اندازی شد (port 5432)
- 97 جدول در PostgreSQL ایجاد شد
- 8 ردیف داده با موفقیت مهاجرت شد
- همه فایل‌های کد از SQLite به PostgreSQL تبدیل شدند
- سیستم بکاپ از file-copy به pg_dump تغییر کرد
- Docker Compose تمام سرویس‌ها را به PostgreSQL وصل کرد

### Current Database:
- PostgreSQL 16.9 at `postgresql://zaringold@localhost:5432/zaringold`
- 97 tables covering all platform features
- 8 migrated data rows (CarServiceCategory)
