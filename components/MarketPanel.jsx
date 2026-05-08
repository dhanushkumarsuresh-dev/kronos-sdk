import { useMemo } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useSentimentSnapshot } from '../hooks/useSentimentSnapshot';

export default function MarketPanel({ config, asset, timeframe }) {
  const { data: candleData } = useMarketData({ config, asset, resolution: timeframe });
  const { data: sentiment } = useSentimentSnapshot({ config, asset });

  const stats = useMemo(() => {
    const candles = candleData?.candles || [];
    if (candles.length === 0) return null;
    const last = candles[candles.length - 1];
    const first = candles[0];
    const high = Math.max(...candles.map((c) => c.h));
    const low = Math.min(...candles.map((c) => c.l));
    const totalVol = candles.reduce((sum, c) => sum + (c.v || 0), 0);
    return {
      last: last.c,
      open: first.o,
      high,
      low,
      change: last.c - first.o,
      changePct: ((last.c - first.o) / first.o) * 100,
      volume: totalVol,
      lastVolume: last.v || 0,
    };
  }, [candleData]);

  const sentimentScore = sentiment?.score ?? null;
  const direction = sentiment?.direction || 'NEUTRAL';

  const directionClass =
    direction === 'BUY' ? 'buy' : direction === 'SELL' ? 'sell' : 'neutral';

  const gauge = sentimentScore == null ? 0 : Math.max(-1, Math.min(1, sentimentScore));
  const gaugeOffset = ((gauge + 1) / 2) * 100;

  return (
    <div className="market-card">
      <header className="card-header">
        <span>Market — {asset || '—'}</span>
      </header>

      <section className="block">
        <div className="row">
          <span className="lbl">Last</span>
          <span className="val">{stats ? stats.last.toFixed(5) : '—'}</span>
        </div>
        <div className="row">
          <span className="lbl">Change</span>
          <span className={`val ${stats?.change >= 0 ? 'up' : 'down'}`}>
            {stats ? `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(5)} (${stats.changePct.toFixed(2)}%)` : '—'}
          </span>
        </div>
        <div className="row">
          <span className="lbl">Range</span>
          <span className="val">
            {stats ? `${stats.low.toFixed(5)} — ${stats.high.toFixed(5)}` : '—'}
          </span>
        </div>
      </section>

      <section className="block">
        <div className="block-title">Volume</div>
        <div className="row">
          <span className="lbl">Window total</span>
          <span className="val">{stats ? stats.volume.toLocaleString() : '—'}</span>
        </div>
        <div className="row">
          <span className="lbl">Last bar</span>
          <span className="val">{stats ? stats.lastVolume.toLocaleString() : '—'}</span>
        </div>
        <div className="vol-bar">
          {(candleData?.candles || []).slice(-30).map((c, i) => {
            const max = Math.max(1, ...(candleData?.candles || []).slice(-30).map((x) => x.v || 0));
            const h = ((c.v || 0) / max) * 100;
            return (
              <span
                key={i}
                className={`vol-tick ${c.c >= c.o ? 'up' : 'down'}`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </section>

      <section className="block">
        <div className="block-title">Sentiment Engine</div>
        <div className="gauge-wrap">
          <div className="gauge-track">
            <div className="gauge-zone bear" />
            <div className="gauge-zone neutral" />
            <div className="gauge-zone bull" />
            <div className="gauge-needle" style={{ left: `${gaugeOffset}%` }} />
          </div>
          <div className="gauge-labels">
            <span>−1</span><span>0</span><span>+1</span>
          </div>
        </div>
        <div className="row">
          <span className="lbl">Score</span>
          <span className="val">{sentimentScore == null ? '—' : sentimentScore.toFixed(3)}</span>
        </div>
        <div className="row">
          <span className="lbl">Next trade</span>
          <span className={`pill ${directionClass}`}>{direction}</span>
        </div>
        <p className="note">|score| ≥ 0.5 required for execution.</p>
      </section>

      <style jsx>{`
        .market-card {
          display: flex;
          flex-direction: column;
          background: #0d1320;
          border: 1px solid #1d2433;
          border-radius: 12px;
          overflow: hidden;
        }
        .card-header {
          padding: 12px 16px;
          border-bottom: 1px solid #1d2433;
          font-size: 12px;
          letter-spacing: 2px;
          color: #6e7888;
        }
        .block {
          padding: 14px 16px;
          border-bottom: 1px solid #1d2433;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .block:last-child { border-bottom: none; }
        .block-title {
          font-size: 10px;
          color: #6e7888;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .lbl { color: #6e7888; }
        .val { color: #e6edf3; font-variant-numeric: tabular-nums; }
        .val.up { color: #56d364; }
        .val.down { color: #ff7b72; }
        .vol-bar {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 36px;
          margin-top: 6px;
        }
        .vol-tick {
          flex: 1;
          min-height: 1px;
          border-radius: 1px;
          opacity: 0.7;
        }
        .vol-tick.up { background: #3fb950; }
        .vol-tick.down { background: #f85149; }
        .gauge-wrap { padding: 4px 0; }
        .gauge-track {
          position: relative;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
          background: #161b27;
          display: flex;
        }
        .gauge-zone { flex: 1; height: 100%; }
        .gauge-zone.bear { background: linear-gradient(90deg, #f85149aa, #f8514944); }
        .gauge-zone.neutral { background: #1d2433; flex: 0 0 25%; }
        .gauge-zone.bull { background: linear-gradient(90deg, #3fb95044, #3fb950aa); }
        .gauge-needle {
          position: absolute;
          top: -2px;
          width: 2px;
          height: 14px;
          background: #e6edf3;
          transform: translateX(-50%);
        }
        .gauge-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #6e7888;
          margin-top: 4px;
          letter-spacing: 1px;
        }
        .pill {
          font-size: 10px;
          letter-spacing: 1.5px;
          padding: 3px 10px;
          border-radius: 4px;
          font-weight: 700;
        }
        .pill.buy { background: #3fb95022; color: #56d364; }
        .pill.sell { background: #f8514922; color: #ff7b72; }
        .pill.neutral { background: #1d2433; color: #9ca3af; }
        .note {
          font-size: 10px;
          color: #6e7888;
          margin-top: 4px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
