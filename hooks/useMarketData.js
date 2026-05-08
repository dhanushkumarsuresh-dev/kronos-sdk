import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function useMarketData({ config, asset, resolution }) {
  const enabled = Boolean(config?.apiKeys?.finnhub && asset);

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/candles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: config.apiKeys, asset, resolution, count: 200 }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  }, [config, asset, resolution]);

  return usePoller({
    enabled,
    intervalMs: 30_000,
    fetcher,
    deps: [asset, resolution, config?.apiKeys?.finnhub],
  });
}
