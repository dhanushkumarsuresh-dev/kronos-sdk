import { usePositions } from '../hooks/usePositions';

function fmt(n, dp = 2) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toFixed(dp);
}

export default function PositionsTable({ config }) {
  const { data, error, updatedAt } = usePositions({ config });
  const hasKeys = Boolean(config?.apiKeys?.etoroPublic && config?.apiKeys?.etoroUser);
  const positions = data?.positions || [];
  const unavailable = data?.unavailable;

  return (
    <div className="positions-card">
      <header className="card-header">
        <span>Open Positions</span>
        <span className="meta">
          {!hasKeys
            ? 'No eToro keys'
            : error
            ? `Error: ${error}`
            : `${positions.length} open · ${updatedAt ? updatedAt.toLocaleTimeString() : '—'}`}
        </span>
      </header>

      <div className="table-wrap">
        {!hasKeys ? (
          <div className="empty">Configure eToro keys in Settings.</div>
        ) : unavailable ? (
          <div className="empty">{data.message}</div>
        ) : positions.length === 0 ? (
          <div className="empty">No open positions.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Side</th>
                <th>Units</th>
                <th>Entry</th>
                <th>Current</th>
                <th>SL</th>
                <th>TP</th>
                <th className="num">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id || `${p.instrument}-${p.entry}`}>
                  <td>{p.instrument}</td>
                  <td className={p.direction === 'BUY' ? 'side-buy' : 'side-sell'}>{p.direction}</td>
                  <td>{fmt(p.units, 4)}</td>
                  <td>{fmt(p.entry, 5)}</td>
                  <td>{fmt(p.current, 5)}</td>
                  <td>{fmt(p.stopLoss, 5)}</td>
                  <td>{fmt(p.takeProfit, 5)}</td>
                  <td className={`num ${p.pnl > 0 ? 'up' : p.pnl < 0 ? 'down' : ''}`}>{fmt(p.pnl, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .positions-card {
          display: flex;
          flex-direction: column;
          background: #0d1320;
          border: 1px solid #1d2433;
          border-radius: 12px;
          min-height: 0;
          overflow: hidden;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #1d2433;
          font-size: 12px;
          letter-spacing: 2px;
          color: #6e7888;
        }
        .meta { font-size: 11px; letter-spacing: 1px; text-transform: none; }
        .table-wrap { flex: 1; overflow: auto; }
        .empty {
          padding: 32px;
          text-align: center;
          color: #6e7888;
          font-size: 12px;
          letter-spacing: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        thead th {
          text-align: left;
          padding: 10px 14px;
          color: #6e7888;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-bottom: 1px solid #1d2433;
          background: #0a0e1a;
          position: sticky;
          top: 0;
        }
        tbody td {
          padding: 10px 14px;
          border-bottom: 1px solid #161b27;
          color: #e6edf3;
        }
        tbody tr:hover { background: #161b27; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .up { color: #56d364; }
        .down { color: #ff7b72; }
        .side-buy { color: #56d364; font-weight: 600; }
        .side-sell { color: #ff7b72; font-weight: 600; }
      `}</style>
    </div>
  );
}
