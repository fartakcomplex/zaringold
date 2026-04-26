---
Task ID: 1
Agent: Main Agent
Task: Build Zaringold v2.9.4 - Smart Gold Trading Platform Website

Work Log:
- Fetched and analyzed GitHub release page for zaringold v2.9.4 via agent-browser
- Read the main repository README to understand the full project scope
- Updated layout.tsx with RTL (dir="rtl", lang="fa"), Vazirmatn Persian font, ThemeProvider, and proper metadata
- Created comprehensive Zaringold components in src/components/zaringold/:
  - Navbar.tsx - Sticky glassmorphism navbar with price ticker, mobile menu (Sheet), theme toggle
  - HeroSection.tsx - Animated hero with floating gold particles, live price display, stats bar, CTA buttons
  - GoldPrices.tsx - Live gold price cards with sparkline charts, auto-refresh every 10s
  - Sparkline.tsx - Recharts-based mini sparkline component
  - FeatureGrid.tsx - 6 feature cards with stagger animations (Trading, Wallet, AI, Gateway, Services, Gamification)
  - MobileServices.tsx - SIM card operator selection (MCI, Irancell, Rightel, Taliya) with SVG logos, charge purchase form
  - ServicesGrid.tsx - Comprehensive services grid (Insurance, Utility Bills, Vehicle Services, Gold Card)
  - WalletOverview.tsx - Dual wallet view (Fiat + Gold) with recent transactions
  - AIAdvisor.tsx - Interactive AI chat interface with simulated responses
  - ThemeToggle.tsx - Dark/Light mode toggle using useSyncExternalStore
  - Footer.tsx - Site footer with links, social media, copyright
- Created API endpoints:
  - /api/gold-prices/route.ts - Mock gold price data with sparkline generation
  - /api/services/charge/route.ts - Charge purchase API with validation
- Updated Prisma schema with GoldPrice, Transaction, ServiceOrder models
- Pushed schema to database with bun run db:push
- ESLint passes clean with zero errors
- Dev server running and serving pages correctly (200 status codes)

Stage Summary:
- Full Zaringold v2.9.4 website built as a single-page Next.js application
- All text in Persian/Farsi with RTL layout
- Gold-themed design with dark/light mode support
- Interactive features: live gold prices, mobile services, AI advisor chat, wallet overview
- Responsive design with mobile-first approach
- Files created: 13 components, 2 API routes, updated layout, page, prisma schema
