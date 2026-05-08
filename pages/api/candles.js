import { fetchCandles } from '../../utils/finnhubClient';
import { createLogger } from '../../utils/httpLog';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, asset, resolution = '15', count = 200, verbose = true } = req.body || {};
  const logger = createLogger({ verbose });
  const debug = () => ({ requests: logger.entries });

  if (!apiKeys?.finnhub) {
    return res.status(400).json({ message: 'Missing Finnhub key.', debug: debug() });
  }
  if (!asset) {
    return res.status(400).json({ message: 'Missing asset.', debug: debug() });
  }

  try {
    const data = await fetchCandles(apiKeys.finnhub, asset, resolution, count, {
      fetcher: logger.fetch,
    });
    return res.status(200).json({ ...data, debug: debug() });
  } catch (error) {
    return res
      .status(502)
      .json({ message: error.message || 'Candle fetch failed.', debug: debug() });
  }
}
