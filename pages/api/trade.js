import { calculateSentiment } from '../../utils/sentiment';
import {
  fetchPnL,
  placeMarketOrder,
  calculateLevels,
  resolveInstrumentId,
} from '../../utils/eToroClient';
import { createLogger } from '../../utils/httpLog';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { apiKeys, strategy, mode = 'demo', verbose = true } = req.body || {};
  const logger = createLogger({ verbose });
  const debug = () => ({ requests: logger.entries });

  if (!apiKeys?.etoroPublic || !apiKeys?.etoroUser) {
    return res.status(400).json({ message: 'Missing eToro credentials in payload.', debug: debug() });
  }
  if (!strategy?.asset) {
    return res.status(400).json({ message: 'Missing strategy.asset in payload.', debug: debug() });
  }

  try {
    const sentimentScore = await calculateSentiment(apiKeys.finnhub, strategy.asset, {
      fetcher: logger.fetch,
    });

    if (sentimentScore > -0.5 && sentimentScore < 0.5) {
      return res.status(200).json({
        message: `Sentiment Neutral (${sentimentScore}). Holding positions.`,
        sentimentScore,
        debug: debug(),
      });
    }
    const isBullish = sentimentScore >= 0.5;

    const accountData = await fetchPnL(apiKeys, mode, { fetcher: logger.fetch });
    const capital = Number(accountData?.credit ?? accountData?.equity ?? 0);

    if (!capital || capital <= 0) {
      return res.status(400).json({
        message: 'eToro account has no available credit. Aborting cycle.',
        debug: debug(),
      });
    }

    const riskPerTrade = Number(strategy.riskPerTrade) || 0.02;
    const leverage = Math.max(1, Number(strategy.leverage) || 1);
    const rewardRatio = Math.max(1, Number(strategy.rewardRatio) || 2);
    const riskAmount = Number((capital * riskPerTrade).toFixed(2));

    const { entry, slPrice, tpPrice } = calculateLevels(isBullish, rewardRatio, strategy.asset);

    const instrumentId = await resolveInstrumentId(apiKeys, strategy.asset, {
      fetcher: logger.fetch,
    });

    const orderBody = {
      InstrumentID: instrumentId,
      IsBuy: isBullish,
      Leverage: leverage,
      Amount: Number((riskAmount * leverage).toFixed(2)),
      StopLossRate: slPrice,
      TakeProfitRate: tpPrice,
    };

    const orderResult = await placeMarketOrder(apiKeys, mode, orderBody, {
      fetcher: logger.fetch,
    });

    return res.status(200).json({
      message: `SUCCESS: Executed ${isBullish ? 'BUY' : 'SELL'} on ${strategy.asset} (id=${instrumentId}). Risking $${riskAmount} @ ${leverage}x. Entry≈${entry} SL=${slPrice} TP=${tpPrice}.`,
      sentimentScore,
      order: orderBody,
      orderResult,
      debug: debug(),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: `FATAL: ${error.message || 'unknown error'}`,
      hint: hintFor(error, mode),
      debug: debug(),
    });
  }
}

function hintFor(error, mode) {
  if (error.status === 403) {
    return `403 from eToro. Check Account Mode (currently ${mode}) matches your account, and that your app has the required scopes approved.`;
  }
  if (error.status === 404) {
    return 'Endpoint returned 404 — verify the path in eToroClient against https://api-portal.etoro.com/api-reference.';
  }
  if (error.message?.includes('No InstrumentID')) {
    return 'Symbol could not be resolved to an InstrumentID. Try one of the seeded majors (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, NZDUSD).';
  }
  return undefined;
}
