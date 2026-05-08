import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kronos_config';
const EVENT_KEY = 'kronos_config_changed';

function readConfig() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function emitConfigChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function useConfig() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    setConfig(readConfig());
    const onChange = () => setConfig(readConfig());
    window.addEventListener(EVENT_KEY, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT_KEY, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const reload = useCallback(() => setConfig(readConfig()), []);

  return { config, reload };
}
