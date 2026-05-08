import { calculateSentiment } from '../../utils/sentiment';
import { createLogger } from '../../utils/httpLog';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, asset, verbose = true } = req.body || {};
  const logger = createLogger({ verbose });
  const debug = () => ({ requests: logger.entries });

  if (!apiKeys?.finnhub) {
    return res.status(400).json({ message: 'Missing Finnhub key.', debug: debug() });
  }
  if (!asset) {
    return res.status(400).json({ message: 'Missing asset.', debug: debug() });
  }

  try {
    const score = await calculateSentiment(apiKeys.finnhub, asset, { fetcher: logger.fetch });
    let direction = 'NEUTRAL';
    if (score >= 0.5) direction = 'BUY';
    else if (score <= -0.5) direction = 'SELL';
    return res.status(200).json({ score, direction, asset, debug: debug() });
  } catch (error) {
    return res
      .status(502)
      .json({ message: error.message || 'Sentiment fetch failed.', debug: debug() });
  }
}
