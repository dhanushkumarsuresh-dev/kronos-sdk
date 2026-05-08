# Project Kronos

Serverless Trading Terminal — a Next.js app where the **browser is the clock**, **LocalStorage is the database**, and **Vercel Serverless Functions** execute trades against the eToro Public API.

## Architecture

```
/components
  Dashboard.jsx          4-region grid layout
  PriceChart.jsx         TradingView lightweight-charts (candles + volume)
  PortfolioStrip.jsx     Equity / credit / margin / daily P&L cards
  PositionsTable.jsx     Open positions with SL/TP and P&L
  MarketPanel.jsx        Price stats, volume sparkline, sentiment gauge
  SettingsModal.jsx      Keys, strategy, chart override
  LogViewer.jsx          Trade log
/hooks
  useKronos.js           15-min heartbeat
  useConfig.js           Reactive LocalStorage config
  usePoller.js           Shared visibility-aware polling primitive
  useMarketData.js       Candle polling (30s)
  usePortfolio.js        eToro PnL polling (60s)
  usePositions.js        eToro positions polling (30s)
  useSentimentSnapshot.js Finnhub-backed sentiment polling (5min)
/pages/api
  trade.js               Trade execution engine
  candles.js             Finnhub candle proxy
  portfolio.js           eToro PnL proxy
  positions.js           eToro positions proxy
  sentiment.js           VADER score on demand
/utils
  eToroClient.js         v1 fetch wrappers + level calc + positions fetch
  finnhubClient.js       Candle fetch + symbol mapping (FX/crypto/stock)
  sentiment.js           Finnhub news → VADER compound averaging
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Settings**, paste your eToro public key, eToro user key, and Finnhub key. Save, then click **START KRONOS**.

## Live Panels

- **Portfolio Strip** — equity, available credit, used margin, free margin, daily P&L. Refreshes every 60s while the tab is visible.
- **Price Chart** — TradingView lightweight-charts candlesticks with a volume histogram pinned to the bottom 22% of the chart. 1m / 5m / 15m / 1h / 1d selector. Refreshes every 30s.
- **Market Panel** — last price, range, volume sparkline (last 30 bars), VADER sentiment gauge, and the next-trade direction the engine would take if a cycle ran now.
- **Positions Table** — open positions with side, units, entry, current price, SL, TP, and live P&L. Refreshes every 30s. Falls back gracefully if the eToro positions endpoint is unavailable on your account tier.
- **Trade Log** — color-coded autoscrolling timeline of engine cycles.

All polling pauses automatically when the tab is hidden to spare your API quota.

## How it Works

1. The active browser tab fires `triggerTradeEngine()` every 15 minutes (configurable in `hooks/useKronos.js`).
2. The hook POSTs the LocalStorage config to `/api/trade`.
3. The serverless function:
   - Pulls forex news from Finnhub, scores it with VADER. If `|score| < 0.5`, it holds.
   - Fetches PnL/credit from `public-api.etoro.com/api/v1/trading/info/real/pnl`.
   - Sizes the position so the SL hit caps the loss at `capital * riskPerTrade`.
   - Posts a `Market` order with mandatory `stopLossRate` + `takeProfitRate`.

## eToro Header Triple-Threat

Every request includes:

- `x-request-id` — fresh UUID per call
- `x-api-key` — public app identifier
- `x-user-key` — personal auth token

## Risk Notes

- 30x leverage is unforgiving. The 2% risk cap and SL/TP attachment exist to keep you above eToro's 50% margin close-out trigger.
- Keys live only in this browser's LocalStorage and are forwarded per request — they are **not** stored on Vercel.
- This terminal trades only while the tab is open. Close the tab → engine sleeps.

## Deployment

1. Push to a private GitHub repo.
2. Import into Vercel; deploy with default Next.js settings.
3. Open the deployed URL → Settings → paste keys → Start Kronos.
