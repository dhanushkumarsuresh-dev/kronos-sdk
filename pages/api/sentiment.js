import { calculateSentiment } from '../../utils/sentiment';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, asset } = req.body || {};
  if (!apiKeys?.finnhub) {
    return res.status(400).json({ message: 'Missing Finnhub key.' });
  }
  if (!asset) {
    return res.status(400).json({ message: 'Missing asset.' });
  }

  try {
    const score = await calculateSentiment(apiKeys.finnhub, asset);
    let direction = 'NEUTRAL';
    if (score >= 0.5) direction = 'BUY';
    else if (score <= -0.5) direction = 'SELL';
    return res.status(200).json({ score, direction, asset });
  } catch (error) {
    return res.status(502).json({ message: error.message || 'Sentiment fetch failed.' });
  }
}
