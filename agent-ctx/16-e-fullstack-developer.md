---
Task ID: 16-e
Agent: Full-Stack Developer
Task: BottomNav Enhancement + MiniPriceTicker Widget

Work Log:
- Read existing BottomNav.tsx, AppLayout.tsx, globals.css, MiniPriceTicker.tsx to understand current state
- Verified BottomNav already had most requested features: gold "جدید" badge on Wallet, gold glow on active items (.nav-active-glow), haptic tap feedback (.haptic-tap), gold-themed More drawer (.drawer-gold-panel), red badge count on Notifications in More menu
- Enhanced BottomNav.tsx with improvements:
  - Added `totalUnreadInMore` computed constant that sums badge counts from More menu items (used for notification indicator)
  - Added red notification dot (w-2 h-2) on the "More" button itself when there are unread notifications, so users see there's activity without opening the drawer
  - Added numeric red badge support to NavItemButton (typeof item.badge === 'number') for future extensibility
  - Increased gold glow drop-shadow from 8px to 10px opacity 0.7 for more prominent active state
  - Removed unused imports (X, TrendingUp, LogOut) that were imported but never referenced
- Verified MiniPriceTicker.tsx already exists with full marquee implementation (gold gradient bg, Persian numbers, RTL scroll, h-8, md:hidden)
- Imported MiniPriceTicker into AppLayout.tsx above BottomNav component (mobile only via isMobile guard)
- Updated main content bottom padding from pb-24 (96px) to pb-28 (112px) to accommodate both ticker (32px) and bottom nav
- Ran bun run lint: 0 errors, 0 warnings ✅
- Verified dev server compiles clean with no errors

Stage Summary:
- BottomNav now shows a red notification dot on the "More" button, providing at-a-glance awareness of unread notifications
- MiniPriceTicker widget now renders above the BottomNav on mobile screens in the authenticated layout
- Content padding increased to prevent overlap with both ticker and bottom navigation
- All existing functionality preserved — no breaking changes
- Lint: 0 errors ✅ | Dev server: compiles clean ✅
