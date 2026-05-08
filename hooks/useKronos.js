import { useState, useEffect, useRef, useCallback } from 'react';

const KRONOS_INTERVAL_MS = 15 * 60 * 1000;

export function useKronos() {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastCycleAt, setLastCycleAt] = useState(null);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const addLog = useCallback((msg, level = 'info') => {
    setLogs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), msg, level },
    ]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const triggerTradeEngine = useCallback(async () => {
    if (inFlightRef.current) {
      addLog('Skipped cycle: previous cycle still running.', 'warn');
      return;
    }

    const raw = typeof window !== 'undefined' ? localStorage.getItem('kronos_config') : null;
    if (!raw) {
      addLog('ERROR: Missing config in Settings.', 'error');
      return;
    }

    let config;
    try {
      config = JSON.parse(raw);
    } catch {
      addLog('ERROR: Corrupt config in LocalStorage.', 'error');
      return;
    }

    if (!config?.apiKeys?.etoroPublic || !config?.apiKeys?.etoroUser) {
      addLog('ERROR: eToro API keys not configured.', 'error');
      return;
    }

    inFlightRef.current = true;
    addLog('System: Kronos cycle initiated. Scanning market...', 'info');

    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json().catch(() => ({ message: 'Invalid response from server.' }));

      if (!res.ok) {
        addLog(`Kronos: ${data.message || `HTTP ${res.status}`}`, 'error');
      } else {
        const level = data.message?.startsWith('SUCCESS') ? 'success' : 'info';
        addLog(`Kronos: ${data.message}`, level);
      }
    } catch (error) {
      addLog(`ERROR: API connection failed. ${error.message || ''}`.trim(), 'error');
    } finally {
      inFlightRef.current = false;
      setLastCycleAt(new Date());
    }
  }, [addLog]);

  useEffect(() => {
    if (isActive) {
      addLog('Kronos engaged. Heartbeat every 15 minutes.', 'success');
      triggerTradeEngine();
      timerRef.current = setInterval(triggerTradeEngine, KRONOS_INTERVAL_MS);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        addLog('Kronos disengaged. No further cycles will be scheduled.', 'warn');
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return {
    isActive,
    setIsActive,
    logs,
    addLog,
    clearLogs,
    lastCycleAt,
    intervalMs: KRONOS_INTERVAL_MS,
  };
}
