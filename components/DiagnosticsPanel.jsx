import { useCallback, useMemo, useState } from 'react';
import { useNetworkLog } from '../hooks/useNetworkLog';
import LogViewer from './LogViewer';

export default function DiagnosticsPanel({ logs, onClearLogs, config }) {
  const [tab, setTab] = useState('log');
  const { entries: networkEntries, clear: clearNetwork } = useNetworkLog();

  const errorCount = useMemo(
    () => networkEntries.filter((e) => !e.ok || e.status >= 400).length,
    [networkEntries]
  );

  return (
    <div className="card">
      <header className="tab-bar">
        <button className={`tab ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>
          Trade Log
          {logs.length > 0 && <span className="badge">{logs.length}</span>}
        </button>
        <button className={`tab ${tab === 'network' ? 'active' : ''}`} onClick={() => setTab('network')}>
          Network
          {errorCount > 0 && <span className="badge err">{errorCount}</span>}
        </button>
        <button className={`tab ${tab === 'health' ? 'active' : ''}`} onClick={() => setTab('health')}>
          Health
        </button>
        <span className="spacer" />
        {tab === 'log' && (
          <button className="link-btn" onClick={onClearLogs}>Clear</button>
        )}
        {tab === 'network' && (
          <button className="link-btn" onClick={clearNetwork}>Clear</button>
        )}
      </header>

      <div className="tab-body">
        {tab === 'log' && <LogViewer logs={logs} />}
        {tab === 'network' && <NetworkTab entries={networkEntries} />}
        {tab === 'health' && <HealthTab config={config} />}
      </div>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          background: #0d1320;
          border: 1px solid #1d2433;
          border-radius: 12px;
          min-height: 0;
          overflow: hidden;
        }
        .tab-bar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          border-bottom: 1px solid #1d2433;
          background: #0a0e1a;
          flex-shrink: 0;
        }
        .tab {
          background: transparent;
          color: #6e7888;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tab:hover { color: #e6edf3; background: #161b27; }
        .tab.active { color: #58a6ff; background: #1f6feb22; }
        .badge {
          font-size: 9px;
          background: #1d2433;
          color: #9ca3af;
          padding: 1px 6px;
          border-radius: 8px;
          letter-spacing: 0.5px;
        }
        .badge.err { background: #f8514922; color: #ff7b72; }
        .spacer { flex: 1; }
        .link-btn {
          background: transparent;
          color: #58a6ff;
          font-size: 11px;
          letter-spacing: 1px;
        }
        .tab-body {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}

function NetworkTab({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="empty">
        No network calls yet. Activity from chart, portfolio, positions and trade engine will land here.
        <style jsx>{`
          .empty {
            padding: 32px;
            text-align: center;
            color: #6e7888;
            font-size: 12px;
            letter-spacing: 1px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="net-list">
      {entries.slice().reverse().map((e) => (
        <NetworkRow key={e.id} entry={e} />
      ))}
      <style jsx>{`
        .net-list {
          flex: 1;
          overflow: auto;
          padding: 4px 0;
        }
      `}</style>
    </div>
  );
}

function NetworkRow({ entry }) {
  const [open, setOpen] = useState(false);
  const statusClass =
    entry.error || entry.status >= 500 ? 'err' :
    entry.status >= 400 ? 'warn' :
    entry.status >= 300 ? 'amber' : 'ok';
  const path = (() => {
    try {
      const u = new URL(entry.url);
      return u.pathname + u.search;
    } catch { return entry.url; }
  })();

  return (
    <div className="row">
      <button className="row-head" onClick={() => setOpen((v) => !v)}>
        <span className={`status ${statusClass}`}>{entry.error ? 'ERR' : entry.status}</span>
        <span className="method">{entry.method}</span>
        <span className="source">{entry.source}</span>
        <span className="path" title={entry.url}>{path}</span>
        <span className="latency">{entry.latencyMs}ms</span>
        <span className="time">{new Date(entry.ts).toLocaleTimeString()}</span>
      </button>
      {open && (
        <div className="row-body">
          {entry.error && <Section label="Error">{entry.error}</Section>}
          <Section label="Request URL">{entry.url}</Section>
          {entry.requestBody && <Section label="Request Body">{format(entry.requestBody)}</Section>}
          {entry.requestHeaders && <Section label="Request Headers">{format(entry.requestHeaders)}</Section>}
          {entry.responseBody !== null && <Section label="Response Body">{format(entry.responseBody)}</Section>}
        </div>
      )}
      <style jsx>{`
        .row { border-bottom: 1px solid #161b27; }
        .row-head {
          width: 100%;
          background: transparent;
          color: #e6edf3;
          display: grid;
          grid-template-columns: 60px 50px 90px 1fr 60px 80px;
          gap: 10px;
          align-items: center;
          padding: 8px 14px;
          font-size: 11px;
          text-align: left;
        }
        .row-head:hover { background: #161b27; }
        .status {
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 6px;
          border-radius: 4px;
          text-align: center;
        }
        .status.ok    { background: #3fb95022; color: #56d364; }
        .status.amber { background: #d2992222; color: #e3b341; }
        .status.warn  { background: #f8514922; color: #ffae5a; }
        .status.err   { background: #f8514944; color: #ff7b72; }
        .method { color: #6e7888; font-weight: 600; letter-spacing: 1px; }
        .source { color: #58a6ff; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
        .path { color: #e6edf3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .latency { color: #6e7888; text-align: right; font-variant-numeric: tabular-nums; }
        .time { color: #6e7888; font-size: 10px; text-align: right; }
        .row-body { padding: 10px 18px 14px; background: #0a0e1a; }
      `}</style>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="sec">
      <div className="lbl">{label}</div>
      <pre>{children}</pre>
      <style jsx>{`
        .sec { margin-bottom: 10px; }
        .lbl {
          font-size: 10px;
          color: #6e7888;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        pre {
          background: #0d1320;
          border: 1px solid #1d2433;
          padding: 8px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: #e6edf3;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 240px;
          overflow: auto;
        }
      `}</style>
    </div>
  );
}

function format(v) {
  if (v == null) return '';
  if (typeof v === 'string') {
    try {
      return JSON.stringify(JSON.parse(v), null, 2);
    } catch {
      return v;
    }
  }
  return JSON.stringify(v, null, 2);
}

function HealthTab({ config }) {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const { append } = useNetworkLog();

  const run = useCallback(async () => {
    if (!config) {
      setError('Open Settings and save your keys first.');
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeys: config.apiKeys,
          mode: config.mode || 'demo',
          asset: config?.chart?.asset || config?.strategy?.asset || 'EURUSD',
          verbose: config?.verbose !== false,
        }),
      });
      const json = await res.json();
      if (json?.debug?.requests) append(json.debug.requests, 'health');
      setReport(json);
    } catch (e) {
      setError(e.message || 'Health check failed.');
    } finally {
      setRunning(false);
    }
  }, [config, append]);

  return (
    <div className="health">
      <div className="bar">
        <div>
          <div className="title">External Service Health</div>
          <div className="sub">
            {report
              ? `Last run: ${new Date(report.generatedAt).toLocaleTimeString()}`
              : 'Run a check to verify each integration.'}
          </div>
        </div>
        <button className="run" disabled={running} onClick={run}>
          {running ? 'Running…' : 'Run Health Check'}
        </button>
      </div>

      {error && <div className="err-banner">{error}</div>}

      {report && (
        <div className="checks">
          {report.checks.map((c) => (
            <CheckRow key={c.name} check={c} />
          ))}
        </div>
      )}

      <style jsx>{`
        .health {
          flex: 1;
          overflow: auto;
          padding: 14px 18px;
        }
        .bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #1d2433;
          margin-bottom: 14px;
        }
        .title { font-size: 13px; color: #e6edf3; letter-spacing: 1px; }
        .sub { font-size: 11px; color: #6e7888; margin-top: 4px; }
        .run {
          background: #1f6feb;
          color: white;
          padding: 9px 18px;
          border-radius: 6px;
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 600;
        }
        .run:hover:not(:disabled) { background: #388bfd; }
        .run:disabled { opacity: 0.5; cursor: not-allowed; }
        .err-banner {
          background: #f8514922;
          color: #ff7b72;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 12px;
        }
        .checks { display: flex; flex-direction: column; gap: 10px; }
      `}</style>
    </div>
  );
}

function CheckRow({ check }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`check ${check.ok ? 'ok' : 'fail'}`}>
      <button className="check-head" onClick={() => setOpen((v) => !v)}>
        <span className="dot" />
        <span className="name">{check.name}</span>
        <span className="endpoint">{check.endpoint}</span>
        <span className="lat">{check.latencyMs}ms</span>
        <span className="status">{check.ok ? 'OK' : check.status ? `HTTP ${check.status}` : 'FAIL'}</span>
      </button>
      {open && (
        <div className="check-body">
          {check.hint && <div className="hint">💡 {check.hint}</div>}
          {check.error && <Section label="Error">{check.error}</Section>}
          {check.sample && <Section label="Sample">{format(check.sample)}</Section>}
        </div>
      )}
      <style jsx>{`
        .check {
          border: 1px solid #1d2433;
          border-radius: 8px;
          overflow: hidden;
        }
        .check.ok { border-color: #3fb95044; }
        .check.fail { border-color: #f8514944; }
        .check-head {
          width: 100%;
          background: #0a0e1a;
          color: #e6edf3;
          display: grid;
          grid-template-columns: 14px 1.4fr 2fr 80px 80px;
          gap: 10px;
          align-items: center;
          padding: 10px 14px;
          font-size: 12px;
          text-align: left;
        }
        .check-head:hover { background: #161b27; }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .check.ok .dot { background: #3fb950; box-shadow: 0 0 8px #3fb95080; }
        .check.fail .dot { background: #f85149; box-shadow: 0 0 8px #f8514980; }
        .name { font-weight: 600; letter-spacing: 0.5px; }
        .endpoint { color: #6e7888; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lat { color: #6e7888; text-align: right; font-variant-numeric: tabular-nums; font-size: 11px; }
        .status {
          text-align: right;
          font-weight: 700;
          letter-spacing: 1px;
          font-size: 11px;
        }
        .check.ok .status { color: #56d364; }
        .check.fail .status { color: #ff7b72; }
        .check-body { padding: 12px 16px; background: #0d1320; }
        .hint {
          font-size: 12px;
          color: #d29922;
          margin-bottom: 10px;
          padding: 8px 10px;
          background: #d2992211;
          border: 1px solid #d2992233;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
