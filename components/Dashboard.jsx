import { useEffect, useState } from 'react';
import { useKronos } from '../hooks/useKronos';
import SettingsModal from './SettingsModal';
import LogViewer from './LogViewer';

export default function Dashboard() {
  const { isActive, setIsActive, logs, clearLogs, lastCycleAt, intervalMs } = useKronos();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem('kronos_config');
      setHasConfig(Boolean(raw));
    };
    check();
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [settingsOpen]);

  const nextCycleSeconds = (() => {
    if (!isActive || !lastCycleAt) return null;
    const elapsed = now.getTime() - lastCycleAt.getTime();
    const remaining = Math.max(0, intervalMs - elapsed);
    return Math.ceil(remaining / 1000);
  })();

  const formatCountdown = (s) => {
    if (s == null) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleToggle = () => {
    if (!isActive && !hasConfig) {
      setSettingsOpen(true);
      return;
    }
    setIsActive(!isActive);
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">KRONOS</span>
          <span className="brand-tag">Serverless Trading Terminal</span>
        </div>
        <div className="topbar-actions">
          <span className="clock">{now.toLocaleTimeString()}</span>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            Settings
          </button>
        </div>
      </header>

      <main className="main">
        <section className="control-panel">
          <button
            className={`pulse-btn ${isActive ? 'on' : 'off'}`}
            onClick={handleToggle}
            aria-pressed={isActive}
          >
            <span className="pulse-ring" />
            <span className="pulse-core">
              <span className="pulse-label">{isActive ? 'STOP' : 'START'}</span>
              <span className="pulse-sub">KRONOS</span>
            </span>
          </button>

          <div className="status-grid">
            <div className="status-card">
              <span className="status-label">Engine</span>
              <span className={`status-value ${isActive ? 'active' : 'idle'}`}>
                {isActive ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="status-card">
              <span className="status-label">Next Cycle</span>
              <span className="status-value">{formatCountdown(nextCycleSeconds)}</span>
            </div>
            <div className="status-card">
              <span className="status-label">Config</span>
              <span className={`status-value ${hasConfig ? 'active' : 'warn'}`}>
                {hasConfig ? 'LOADED' : 'MISSING'}
              </span>
            </div>
            <div className="status-card">
              <span className="status-label">Last Cycle</span>
              <span className="status-value">
                {lastCycleAt ? lastCycleAt.toLocaleTimeString() : '--'}
              </span>
            </div>
          </div>

          <p className="warn-text">
            Keep this tab open. The browser is the clock; if it closes, Kronos sleeps.
          </p>
        </section>

        <section className="log-panel">
          <div className="log-header">
            <span>Trade Log</span>
            <button className="link-btn" onClick={clearLogs}>Clear</button>
          </div>
          <LogViewer logs={logs} />
        </section>
      </main>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            setHasConfig(true);
            setSettingsOpen(false);
          }}
        />
      )}

      <style jsx>{`
        .dashboard {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid #1d2433;
          background: #0d1320;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-mark {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3fb950;
          box-shadow: 0 0 12px #3fb95080;
        }
        .brand-name {
          font-weight: 700;
          letter-spacing: 4px;
          font-size: 16px;
        }
        .brand-tag {
          color: #6e7888;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .topbar-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .clock {
          color: #6e7888;
          font-size: 13px;
        }
        .icon-btn {
          background: #161b27;
          color: #e6edf3;
          padding: 8px 14px;
          border-radius: 6px;
          border: 1px solid #1d2433;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .icon-btn:hover {
          background: #1d2433;
        }
        .main {
          flex: 1;
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 24px;
          padding: 24px;
          min-height: 0;
        }
        .control-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 32px 20px;
          background: #0d1320;
          border: 1px solid #1d2433;
          border-radius: 12px;
        }
        .pulse-btn {
          position: relative;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: transparent;
          color: #e6edf3;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #1f6feb;
          opacity: 0.6;
        }
        .pulse-btn.on .pulse-ring {
          border-color: #3fb950;
          animation: pulse 2s ease-out infinite;
        }
        .pulse-btn.off .pulse-ring {
          border-color: #30363d;
        }
        .pulse-core {
          position: relative;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #1f2a44, #0d1320);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: 1px solid #1d2433;
          transition: box-shadow 0.3s;
        }
        .pulse-btn.on .pulse-core {
          box-shadow: 0 0 30px #3fb95066, inset 0 0 30px #3fb95022;
        }
        .pulse-label {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 4px;
        }
        .pulse-sub {
          font-size: 11px;
          letter-spacing: 4px;
          color: #6e7888;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
        }
        .status-card {
          background: #0a0e1a;
          border: 1px solid #1d2433;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .status-label {
          font-size: 10px;
          color: #6e7888;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .status-value {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .status-value.active { color: #3fb950; }
        .status-value.idle { color: #6e7888; }
        .status-value.warn { color: #d29922; }
        .warn-text {
          font-size: 11px;
          color: #6e7888;
          text-align: center;
          line-height: 1.5;
        }
        .log-panel {
          display: flex;
          flex-direction: column;
          background: #0d1320;
          border: 1px solid #1d2433;
          border-radius: 12px;
          min-height: 0;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid #1d2433;
          font-size: 12px;
          letter-spacing: 2px;
          color: #6e7888;
        }
        .link-btn {
          background: transparent;
          color: #58a6ff;
          font-size: 11px;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
