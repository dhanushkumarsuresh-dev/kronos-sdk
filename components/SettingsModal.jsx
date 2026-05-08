import { useEffect, useState } from 'react';

const DEFAULT_CONFIG = {
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
          apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...(parsed.apiKeys || {}) },
          strategy: { ...DEFAULT_CONFIG.strategy, ...(parsed.strategy || {}) },
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

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('kronos_config', JSON.stringify(config));
    onSaved?.();
  };

  const handleClear = () => {
    if (!confirm('Wipe Kronos config from this browser?')) return;
    localStorage.removeItem('kronos_config');
    setConfig(DEFAULT_CONFIG);
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
          .field input {
            background: #0a0e1a;
            border: 1px solid #1d2433;
            color: #e6edf3;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 13px;
            outline: none;
          }
          .field input:focus {
            border-color: #1f6feb;
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
