import { fetchPnL } from '../../utils/eToroClient';
import { createLogger } from '../../utils/httpLog';

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
    const data = await fetchPnL(apiKeys, mode, { fetcher: logger.fetch });
    return res.status(200).json({
      equity: Number(data?.equity ?? 0),
      credit: Number(data?.credit ?? 0),
      usedMargin: Number(data?.usedMargin ?? data?.marginUsed ?? 0),
      dailyPnL: Number(data?.dailyPnL ?? data?.profit ?? 0),
      mode,
      raw: data,
      debug: debug(),
    });
  } catch (error) {
    const status = error.status === 403 ? 403 : error.status || 502;
    return res.status(status).json({
      message: error.message || 'Portfolio fetch failed.',
      hint:
        error.status === 403
          ? `403 from eToro. Switch Account Mode (currently ${mode}) or check app scopes.`
          : undefined,
      debug: debug(),
    });
  }
}
