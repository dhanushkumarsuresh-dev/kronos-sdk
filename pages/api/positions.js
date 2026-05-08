import { fetchPositions } from '../../utils/eToroClient';

function normalize(position) {
  return {
    id: position?.positionId ?? position?.id ?? '',
    instrument: position?.instrument ?? position?.symbol ?? '',
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

  const { apiKeys } = req.body || {};
  if (!apiKeys?.etoroPublic || !apiKeys?.etoroUser) {
    return res.status(400).json({ message: 'Missing eToro credentials.' });
  }

  try {
    const data = await fetchPositions(apiKeys);
    const list = Array.isArray(data) ? data : data?.positions || [];
    return res.status(200).json({ positions: list.map(normalize) });
  } catch (error) {
    if (error.status === 404) {
      return res
        .status(200)
        .json({ positions: [], unavailable: true, message: 'Positions endpoint unavailable on this account tier.' });
    }
    return res.status(502).json({ message: error.message || 'Positions fetch failed.' });
  }
}
