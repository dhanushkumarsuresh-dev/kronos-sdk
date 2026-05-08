import vader from 'vader-sentiment';

const ASSET_QUERY_MAP = {
  EURUSD: ['EUR', 'euro', 'ECB', 'eurozone'],
  GBPUSD: ['GBP', 'pound', 'BoE', 'sterling'],
  USDJPY: ['JPY', 'yen', 'BoJ'],
  AUDUSD: ['AUD', 'aussie', 'RBA'],
  USDCAD: ['CAD', 'loonie', 'BoC'],
  XAUUSD: ['gold', 'XAU', 'precious metals'],
};

function hoursAgo(h) {
  return Math.floor((Date.now() - h * 60 * 60 * 1000) / 1000);
}

function isoDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().split('T')[0];
}

async function fetchForexNews(finnhubKey) {
  const url = `https://finnhub.io/api/v1/news?category=forex&token=${encodeURIComponent(finnhubKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub forex news failed (${res.status})`);
  }
  return res.json();
}

async function fetchCompanyNews(finnhubKey, symbol) {
  const from = isoDate(hoursAgo(48));
  const to = isoDate(Math.floor(Date.now() / 1000));
  const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
    symbol
  )}&from=${from}&to=${to}&token=${encodeURIComponent(finnhubKey)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

function filterRelevant(articles, asset) {
  const keywords = ASSET_QUERY_MAP[asset.toUpperCase()] || [asset];
  const cutoff = hoursAgo(24);
  return articles.filter((a) => {
    if (a.datetime && a.datetime < cutoff) return false;
    const blob = `${a.headline || ''} ${a.summary || ''}`.toLowerCase();
    return keywords.some((k) => blob.includes(k.toLowerCase()));
  });
}

export async function calculateSentiment(finnhubKey, asset) {
  if (!finnhubKey) {
    return 0;
  }

  let articles = [];
  try {
    const symbol = asset.toUpperCase();
    if (/^[A-Z]{3}[A-Z]{3}$/.test(symbol)) {
      articles = await fetchForexNews(finnhubKey);
    } else {
      articles = await fetchCompanyNews(finnhubKey, symbol);
    }
  } catch {
    return 0;
  }

  const relevant = filterRelevant(articles, asset).slice(0, 30);
  if (relevant.length === 0) return 0;

  let total = 0;
  for (const article of relevant) {
    const text = `${article.headline || ''}. ${article.summary || ''}`.trim();
    if (!text) continue;
    const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    total += result.compound;
  }

  return Number((total / relevant.length).toFixed(3));
}
