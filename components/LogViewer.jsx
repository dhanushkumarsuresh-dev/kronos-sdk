import { useEffect, useRef } from 'react';

export default function LogViewer({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="log-viewer" ref={containerRef}>
      {logs.length === 0 ? (
        <div className="empty">Awaiting first cycle. Click START KRONOS to engage.</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className={`row ${log.level}`}>
            <span className="time">{log.time}</span>
            <span className="dot" />
            <span className="msg">
              {log.msg}
              {log.details && (
                <details className="details">
                  <summary>view payload</summary>
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </details>
              )}
            </span>
          </div>
        ))
      )}

      <style jsx>{`
        .log-viewer {
          flex: 1;
          padding: 16px 18px;
          overflow-y: auto;
          font-size: 12.5px;
          line-height: 1.7;
        }
        .empty {
          color: #6e7888;
          font-style: italic;
          text-align: center;
          padding: 32px 0;
          letter-spacing: 1px;
        }
        .row {
          display: grid;
          grid-template-columns: 80px 12px 1fr;
          align-items: start;
          gap: 8px;
          padding: 2px 0;
        }
        .time {
          color: #6e7888;
          font-size: 11px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 7px;
          background: #6e7888;
        }
        .msg {
          color: #e6edf3;
          word-break: break-word;
        }
        .row.success .dot { background: #3fb950; }
        .row.success .msg { color: #56d364; }
        .row.error .dot { background: #f85149; }
        .row.error .msg { color: #ff7b72; }
        .row.warn .dot { background: #d29922; }
        .row.warn .msg { color: #e3b341; }
        .details {
          margin-top: 4px;
          font-size: 11px;
          color: #6e7888;
        }
        .details summary {
          cursor: pointer;
          color: #58a6ff;
          letter-spacing: 1px;
        }
        .details pre {
          margin-top: 6px;
          padding: 8px 10px;
          background: #0a0e1a;
          border: 1px solid #1d2433;
          border-radius: 4px;
          color: #e6edf3;
          font-size: 11px;
          line-height: 1.5;
          overflow: auto;
          max-height: 280px;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
