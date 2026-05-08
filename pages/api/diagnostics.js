import { fetchPnL, fetchPortfolio } from '../../utils/eToroClient';
import { fetchCandles } from '../../utils/finnhubClient';
import { calculateSentiment } from '../../utils/sentiment';
import { createLogger } from '../../utils/httpLog';

async function timed(fn) {
  const start = Date.now();
  try {
    const result = await fn();
    return { ok: true, latencyMs: Date.now() - start, result };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      status: error.status,
      error: error.message,
    };
  }
}

function hint(check) {
  if (check.ok) return undefined;
  const e = (check.error || '').toLowerCase();
  if (check.status === 403) {
    return 'Switch Account Mode (Real ⇄ Demo) or get the app scopes approved on api-portal.etoro.com.';
  }
  if (check.status === 404) {
    return 'Endpoint missing — verify path against the eToro OpenAPI spec.';
  }
  if (check.status === 401) {
    return 'Auth rejected — regenerate eToro keys or check Finnhub token.';
  }
  if (e.includes('finnhub')) {
    return 'Check Finnhub key validity and free-tier limits.';
  }
  if (e.includes('missing')) {
    return 'Open Settings and add the missing key.';
  }
  return undefined;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys = {}, mode = 'demo', asset = 'EURUSD', verbose = true } = req.body || {};
  const logger = createLogger({ verbose });

  const hasEtoro = Boolean(apiKeys.etoroPublic && apiKeys.etoroUser);
  const hasFinnhub = Boolean(apiKeys.finnhub);

  const [pnl, portfolio, candles, sentiment] = await Promise.all([
    hasEtoro
      ? timed(() => fetchPnL(apiKeys, mode, { fetcher: logger.fetch }))
      : Promise.resolve({ ok: false, latencyMs: 0, error: 'Missing eToro credentials' }),
    hasEtoro
      ? timed(() => fetchPortfolio(apiKeys, mode, { fetcher: logger.fetch }))
      : Promise.resolve({ ok: false, latencyMs: 0, error: 'Missing eToro credentials' }),
    hasFinnhub
      ? timed(() => fetchCandles(apiKeys.finnhub, asset, '15', 30, { fetcher: logger.fetch }))
      : Promise.resolve({ ok: false, latencyMs: 0, error: 'Missing Finnhub key' }),
    hasFinnhub
      ? timed(() => calculateSentiment(apiKeys.finnhub, asset, { fetcher: logger.fetch }))
      : Promise.resolve({ ok: false, latencyMs: 0, error: 'Missing Finnhub key' }),
  ]);

  const checks = [
    {
      name: 'eToro PnL',
      service: 'eToro',
      endpoint: `/api/v1/trading/info/${mode}/pnl`,
      ...pnl,
      sample: pnl.ok ? summarizePnl(pnl.result) : null,
      hint: hint(pnl),
    },
    {
      name: 'eToro Portfolio',
      service: 'eToro',
      endpoint: `/api/v1/trading/info/${mode === 'real' ? '' : 'demo/'}portfolio`,
      ...portfolio,
      sample: portfolio.ok ? summarizePortfolio(portfolio.result) : null,
      hint: hint(portfolio),
    },
    {
      name: 'Finnhub candles',
      service: 'Finnhub',
      endpoint: 'finnhub.io/api/v1/{forex|crypto|stock}/candle',
      ...candles,
      sample: candles.ok
        ? { candleCount: candles.result?.candles?.length ?? 0, symbol: candles.result?.symbol }
        : null,
      hint: hint(candles),
    },
    {
      name: 'Finnhub sentiment',
      service: 'Finnhub',
      endpoint: 'finnhub.io/api/v1/news?category=forex',
      ...sentiment,
      sample: sentiment.ok ? { score: sentiment.result } : null,
      hint: hint(sentiment),
    },
  ];

  return res.status(200).json({
    ok: checks.every((c) => c.ok),
    checks,
    generatedAt: new Date().toISOString(),
    debug: { requests: logger.entries },
  });
}

function summarizePnl(d) {
  if (!d) return null;
  return {
    equity: d.equity,
    credit: d.credit,
    usedMargin: d.usedMargin ?? d.marginUsed,
    profit: d.profit ?? d.dailyPnL,
  };
}

function summarizePortfolio(d) {
  if (!d) return null;
  const list = Array.isArray(d?.positions) ? d.positions : Array.isArray(d) ? d : [];
  return { positionCount: list.length };
}
