import  { useState } from 'react';

export default function BillingTab() {
  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsUpgrading(false);
    showToast('Redirecting to Stripe payment portal...', 'success');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsDownloading(false);
    showToast('Invoice INV-2026-06 downloaded successfully.', 'success');
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Billing & Usage</h2>
        <button 
          className="btn btn-secondary" 
          onClick={handleDownload} 
          disabled={isDownloading} 
          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isDownloading ? <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : '📄'}
          Download Latest Invoice
        </button>
      </div>
      
      <div style={{ background: 'linear-gradient(145deg, #031B34 0%, var(--bg-secondary) 100%)', border: '1px solid #00C27A', borderRadius: '12px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#00C27A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Current Plan</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>EngageX Pro</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>Next billing date: July 1, 2026 ($249/mo)</div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleUpgrade}
          disabled={isUpgrading}
          style={{ padding: '12px 24px', background: '#00C27A', color: '#031B34', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
        >
          {isUpgrading && <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(3,27,52,0.3)', borderTopColor: '#031B34', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
          Upgrade Plan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Customers Tracked</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>12,540 <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ 20k</span></div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '12px' }}>
            <div style={{ width: '62%', height: '100%', background: '#00C27A', borderRadius: '2px' }} />
          </div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Messages Sent</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>52,000 <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ 100k</span></div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '12px' }}>
            <div style={{ width: '52%', height: '100%', background: 'var(--accent-secondary)', borderRadius: '2px' }} />
          </div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Storage Used</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>2.4 GB <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ 10 GB</span></div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '12px' }}>
            <div style={{ width: '24%', height: '100%', background: 'var(--accent-secondary)', borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
