---
Task ID: 2-b
Agent: Fullstack Developer
Task: Build Advanced Gold Price Chart Component (TradingView-Level)

Summary:
Created a comprehensive, TradingView-level candlestick chart component at `/home/z/my-project/src/components/chart/AdvancedGoldChart.tsx` (~1500 lines).

Key Deliverables:
- Full candlestick chart using lightweight-charts v5 with zoom, pan, drag
- 7 timeframes: 1m, 5m, 15m, 1h, 4h, 1D, 1W (default: 1h)
- 4 technical indicators with toggle controls: RSI (14), MACD (12,26,9), EMA (9,21,50), Bollinger Bands (20,2)
- Comparison mode with USD and BTC normalized percentage lines
- Volume bars with direction-based coloring
- Crosshair with gold-colored dashed lines
- Current price line (gold dashed horizontal)
- OHLCV legend with change percent
- TradingView-inspired dark gradient background
- Mock data generator with realistic gold price range (3M-4.5M Toman)
- Full indicator calculations implemented client-side
- Responsive design with ResizeObserver
- Fullscreen toggle, compact mode
- Loading skeleton and error states
- Framer Motion animations for pane transitions
- i18n support (Persian RTL + English)
- shadcn/ui components (Button, Badge, Switch, DropdownMenu, Tooltip, Skeleton, Separator)
- Lint: 0 errors, 0 warnings

Technical Details:
- All indicator series properly cleaned up on unmount
- Sub-chart time ranges synchronized with main chart
- API fetch with mock data fallback
- Dynamic chart height based on active indicator panes
- Chart stays LTR (financial chart convention) while UI supports RTL
