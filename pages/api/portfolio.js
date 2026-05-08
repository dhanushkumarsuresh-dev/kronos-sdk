import { fetchPnL } from '../../utils/eToroClient';

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
    const data = await fetchPnL(apiKeys);
    return res.status(200).json({
      equity: Number(data?.equity ?? 0),
      credit: Number(data?.credit ?? 0),
      usedMargin: Number(data?.usedMargin ?? data?.marginUsed ?? 0),
      dailyPnL: Number(data?.dailyPnL ?? data?.profit ?? 0),
      raw: data,
    });
  } catch (error) {
    return res.status(502).json({ message: error.message || 'Portfolio fetch failed.' });
  }
}
