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
