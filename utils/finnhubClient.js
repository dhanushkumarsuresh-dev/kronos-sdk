const FX_PAIRS = new Set([
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF',
  'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'XAUUSD', 'XAGUSD',
]);

const CRYPTO_PAIRS = new Set([
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
]);

export function mapSymbol(asset) {
  const symbol = (asset || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (FX_PAIRS.has(symbol)) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    return { provider: 'forex', symbol: `OANDA:${base}_${quote}` };
  }
  if (CRYPTO_PAIRS.has(symbol)) {
    return { provider: 'crypto', symbol: `BINANCE:${symbol}` };
  }
  return { provider: 'stock', symbol };
}

const RESOLUTION_MAP = {
  '1': '1', '5': '5', '15': '15', '30': '30', '60': '60', 'D': 'D',
  '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '1d': 'D',
};

const RESOLUTION_SECONDS = {
  '1': 60, '5': 300, '15': 900, '30': 1800, '60': 3600, 'D': 86400,
};

export function normalizeResolution(resolution) {
  return RESOLUTION_MAP[resolution] || '15';
}

export async function fetchCandles(finnhubKey, asset, resolution = '15', count = 200, { fetcher = fetch } = {}) {
  if (!finnhubKey) throw new Error('Finnhub key missing.');

  const { provider, symbol } = mapSymbol(asset);
  const res = normalizeResolution(resolution);
  const seconds = RESOLUTION_SECONDS[res];
  const to = Math.floor(Date.now() / 1000);
  const from = to - seconds * count;

  const path =
    provider === 'forex' ? 'forex/candle' : provider === 'crypto' ? 'crypto/candle' : 'stock/candle';

  const url = `https://finnhub.io/api/v1/${path}?symbol=${encodeURIComponent(
    symbol
  )}&resolution=${res}&from=${from}&to=${to}&token=${encodeURIComponent(finnhubKey)}`;

  const response = await fetcher(url);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Finnhub candles failed (${response.status}): ${text}`);
  }
  const data = await response.json();
  if (data.s !== 'ok' || !Array.isArray(data.t)) {
    return { candles: [], symbol, provider };
  }

  const candles = data.t.map((t, i) => ({
    t,
    o: data.o[i],
    h: data.h[i],
    l: data.l[i],
    c: data.c[i],
    v: data.v ? data.v[i] : 0,
  }));

  return { candles, symbol, provider };
}

export async function fetchQuote(finnhubKey, asset, { fetcher = fetch } = {}) {
  if (!finnhubKey) throw new Error('Finnhub key missing.');
  const { provider, symbol } = mapSymbol(asset);
  if (provider !== 'stock') {
    return null;
  }
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
    symbol
  )}&token=${encodeURIComponent(finnhubKey)}`;
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`Finnhub quote failed (${res.status})`);
  return res.json();
}
