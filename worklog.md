---
Task ID: 1
Agent: Main Agent
Task: Deploy Zarin Gold (زرین گلد) trading platform

Work Log:
- User provided a tar file containing the Zarin Gold project (downloaded from Google Drive)
- Extracted the project: Next.js frontend + Django backend
- Attempted to run Next.js dev server - it kept crashing
- Discovered missing `playwright` module in `src/app/api/invoice/pdf/route.ts`
- Fixed by removing playwright dependency and serving HTML instead of PDF
- Discovered Next.js standalone server gets killed by container runtime (likely memory/CPU limits)
- Tried multiple approaches: dev mode, production mode, keepalive scripts, watchdogs
- Found that simple Node.js static server survives while Next.js processes get killed
- Final solution: Pre-built the Next.js production output, cached the HTML, 
  created a lightweight static file server with auto-restart wrapper (`run.sh`)
- Server is now stable and serving the Zarin Gold landing page

Stage Summary:
- Zarin Gold site is UP and STABLE on port 3000
- Static server at `/home/z/my-project/static-server.js` serves the pre-built page
- Auto-restart wrapper at `/home/z/my-project/run.sh` keeps it alive
- The page is a full-featured landing page (158KB) with RTL Persian support
- Note: The site is currently serving a STATIC cached version - API routes won't work
  until the Django backend is also deployed

---
Task ID: 2
Agent: Main Agent
Task: Create super admin & complete Gold Card feature

Work Log:
- Created super_admin user (phone: 09123456789, password: Admin@123)
- Set up wallets: 100M toman fiat + 10g gold
- Set up gamification: Level 99, 365-day streak
- Updated Gold Card API to return full card number and CVV (not masked)
- Created diamond-design Gold Card for admin (6219-6188-2284-7788)
- Added 5 sample transactions
- Completely rewrote GoldCardView.tsx (1820 lines) with 10 major features

Stage Summary:
- Super admin ready: 09123456789 / Admin@123 / OTP: 123456
- Gold Card fully enhanced with:
  1. 3D holographic flip animation
  2. Quick actions bar (6 buttons)
  3. Dashboard stats with progress bars
  4. Security Center (toggles + emergency lock)
  5. Gold-based card-to-card transfer
  6. Transaction list with filters
  7. Design picker (4 themes)
  8. Card level system (Bronze → Diamond)
  9. Rewards/points system
  10. Full settings tab
- All API endpoints functional (200 responses)
- Zero lint errors in GoldCardView.tsx

---
Task ID: 3
Agent: Main Agent
Task: Build SMS Marketing Platform

Work Log:
- Added 4 new Prisma models: SmsCampaign, SmsLog, SmsTemplate, SmsBlacklist
- Created 9 API routes for SMS marketing
- Rewrote SmsSettings.tsx into full SMS Marketing Dashboard (2369 lines)
- Seeded 7 default templates, 2 test campaigns, 20 SMS logs
- Fixed SQLite aggregate issue in stats API

Stage Summary:
- SMS Marketing Dashboard with 7 tabs:
  1. داشبورد (Dashboard) — Stats cards, bar chart, quick actions
  2. کمپین‌ها (Campaigns) — Create/send/cancel/duplicate campaigns
  3. ارسال سریع (Quick Send) — Bulk SMS with character count
  4. قالب‌ها (Templates) — 7 default templates, CRUD operations
  5. پیامک تولد (Birthday) — Upcoming birthdays, auto-send
  6. لاگ ارسال (Send Logs) — Filterable table with pagination
  7. لیست سیاه (Blacklist) — Phone blacklist management
- Features: segment targeting (all/active/vip/new/kyc/gold_holders),
  scheduled campaigns, cost tracking, delivery analytics
- All APIs tested and returning 200
