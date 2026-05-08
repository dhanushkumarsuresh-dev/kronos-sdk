import { fetchPortfolio } from '../../utils/eToroClient';
import { createLogger } from '../../utils/httpLog';

function normalize(position) {
  return {
    id: position?.positionId ?? position?.id ?? '',
    instrument:
      position?.instrument ??
      position?.symbol ??
      (position?.instrumentId != null ? `#${position.instrumentId}` : ''),
    direction: position?.action ?? position?.direction ?? (position?.isBuy ? 'BUY' : 'SELL'),
    units: Number(position?.units ?? position?.amount ?? 0),
    entry: Number(position?.openRate ?? position?.entry ?? 0),
    current: Number(position?.currentRate ?? position?.current ?? 0),
    pnl: Number(position?.profit ?? position?.pnl ?? 0),
    stopLoss: Number(position?.stopLossRate ?? position?.stopLoss ?? 0),
    takeProfit: Number(position?.takeProfitRate ?? position?.takeProfit ?? 0),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, mode = 'demo', verbose = true } = req.body || {};
  const logger = createLogger({ verbose });
  const debug = () => ({ requests: logger.entries });

  if (!apiKeys?.etoroPublic || !apiKeys?.etoroUser) {
    return res.status(400).json({ message: 'Missing eToro credentials.', debug: debug() });
  }

  try {
    const data = await fetchPortfolio(apiKeys, mode, { fetcher: logger.fetch });
    const list = Array.isArray(data?.positions)
      ? data.positions
      : Array.isArray(data)
      ? data
      : [];
    return res.status(200).json({ positions: list.map(normalize), mode, debug: debug() });
  } catch (error) {
    if (error.status === 404) {
      return res.status(200).json({
        positions: [],
        unavailable: true,
        message: 'Portfolio endpoint unavailable on this account tier.',
        debug: debug(),
      });
    }
    const status = error.status === 403 ? 403 : error.status || 502;
    return res.status(status).json({
      message: error.message || 'Positions fetch failed.',
      hint:
        error.status === 403
          ? `403 from eToro. Switch Account Mode (currently ${mode}) or check app scopes.`
          : undefined,
      debug: debug(),
    });
  }
}
