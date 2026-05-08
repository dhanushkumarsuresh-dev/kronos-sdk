import { calculateSentiment } from '../../utils/sentiment';
import { fetchPnL, placeOrder, calculateLevels } from '../../utils/eToroClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, strategy } = req.body || {};

  if (!apiKeys?.etoroPublic || !apiKeys?.etoroUser) {
    return res.status(400).json({ message: 'Missing eToro credentials in payload.' });
  }
  if (!strategy?.asset) {
    return res.status(400).json({ message: 'Missing strategy.asset in payload.' });
  }

  try {
    // STEP 1: MARKET SENTIMENT (Finnhub + VADER)
    const sentimentScore = await calculateSentiment(apiKeys.finnhub, strategy.asset);

    if (sentimentScore > -0.5 && sentimentScore < 0.5) {
      return res.status(200).json({
        message: `Sentiment Neutral (${sentimentScore}). Holding positions.`,
        sentimentScore,
      });
    }
    const isBullish = sentimentScore >= 0.5;

    // STEP 2: ETORO ACCOUNT VALIDATION
    const accountData = await fetchPnL(apiKeys);
    const capital = Number(accountData?.credit ?? accountData?.equity ?? 0);

    if (!capital || capital <= 0) {
      return res
        .status(400)
        .json({ message: 'eToro account has no available credit. Aborting cycle.' });
    }

    const riskPerTrade = Number(strategy.riskPerTrade) || 0.02;
    const leverage = Math.max(1, Number(strategy.leverage) || 1);
    const rewardRatio = Math.max(1, Number(strategy.rewardRatio) || 2);
    const riskAmount = Number((capital * riskPerTrade).toFixed(2));

    // STEP 3: PRICE LEVELS — SL/TP mandatory on leveraged positions
    const { entry, slPrice, tpPrice } = calculateLevels(isBullish, rewardRatio, strategy.asset);

    const orderPayload = {
      instrument: strategy.asset,
      action: isBullish ? 'BUY' : 'SELL',
      amount: Number((riskAmount * leverage).toFixed(2)),
      leverage,
      stopLossRate: slPrice,
      takeProfitRate: tpPrice,
      type: 'Market',
    };

    // STEP 4: EXECUTE
    await placeOrder(apiKeys, orderPayload);

    return res.status(200).json({
      message: `SUCCESS: Executed ${orderPayload.action} on ${strategy.asset}. Risking $${riskAmount} @ ${leverage}x. Entry≈${entry} SL=${slPrice} TP=${tpPrice}.`,
      sentimentScore,
      order: orderPayload,
    });
  } catch (error) {
    return res.status(500).json({ message: `FATAL: ${error.message || 'unknown error'}` });
  }
}
