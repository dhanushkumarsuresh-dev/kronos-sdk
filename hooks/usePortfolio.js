import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function usePortfolio({ config }) {
  const enabled = Boolean(config?.apiKeys?.etoroPublic && config?.apiKeys?.etoroUser);

  const mode = config?.mode || 'demo';

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: config.apiKeys, mode }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.hint || json.message || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return json;
  }, [config, mode]);

  return usePoller({
    enabled,
    intervalMs: 60_000,
    fetcher,
    deps: [config?.apiKeys?.etoroPublic, config?.apiKeys?.etoroUser, mode],
  });
}
