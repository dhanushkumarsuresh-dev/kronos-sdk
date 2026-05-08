import { useEffect, useRef, useState, useCallback } from 'react';

export function usePoller({ enabled, intervalMs, fetcher, deps = [] }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const inFlight = useRef(false);
  const timerRef = useRef(null);

  const tick = useCallback(async () => {
    if (!enabled) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e?.message || 'Request failed');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetcher]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    tick();
    timerRef.current = setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);

  return { data, error, loading, updatedAt, refresh: tick };
}
