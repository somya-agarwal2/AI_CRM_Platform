import React, { useState, useEffect } from 'react';

export default function SecurityTab() {
  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    const saved = localStorage.getItem('crm_security_2fa');
    return saved ? JSON.parse(saved) : true;
  });

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('crm_security_2fa', JSON.stringify(twoFactorEnabled));
  }, [twoFactorEnabled]);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsProcessing(false);
    setShowPasswordModal(false);
    showToast('Password updated successfully');
  };

  const toggle2FA = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    setTwoFactorEnabled(!twoFactorEnabled);
    setIsProcessing(false);
    showToast(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Security</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Password */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Change Password</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Last changed 4 months ago</div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>Update</button>
        </div>

        {/* 2FA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Authentication</div>
            <div style={{ fontSize: '13px', color: twoFactorEnabled ? '#00C27A' : 'var(--text-secondary)' }}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={toggle2FA} 
            disabled={isProcessing}
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: twoFactorEnabled ? '#ef4444' : 'var(--text-primary)' }}
          >
            {isProcessing && <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            {twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Sessions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Active Sessions</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>2 sessions active</div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowSessionsModal(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
        </div>

        {/* API Keys */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>API Keys</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your API access tokens</div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowKeysModal(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>Manage</button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Change Password</h3>
            <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Current Password</label>
                <input type="password" required style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
              <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>New Password</label>
                <input type="password" required minLength={8} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isProcessing && <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Active Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'rgba(0,194,122,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Mac OS • Chrome</div>
                  <span style={{ fontSize: '11px', background: '#00C27A', color: '#031B34', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Current Session</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bengaluru, India • IP: 103.45.67.89</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Windows 11 • Edge</div>
                  <button className="btn btn-secondary" onClick={() => { showToast('Session revoked'); setShowSessionsModal(false); }} style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', borderColor: 'transparent' }}>Revoke</button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Delhi, India • IP: 14.139.245.2</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowSessionsModal(false)} style={{ padding: '8px 16px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Modal */}
      {showKeysModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>API Keys</h3>
              <button className="btn btn-primary" onClick={() => { showToast('New API key generated'); setShowKeysModal(false); }} style={{ padding: '6px 12px', fontSize: '13px' }}>Generate New Key</button>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Production Sync Key</div>
                <button className="btn btn-secondary" onClick={() => showToast('Key copied to clipboard')} style={{ padding: '4px 8px', fontSize: '12px' }}>Copy</button>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                xk_live_98a7s9d8f7s98d7f98s7d98f7s98d
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowKeysModal(false)} style={{ padding: '8px 16px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
