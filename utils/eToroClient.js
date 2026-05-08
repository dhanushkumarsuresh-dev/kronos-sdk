import { v4 as uuidv4 } from 'uuid';

const ETORO_BASE_URL = 'https://public-api.etoro.com/api/v1';

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

function normalizeMode(mode) {
  return mode === 'real' ? 'real' : 'demo';
}

export async function fetchPnL(apiKeys, mode = 'demo') {
  const m = normalizeMode(mode);
  const res = await fetch(`${ETORO_BASE_URL}/trading/info/${m}/pnl`, {
    headers: buildHeaders(apiKeys),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`eToro PnL fetch failed (${res.status}): ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchPositions(apiKeys, mode = 'demo') {
  const m = normalizeMode(mode);
  const res = await fetch(`${ETORO_BASE_URL}/trading/positions/${m}`, {
    headers: buildHeaders(apiKeys),
  });
  if (!res.ok) {
    const err = new Error(`eToro positions fetch failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function placeOrder(apiKeys, orderPayload) {
  const res = await fetch(`${ETORO_BASE_URL}/orders`, {
    method: 'POST',
    headers: buildHeaders(apiKeys, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`eToro order failed (${res.status}): ${text || 'no body'}`);
  }
  return res.json().catch(() => ({}));
}

const PIP_SIZE = {
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
  AUDUSD: 0.0001,
  USDCAD: 0.0001,
  XAUUSD: 0.1,
};

const APPROX_REFERENCE_PRICE = {
  EURUSD: 1.085,
  GBPUSD: 1.27,
  USDJPY: 152.0,
  AUDUSD: 0.66,
  USDCAD: 1.36,
  XAUUSD: 2300.0,
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

  return {
    entry: round(entry),
    slPrice: round(slPrice),
    tpPrice: round(tpPrice),
  };
}
