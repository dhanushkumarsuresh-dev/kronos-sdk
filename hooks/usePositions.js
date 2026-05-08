import { useCallback } from 'react';
import { usePoller } from './usePoller';

export function usePositions({ config }) {
  const enabled = Boolean(config?.apiKeys?.etoroPublic && config?.apiKeys?.etoroUser);

  const mode = config?.mode || 'demo';

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys: config.apiKeys, mode, verbose: config?.verbose !== false }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.hint || json.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.debug = json.debug;
      throw err;
    }
    return json;
  }, [config, mode]);

  return usePoller({
    enabled,
    intervalMs: 30_000,
    fetcher,
    source: 'positions',
    deps: [config?.apiKeys?.etoroPublic, config?.apiKeys?.etoroUser, mode],
  });
}
