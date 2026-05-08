import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function useMarketData({ config, asset, resolution }) {
  const enabled = Boolean(config?.apiKeys?.finnhub && asset);

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/candles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKeys: config.apiKeys,
        asset,
        resolution,
        count: 200,
        verbose: config?.verbose !== false,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.message || `HTTP ${res.status}`);
      err.debug = json.debug;
      throw err;
    }
    return json;
  }, [config, asset, resolution]);

  return usePoller({
    enabled,
    intervalMs: 30_000,
    fetcher,
    source: 'candles',
    deps: [asset, resolution, config?.apiKeys?.finnhub],
  });
}
