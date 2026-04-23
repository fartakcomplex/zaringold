---
Task ID: 2-b
Agent: full-stack-developer
Task: Enhance AdminLayout with footer, page transitions, access guard, and key prop

Work Log:
- Read worklog.md to understand project state and previous admin panel work (Tasks 2-a, 23, 24, 25)
- Read current AdminLayout.tsx — had sidebar, header, main content area, toast container
- Checked store.ts for user/adminPage state: user has role field, adminPage is persisted string
- Checked globals.css for existing animation patterns — found .page-transition (0.35s), .page-fade-in (0.35s), many other animations
- Added new CSS class `.admin-page-transition` at end of globals.css — 200ms fade-in with subtle translateY(4px)
- Rewrote AdminLayout.tsx with 4 enhancements:
  1. **Admin footer** — `AdminFooter` component inside flex column with `mt-auto`; shows copyright (© ۱۴۰۴ زرین گلد), version (نسخه ۱.۰.۰), links (قوانین و مقررات, حریم خصوصی); thin design (py-2), border-t border-gold/20, muted text; responsive layout (stacked on mobile, row on sm+)
  2. **Page transition animations** — added `key={adminPage}` on page router wrapper div; uses `admin-page-transition` CSS class; React re-mounts component on adminPage change, triggering 200ms fade-in animation
  3. **Admin access guard** — checks `user?.role === 'admin' || user?.role === 'super_admin'`; if not admin, renders `AdminAccessDenied` full-screen component instead of layout; shows Lock icon with gold glow ring, "دسترسی محدود" title, descriptive message, and version info
  4. **Proper key on AdminPageRouter** — `key={adminPage}` on the wrapper div forces re-mount on page change, triggering CSS animation
- Added `Lock` icon import from lucide-react
- Added `user` and `adminPage` destructured from useAppStore
- All existing imports and routing preserved (11 admin pages, Sheet components, ToastContainer, etc.)
- Ran bun run lint — 0 errors, 0 warnings
- Dev server confirmed running (GET / 200)

Stage Summary:
- AdminLayout.tsx enhanced with 4 new features: footer, page transitions (200ms fade), access guard, key prop
- New CSS animation `.admin-page-transition` added to globals.css (200ms, fade + translateY 4px)
- New components within file: `AdminFooter`, `AdminAccessDenied` (in addition to existing `AdminPageRouter`)
- Footer is inside the flex column (main content area) with `mt-auto` for sticky behavior
- Access denied is a full-screen view replacing entire layout when user lacks admin/super_admin role
- Gold theme styling: border-gold/20, text-gold/70, bg-gold/5, hover:text-gold/80
- All text in Persian; responsive design maintained
- No breaking changes to AdminHeader, AdminSidebar, or any other component
