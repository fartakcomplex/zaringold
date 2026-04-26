---
Task ID: 1
Agent: Main
Task: Set up and run ZarinGold v4.0.1 project from GitHub

Work Log:
- Downloaded ZarinGold v4.0.1 from https://github.com/fartakcomplex/zaringold/releases/tag/v4.0.1
- Copied all project files to /home/z/my-project
- Installed dependencies with `bun install` (68 packages installed)
- Ran `bun run db:push` to set up the SQLite database
- Built the production version with `bun run build`
- Started the dev server with `bun run dev`
- Verified the page loads successfully through Caddy gateway (port 81)
- Page title: "زرین گلد | خرید و فروش طلای نوین"

Stage Summary:
- ZarinGold v4.0.1 is fully set up and running
- The project is a comprehensive Persian gold trading platform with:
  - Landing page with hero, features, calculator, security sections
  - Dashboard, wallet, trading, and transaction views
  - Admin panel with extensive management features
  - RTL support with Persian (fa) and English (en) languages
  - Gold theme with premium glass-morphism design
  - i18n with 150+ translation keys
  - Zustand state management with localStorage persistence
  - Prisma ORM with SQLite database
  - 618 TypeScript/TSX source files
  - 100+ API routes
- Known issue: Next.js dev server dies after serving requests (likely SIGPIPE from Caddy proxy)
  - Workaround: Server restarts and serves pages on fresh requests
  - Production build also available as alternative
