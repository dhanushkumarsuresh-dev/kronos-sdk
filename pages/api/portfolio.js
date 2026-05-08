import { fetchPnL } from '../../utils/eToroClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, mode = 'demo' } = req.body || {};
  if (!apiKeys?.etoroPublic || !apiKeys?.etoroUser) {
    return res.status(400).json({ message: 'Missing eToro credentials.' });
  }

  try {
    const data = await fetchPnL(apiKeys, mode);
    return res.status(200).json({
      equity: Number(data?.equity ?? 0),
      credit: Number(data?.credit ?? 0),
      usedMargin: Number(data?.usedMargin ?? data?.marginUsed ?? 0),
      dailyPnL: Number(data?.dailyPnL ?? data?.profit ?? 0),
      mode,
      raw: data,
    });
  } catch (error) {
    const status = error.status === 403 ? 403 : 502;
    return res.status(status).json({
      message: error.message || 'Portfolio fetch failed.',
      hint:
        error.status === 403
          ? `403 from eToro. Check that Account Mode (${mode}) matches your account, and that your app has the required scopes approved.`
          : undefined,
    });
  }
}
