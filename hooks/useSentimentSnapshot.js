import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function useSentimentSnapshot({ config, asset }) {
  const enabled = Boolean(config?.apiKeys?.finnhub && asset);

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: config.apiKeys, asset, verbose: config?.verbose !== false }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.message || `HTTP ${res.status}`);
      err.debug = json.debug;
      throw err;
    }
    return json;
  }, [config, asset]);

  return usePoller({
    enabled,
    intervalMs: 5 * 60_000,
    fetcher,
    source: 'sentiment',
    deps: [asset, config?.apiKeys?.finnhub],
  });
}
