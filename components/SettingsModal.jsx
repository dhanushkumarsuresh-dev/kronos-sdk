import { useEffect, useState } from 'react';
import { emitConfigChange } from '../hooks/useConfig';

const DEFAULT_CONFIG = {
  mode: 'demo',
  apiKeys: {
    etoroPublic: '',
    etoroUser: '',
    finnhub: '',
  },
  strategy: {
    asset: 'EURUSD',
    riskPerTrade: 0.02,
    leverage: 30,
    rewardRatio: 2,
  },
  chart: {
    asset: '',
    timeframe: '15',
  },
};

export default function SettingsModal({ onClose, onSaved }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('kronos_config');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setConfig({
          mode: parsed.mode === 'real' ? 'real' : 'demo',
          apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...(parsed.apiKeys || {}) },
          strategy: { ...DEFAULT_CONFIG.strategy, ...(parsed.strategy || {}) },
          chart: { ...DEFAULT_CONFIG.chart, ...(parsed.chart || {}) },
        });
      } catch {
        // ignore corrupt config
      }
    }
  }, []);

  const updateKey = (key, value) =>
    setConfig((c) => ({ ...c, apiKeys: { ...c.apiKeys, [key]: value } }));

  const updateStrategy = (key, value) =>
    setConfig((c) => ({ ...c, strategy: { ...c.strategy, [key]: value } }));

  const updateChart = (key, value) =>
    setConfig((c) => ({ ...c, chart: { ...c.chart, [key]: value } }));

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('kronos_config', JSON.stringify(config));
    emitConfigChange();
    onSaved?.();
  };

  const handleClear = () => {
    if (!confirm('Wipe Kronos config from this browser?')) return;
    localStorage.removeItem('kronos_config');
    setConfig(DEFAULT_CONFIG);
    emitConfigChange();
    onSaved?.();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
        <header className="modal-header">
          <h2>Kronos Settings</h2>
          <button type="button" className="x-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="section">
          <h3>Account Mode</h3>
          <p className="section-note">
            eToro splits PnL and positions endpoints between Demo (virtual) and Real money accounts.
            A 403 from <code>/trading/info/real/pnl</code> almost always means you have a Demo account
            but Kronos is hitting the Real path (or vice-versa).
          </p>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${config.mode === 'demo' ? 'active' : ''}`}
              onClick={() => setConfig((c) => ({ ...c, mode: 'demo' }))}
            >
              <span className="mode-label">DEMO</span>
              <span className="mode-sub">Virtual account · safe</span>
            </button>
            <button
              type="button"
              className={`mode-btn real ${config.mode === 'real' ? 'active' : ''}`}
              onClick={() => setConfig((c) => ({ ...c, mode: 'real' }))}
            >
              <span className="mode-label">REAL</span>
              <span className="mode-sub">Live money · danger</span>
            </button>
          </div>
          {config.mode === 'real' && (
            <p className="warn-note">
              ⚠ Real-money mode. Kronos will place live orders on your eToro account.
            </p>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h3>API Keys</h3>
            <button type="button" className="link-btn" onClick={() => setShowKeys((s) => !s)}>
              {showKeys ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="section-note">
            Stored only in this browser&apos;s LocalStorage. Forwarded to the serverless function
            per request — never persisted server-side.
          </p>

          <label className="field">
            <span>eToro Public Key (x-api-key)</span>
            <input
              type={showKeys ? 'text' : 'password'}
              value={config.apiKeys.etoroPublic}
              onChange={(e) => updateKey('etoroPublic', e.target.value)}
              placeholder="public app identifier"
              autoComplete="off"
              required
            />
          </label>

          <label className="field">
            <span>eToro User Key (x-user-key)</span>
            <input
              type={showKeys ? 'text' : 'password'}
              value={config.apiKeys.etoroUser}
              onChange={(e) => updateKey('etoroUser', e.target.value)}
              placeholder="personal auth token"
              autoComplete="off"
              required
            />
          </label>

          <label className="field">
            <span>Finnhub Key</span>
            <input
              type={showKeys ? 'text' : 'password'}
              value={config.apiKeys.finnhub}
              onChange={(e) => updateKey('finnhub', e.target.value)}
              placeholder="finnhub.io api key"
              autoComplete="off"
            />
          </label>
        </section>

        <section className="section">
          <h3>Strategy</h3>
          <div className="grid">
            <label className="field">
              <span>Asset</span>
              <input
                type="text"
                value={config.strategy.asset}
                onChange={(e) => updateStrategy('asset', e.target.value.toUpperCase())}
              />
            </label>
            <label className="field">
              <span>Risk Per Trade</span>
              <input
                type="number"
                step="0.005"
                min="0.001"
                max="0.1"
                value={config.strategy.riskPerTrade}
                onChange={(e) => updateStrategy('riskPerTrade', parseFloat(e.target.value) || 0)}
              />
            </label>
            <label className="field">
              <span>Leverage</span>
              <input
                type="number"
                step="1"
                min="1"
                max="400"
                value={config.strategy.leverage}
                onChange={(e) => updateStrategy('leverage', parseInt(e.target.value, 10) || 1)}
              />
            </label>
            <label className="field">
              <span>Reward : Risk</span>
              <input
                type="number"
                step="0.5"
                min="1"
                value={config.strategy.rewardRatio}
                onChange={(e) => updateStrategy('rewardRatio', parseFloat(e.target.value) || 1)}
              />
            </label>
          </div>
        </section>

        <section className="section">
          <h3>Chart</h3>
          <p className="section-note">
            Defaults to your strategy asset. Override here to watch a different market.
          </p>
          <div className="grid">
            <label className="field">
              <span>Chart Asset (override)</span>
              <input
                type="text"
                value={config.chart.asset}
                onChange={(e) => updateChart('asset', e.target.value.toUpperCase())}
                placeholder={config.strategy.asset || 'EURUSD'}
              />
            </label>
            <label className="field">
              <span>Default Timeframe</span>
              <select
                value={config.chart.timeframe}
                onChange={(e) => updateChart('timeframe', e.target.value)}
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="60">1 hour</option>
                <option value="D">1 day</option>
              </select>
            </label>
          </div>
          {!config.apiKeys.finnhub && (
            <p className="warn-note">
              ⚠ Chart and sentiment features require a Finnhub key.
            </p>
          )}
        </section>

        <footer className="modal-footer">
          <button type="button" className="ghost-btn" onClick={handleClear}>
            Wipe Config
          </button>
          <div className="footer-right">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Save
            </button>
          </div>
        </footer>

        <style jsx>{`
          .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            backdrop-filter: blur(2px);
          }
          .modal {
            background: #0d1320;
            border: 1px solid #1d2433;
            border-radius: 12px;
            width: min(560px, 92vw);
            max-height: 90vh;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-header h2 {
            font-size: 16px;
            letter-spacing: 3px;
          }
          .x-btn {
            background: transparent;
            color: #6e7888;
            font-size: 24px;
            line-height: 1;
            padding: 0 8px;
          }
          .x-btn:hover {
            color: #e6edf3;
          }
          .section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .section-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .section h3 {
            font-size: 12px;
            letter-spacing: 2px;
            color: #6e7888;
            text-transform: uppercase;
          }
          .section-note {
            font-size: 11px;
            color: #6e7888;
            line-height: 1.5;
          }
          .field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .field span {
            font-size: 11px;
            color: #6e7888;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .field input,
          .field select {
            background: #0a0e1a;
            border: 1px solid #1d2433;
            color: #e6edf3;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 13px;
            outline: none;
          }
          .field input:focus,
          .field select:focus {
            border-color: #1f6feb;
          }
          .warn-note {
            font-size: 11px;
            color: #d29922;
            margin-top: 4px;
          }
          .mode-toggle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .mode-btn {
            background: #0a0e1a;
            border: 1px solid #1d2433;
            color: #e6edf3;
            padding: 14px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
            text-align: left;
            transition: all 0.15s;
          }
          .mode-btn:hover { border-color: #2a3142; }
          .mode-btn.active {
            border-color: #1f6feb;
            background: #1f6feb15;
          }
          .mode-btn.real.active {
            border-color: #f85149;
            background: #f8514915;
          }
          .mode-label {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 3px;
          }
          .mode-btn.real .mode-label { color: #ff7b72; }
          .mode-btn.active .mode-label { color: #58a6ff; }
          .mode-btn.real.active .mode-label { color: #ff7b72; }
          .mode-sub {
            font-size: 10px;
            color: #6e7888;
            letter-spacing: 1px;
          }
          code {
            background: #0a0e1a;
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 11px;
            color: #d29922;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .modal-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            border-top: 1px solid #1d2433;
            padding-top: 16px;
          }
          .footer-right {
            display: flex;
            gap: 10px;
          }
          .ghost-btn {
            background: transparent;
            color: #e6edf3;
            border: 1px solid #1d2433;
            padding: 9px 16px;
            border-radius: 6px;
            font-size: 12px;
            letter-spacing: 1px;
          }
          .ghost-btn:hover {
            background: #161b27;
          }
          .primary-btn {
            background: #1f6feb;
            color: white;
            padding: 9px 18px;
            border-radius: 6px;
            font-size: 12px;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .primary-btn:hover {
            background: #388bfd;
          }
          .link-btn {
            background: transparent;
            color: #58a6ff;
            font-size: 11px;
            letter-spacing: 1px;
          }
        `}</style>
      </form>
    </div>
  );
}
