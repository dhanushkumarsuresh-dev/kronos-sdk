import { fetchCandles } from '../../utils/finnhubClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, asset, resolution = '15', count = 200 } = req.body || {};

  if (!apiKeys?.finnhub) {
    return res.status(400).json({ message: 'Missing Finnhub key.' });
  }
  if (!asset) {
    return res.status(400).json({ message: 'Missing asset.' });
  }

  try {
    const data = await fetchCandles(apiKeys.finnhub, asset, resolution, count);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ message: error.message || 'Candle fetch failed.' });
  }
}
