import { useEffect, useMemo, useRef, useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';

const TIMEFRAMES = [
  { id: '1', label: '1m' },
  { id: '5', label: '5m' },
  { id: '15', label: '15m' },
  { id: '60', label: '1h' },
  { id: 'D', label: '1D' },
];

export default function PriceChart({ config, asset, timeframe, onTimeframeChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [ready, setReady] = useState(false);

  const { data, error, loading, updatedAt } = useMarketData({ config, asset, resolution: timeframe });

  // Mount the chart on the client
  useEffect(() => {
    let resizeObserver;
    let cancelled = false;
    (async () => {
      const lib = await import('lightweight-charts');
      if (cancelled || !containerRef.current) return;
      const chart = lib.createChart(containerRef.current, {
        layout: { background: { color: '#0a0e1a' }, textColor: '#9ca3af' },
        grid: {
          vertLines: { color: '#1d2433' },
          horzLines: { color: '#1d2433' },
        },
        rightPriceScale: { borderColor: '#1d2433' },
        timeScale: { borderColor: '#1d2433', timeVisible: true, secondsVisible: false },
        crosshair: { mode: lib.CrosshairMode.Normal },
        autoSize: true,
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#3fb950',
        downColor: '#f85149',
        borderUpColor: '#3fb950',
        borderDownColor: '#f85149',
        wickUpColor: '#3fb950',
        wickDownColor: '#f85149',
      });
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
        borderColor: '#1d2433',
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      setReady(true);

      resizeObserver = new ResizeObserver(() => chart.timeScale().fitContent());
      resizeObserver.observe(containerRef.current);
    })();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        setReady(false);
      }
    };
  }, []);

  // Push candle data into the series
  useEffect(() => {
    if (!ready || !data?.candles) return;
    const candles = data.candles.map((c) => ({
      time: c.t,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));
    const volumes = data.candles.map((c) => ({
      time: c.t,
      value: c.v,
      color: c.c >= c.o ? '#3fb95066' : '#f8514966',
    }));
    candleSeriesRef.current?.setData(candles);
    volumeSeriesRef.current?.setData(volumes);
    chartRef.current?.timeScale().fitContent();
  }, [ready, data]);

  const last = useMemo(() => {
    if (!data?.candles?.length) return null;
    const c = data.candles[data.candles.length - 1];
    const first = data.candles[0];
    const change = c.c - first.o;
    const changePct = (change / first.o) * 100;
    return { close: c.c, change, changePct };
  }, [data]);

  const hasFinnhubKey = Boolean(config?.apiKeys?.finnhub);

  return (
    <div className="chart-card">
      <header className="chart-header">
        <div className="chart-title">
          <span className="asset">{asset || '—'}</span>
          {last && (
            <>
              <span className="price">{last.close}</span>
              <span className={`delta ${last.change >= 0 ? 'up' : 'down'}`}>
                {last.change >= 0 ? '+' : ''}
                {last.change.toFixed(5)} ({last.changePct.toFixed(2)}%)
              </span>
            </>
          )}
          {error && <span className="warn-dot" title={error} />}
        </div>
        <div className="tf-row">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              className={`tf-btn ${t.id === timeframe ? 'active' : ''}`}
              onClick={() => onTimeframeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {!hasFinnhubKey ? (
        <div className="prompt">Configure your Finnhub key in Settings to load market data.</div>
      ) : (
        <div className="chart-wrap" ref={containerRef}>
          {loading && !data && <div className="skeleton" />}
        </div>
      )}

      <footer className="chart-footer">
        <span>{data?.candles?.length ?? 0} candles</span>
        <span>{updatedAt ? `updated ${updatedAt.toLocaleTimeString()}` : ''}</span>
      </footer>

      <style jsx>{`
        .chart-card {
          display: flex;
          flex-direction: column;
          background: #0d1320;
          border: 1px solid #1d2433;
          border-radius: 12px;
          min-height: 0;
          overflow: hidden;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #1d2433;
          gap: 12px;
          flex-wrap: wrap;
        }
        .chart-title {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }
        .asset {
          font-weight: 700;
          letter-spacing: 2px;
          font-size: 14px;
        }
        .price {
          font-size: 18px;
          font-weight: 600;
          color: #e6edf3;
        }
        .delta { font-size: 12px; }
        .delta.up { color: #56d364; }
        .delta.down { color: #ff7b72; }
        .warn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d29922;
          display: inline-block;
        }
        .tf-row { display: flex; gap: 4px; }
        .tf-btn {
          background: transparent;
          color: #6e7888;
          font-size: 11px;
          letter-spacing: 1px;
          padding: 6px 10px;
          border-radius: 4px;
        }
        .tf-btn:hover { background: #161b27; color: #e6edf3; }
        .tf-btn.active { background: #1f6feb; color: white; }
        .chart-wrap {
          position: relative;
          flex: 1;
          min-height: 280px;
          background: #0a0e1a;
        }
        .skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #0d1320, #161b27, #0d1320);
          background-size: 200% 100%;
          animation: shimmer 1.6s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .prompt {
          padding: 60px 24px;
          color: #6e7888;
          text-align: center;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .chart-footer {
          display: flex;
          justify-content: space-between;
          padding: 8px 16px;
          border-top: 1px solid #1d2433;
          font-size: 10px;
          color: #6e7888;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
