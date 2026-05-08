import { usePortfolio } from '../hooks/usePortfolio';

function fmtMoney(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export default function PortfolioStrip({ config }) {
  const { data, error, updatedAt } = usePortfolio({ config });
  const hasKeys = Boolean(config?.apiKeys?.etoroPublic && config?.apiKeys?.etoroUser);

  const equity = data?.equity ?? null;
  const credit = data?.credit ?? null;
  const usedMargin = data?.usedMargin ?? null;
  const dailyPnL = data?.dailyPnL ?? null;
  const free = equity != null && usedMargin != null ? equity - usedMargin : null;

  return (
    <div className="strip">
      <div className="cell">
        <span className="label">Equity</span>
        <span className="value">{hasKeys ? fmtMoney(equity) : '—'}</span>
      </div>
      <div className="cell">
        <span className="label">Available Credit</span>
        <span className="value">{hasKeys ? fmtMoney(credit) : '—'}</span>
      </div>
      <div className="cell">
        <span className="label">Used Margin</span>
        <span className="value">{hasKeys ? fmtMoney(usedMargin) : '—'}</span>
      </div>
      <div className="cell">
        <span className="label">Free Margin</span>
        <span className="value">{hasKeys ? fmtMoney(free) : '—'}</span>
      </div>
      <div className="cell">
        <span className="label">Daily P&amp;L</span>
        <span className={`value ${dailyPnL > 0 ? 'up' : dailyPnL < 0 ? 'down' : ''}`}>
          {hasKeys ? fmtMoney(dailyPnL) : '—'}
        </span>
      </div>
      <div className="cell meta">
        <span className="label">Status</span>
        <span className="value sm">
          {!hasKeys ? 'No eToro keys' : error ? `Error: ${error}` : updatedAt ? `Synced ${updatedAt.toLocaleTimeString()}` : 'Loading…'}
        </span>
      </div>

      <style jsx>{`
        .strip {
          display: grid;
          grid-template-columns: repeat(5, 1fr) 1.4fr;
          gap: 1px;
          background: #1d2433;
          border: 1px solid #1d2433;
          border-radius: 12px;
          overflow: hidden;
        }
        .cell {
          background: #0d1320;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .label {
          font-size: 10px;
          color: #6e7888;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .value {
          font-size: 17px;
          font-weight: 600;
          color: #e6edf3;
          letter-spacing: 0.5px;
        }
        .value.sm { font-size: 12px; font-weight: 400; color: #9ca3af; }
        .value.up { color: #56d364; }
        .value.down { color: #ff7b72; }
        @media (max-width: 1100px) {
          .strip { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
