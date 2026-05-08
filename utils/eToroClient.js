import { v4 as uuidv4 } from 'uuid';

export const ETORO_BASE_URL = 'https://public-api.etoro.com';

function buildHeaders(apiKeys, extra = {}) {
  if (!apiKeys?.etoroPublic || !apiKeys?.etoroUser) {
    throw new Error('Missing eToro API credentials.');
  }
  return {
    'x-request-id': uuidv4(),
    'x-api-key': apiKeys.etoroPublic,
    'x-user-key': apiKeys.etoroUser,
    ...extra,
  };
}

function modeSeg(mode) {
  return mode === 'real' ? '' : 'demo/';
}

async function asJsonOr(response, label) {
  const ok = response.ok;
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!ok) {
    const err = new Error(
      `${label} failed (${response.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`
    );
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

// PnL endpoint uses literal /demo/ or /real/ segment (the only endpoint that does)
export async function fetchPnL(apiKeys, mode = 'demo', { fetcher = fetch } = {}) {
  const m = mode === 'real' ? 'real' : 'demo';
  const url = `${ETORO_BASE_URL}/api/v1/trading/info/${m}/pnl`;
  const res = await fetcher(url, { method: 'GET', headers: buildHeaders(apiKeys) });
  return asJsonOr(res, 'eToro PnL fetch');
}

// Portfolio endpoint: real has no segment, demo prefixed with demo/
export async function fetchPortfolio(apiKeys, mode = 'demo', { fetcher = fetch } = {}) {
  const url = `${ETORO_BASE_URL}/api/v1/trading/info/${modeSeg(mode)}portfolio`;
  const res = await fetcher(url, { method: 'GET', headers: buildHeaders(apiKeys) });
  return asJsonOr(res, 'eToro Portfolio fetch');
}

// Market order: real has no segment, demo prefixed with demo/
export async function placeMarketOrder(apiKeys, mode, body, { fetcher = fetch } = {}) {
  const url = `${ETORO_BASE_URL}/api/v1/trading/execution/${modeSeg(mode)}market-open-orders/by-amount`;
  const res = await fetcher(url, {
    method: 'POST',
    headers: buildHeaders(apiKeys, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return asJsonOr(res, 'eToro market-order placement');
}

export async function fetchRates(apiKeys, instrumentIds, { fetcher = fetch } = {}) {
  const ids = Array.isArray(instrumentIds) ? instrumentIds.join(',') : instrumentIds;
  const url = `${ETORO_BASE_URL}/api/v1/market-data/instruments/rates?instrumentIds=${encodeURIComponent(ids)}`;
  const res = await fetcher(url, { headers: buildHeaders(apiKeys) });
  return asJsonOr(res, 'eToro rates fetch');
}

export async function searchInstruments(apiKeys, query, { fetcher = fetch } = {}) {
  const url = `${ETORO_BASE_URL}/api/v1/market-data/search?query=${encodeURIComponent(query)}`;
  const res = await fetcher(url, { headers: buildHeaders(apiKeys) });
  return asJsonOr(res, 'eToro instrument search');
}

// Built-in cache for symbol → InstrumentID lookups (kept in module scope; resets on cold start)
const INSTRUMENT_CACHE = new Map();

// Seed values are well-known FX/commodity InstrumentIDs from eToro's public docs/community.
// If a symbol is missing here, resolveInstrumentId will hit the search endpoint.
const KNOWN_INSTRUMENT_IDS = {
  EURUSD: 1,
  GBPUSD: 2,
  USDCHF: 3,
  USDJPY: 4,
  AUDUSD: 5,
  USDCAD: 6,
  NZDUSD: 7,
  EURGBP: 8,
  EURJPY: 9,
  GBPJPY: 10,
};

export async function resolveInstrumentId(apiKeys, symbol, { fetcher = fetch } = {}) {
  const sym = (symbol || '').toUpperCase();
  if (!sym) throw new Error('Missing symbol for instrument resolution.');
  if (INSTRUMENT_CACHE.has(sym)) return INSTRUMENT_CACHE.get(sym);
  if (KNOWN_INSTRUMENT_IDS[sym]) {
    INSTRUMENT_CACHE.set(sym, KNOWN_INSTRUMENT_IDS[sym]);
    return KNOWN_INSTRUMENT_IDS[sym];
  }
  const result = await searchInstruments(apiKeys, sym, { fetcher });
  const list = Array.isArray(result) ? result : result?.instruments || result?.results || [];
  const match =
    list.find((x) => (x.symbol || x.ticker || x.symbolFull || '').toUpperCase() === sym) || list[0];
  const id = match?.instrumentId ?? match?.id;
  if (!id) throw new Error(`No InstrumentID found for symbol ${sym}.`);
  INSTRUMENT_CACHE.set(sym, id);
  return id;
}

const PIP_SIZE = {
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, AUDUSD: 0.0001,
  USDCAD: 0.0001, USDCHF: 0.0001, NZDUSD: 0.0001, EURGBP: 0.0001,
  EURJPY: 0.01, GBPJPY: 0.01, XAUUSD: 0.1,
};

const APPROX_REFERENCE_PRICE = {
  EURUSD: 1.085, GBPUSD: 1.27, USDJPY: 152.0, AUDUSD: 0.66,
  USDCAD: 1.36, USDCHF: 0.88, NZDUSD: 0.61, EURGBP: 0.86,
  EURJPY: 165.0, GBPJPY: 193.0, XAUUSD: 2300.0,
};

export function calculateLevels(isBullish, rewardRatio, asset = 'EURUSD', spotPrice) {
  const symbol = asset.toUpperCase();
  const pip = PIP_SIZE[symbol] ?? 0.0001;
  const entry = spotPrice ?? APPROX_REFERENCE_PRICE[symbol] ?? 1;

  const stopDistance = 20 * pip;
  const takeDistance = stopDistance * Math.max(1, rewardRatio);

  const slPrice = isBullish ? entry - stopDistance : entry + stopDistance;
  const tpPrice = isBullish ? entry + takeDistance : entry - takeDistance;

  const round = (value) => {
    const decimals = pip < 0.001 ? 5 : pip < 0.01 ? 3 : 2;
    return Number(value.toFixed(decimals));
  };

  return { entry: round(entry), slPrice: round(slPrice), tpPrice: round(tpPrice) };
}
