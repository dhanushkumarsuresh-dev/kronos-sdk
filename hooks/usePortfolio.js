import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function usePortfolio({ config }) {
  const enabled = Boolean(config?.apiKeys?.etoroPublic && config?.apiKeys?.etoroUser);

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: config.apiKeys }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  }, [config]);

  return usePoller({
    enabled,
    intervalMs: 60_000,
    fetcher,
    deps: [config?.apiKeys?.etoroPublic, config?.apiKeys?.etoroUser],
  });
}
