import  { useState, useEffect } from 'react';

interface Channel {
  id: string;
  name: string;
  isConnected: boolean;
  color: string;
  icon: string;
}

export default function ChannelsTab() {
  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('crm_channelsData');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'whatsapp', name: 'WhatsApp', isConnected: true, color: '#25D366', icon: '💬' },
      { id: 'email', name: 'Email (SMTP)', isConnected: true, color: 'var(--accent-secondary)', icon: '📧' },
      { id: 'sms', name: 'SMS Gateway', isConnected: false, color: 'var(--accent-secondary)', icon: '📱' },
      { id: 'push', name: 'Push Notifications', isConnected: false, color: '#f59e0b', icon: '🔔' },
    ];
  });

  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('crm_channelsData', JSON.stringify(channels));
  }, [channels]);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleConnection = async (id: string, currentlyConnected: boolean) => {
    setProcessingId(id);
    await new Promise(r => setTimeout(r, 1000)); // Simulate API delay
    
    setChannels(channels.map(c => 
      c.id === id ? { ...c, isConnected: !currentlyConnected } : c
    ));
    
    setProcessingId(null);
    showToast(currentlyConnected ? 'Channel disconnected successfully' : 'Channel connected successfully');
  };

  const testConnection = async (id: string, name: string) => {
    setProcessingId(`test_${id}`);
    await new Promise(r => setTimeout(r, 1200));
    setProcessingId(null);
    showToast(`Test message sent via ${name} successfully!`);
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Communication Channels</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {channels.map((c) => (
          <div key={c.id} style={{ background: 'var(--bg-tertiary)', border: `1px solid ${c.isConnected ? 'rgba(0,194,122,0.3)' : 'var(--border-subtle)'}`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
            {c.isConnected && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#00C27A' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{c.icon}</span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.isConnected ? '#00C27A' : '#64748b', boxShadow: c.isConnected ? '0 0 8px rgba(0,194,122,0.6)' : 'none' }} />
            </div>
            
            <div style={{ fontSize: '13px', color: c.isConnected ? '#00C27A' : 'var(--text-secondary)', fontWeight: 500 }}>
              Status: {c.isConnected ? 'Connected' : 'Not Connected'}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => toggleConnection(c.id, c.isConnected)}
                disabled={processingId !== null}
                style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: c.isConnected ? '#ef4444' : 'var(--text-primary)', borderColor: c.isConnected ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)' }}
              >
                {processingId === c.id ? <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : null}
                {c.isConnected ? 'Disconnect' : 'Connect'}
              </button>
              
              {c.isConnected && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => testConnection(c.id, c.name)}
                  disabled={processingId !== null}
                  style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  {processingId === `test_${c.id}` ? <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : null}
                  Test Connection
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
