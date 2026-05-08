import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function useSentimentSnapshot({ config, asset }) {
  const enabled = Boolean(config?.apiKeys?.finnhub && asset);

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: config.apiKeys, asset }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  }, [config, asset]);

  return usePoller({
    enabled,
    intervalMs: 5 * 60_000,
    fetcher,
    deps: [asset, config?.apiKeys?.finnhub],
  });
}
