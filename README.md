# Project Kronos

Serverless Trading Terminal — a Next.js app where the **browser is the clock**, **LocalStorage is the database**, and **Vercel Serverless Functions** execute trades against the eToro Public API.

## Architecture

```
/components         UI (Dashboard pulse, Settings modal, LogViewer)
/hooks/useKronos.js setInterval heartbeat in the active tab
/pages/index.jsx    Main interface
/pages/api/trade.js Serverless execution engine (lives ~5–10s per cycle)
/utils/sentiment.js Finnhub news + VADER compound score
/utils/eToroClient  eToro v1 fetch wrappers + SL/TP calculator
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Settings**, paste your eToro public key, eToro user key, and Finnhub key. Save, then click **START KRONOS**.

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
