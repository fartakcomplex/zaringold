---
Task ID: 18-c
Agent: Full-Stack Developer
Task: Enhance MarketView to use real gold prices from useRealGoldPrice hook

Work Log:
- Added useRealGoldPrice hook import along with getSourceLabel and getSourceColor helper exports
- Added RefreshCw icon import from lucide-react
- Rewrote MarketOverviewBar component to use real-time gold prices from the API
- Items: طلاي ۱۸ عيار, سکه امامي, اونس جهاني, دلار
- Added header row with green pulsing live indicator dot when isLive is true
- Added price source label with color-coded text
- Added refresh button with spinner during loading
- All price numbers formatted with Intl.NumberFormat fa-IR for Persian locale
- Preserved all existing styling: card-gold-border, text-gold-gradient, separators
- Lint passes clean: 0 errors, 0 warnings
- Dev server compiles successfully

Stage Summary:
- MarketOverviewBar now displays real-time gold prices from the API
- Live indicator and refresh button provide clear UX feedback
- All 4 market items show real API data with Persian number formatting
