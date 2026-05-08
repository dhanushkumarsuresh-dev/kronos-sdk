import { createContext, useCallback, useContext, useRef, useState } from 'react';

const MAX_ENTRIES = 100;

const NetworkLogContext = createContext(null);

export function NetworkLogProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const idRef = useRef(0);

  const append = useCallback((requests, source) => {
    if (!requests || requests.length === 0) return;
    setEntries((prev) => {
      const next = prev.slice();
      for (const req of requests) {
        next.push({ ...req, source, id: ++idRef.current });
      }
      if (next.length > MAX_ENTRIES) next.splice(0, next.length - MAX_ENTRIES);
      return next;
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return (
    <NetworkLogContext.Provider value={{ entries, append, clear }}>
      {children}
    </NetworkLogContext.Provider>
  );
}

export function useNetworkLog() {
  const ctx = useContext(NetworkLogContext);
  if (!ctx) {
    return { entries: [], append: () => {}, clear: () => {} };
  }
  return ctx;
}
