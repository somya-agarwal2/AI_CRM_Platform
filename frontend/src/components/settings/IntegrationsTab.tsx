import  { useState, useEffect } from 'react';
import { Blocks } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  desc: string;
  isConnected: boolean;
}

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    const saved = localStorage.getItem('crm_integrationsData');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'shopify', name: 'Shopify', desc: 'Sync customers, orders, and products.', isConnected: true },
      { id: 'woo', name: 'WooCommerce', desc: 'Sync customers, orders, and products.', isConnected: true },
      { id: 'salesforce', name: 'Salesforce', desc: 'Two-way sync for B2B CRM data.', isConnected: false },
      { id: 'hubspot', name: 'HubSpot', desc: 'Sync marketing leads and activities.', isConnected: false },
    ];
  });

  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('crm_integrationsData', JSON.stringify(integrations));
  }, [integrations]);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleConnection = async (id: string, currentlyConnected: boolean, name: string) => {
    setProcessingId(id);
    await new Promise(r => setTimeout(r, 1200)); // Simulate OAuth / API delay
    
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, isConnected: !currentlyConnected } : i
    ));
    
    setProcessingId(null);
    showToast(currentlyConnected ? `${name} disconnected successfully` : `${name} connected successfully`);
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Integrations</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {integrations.map((integration) => (
          <div key={integration.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Blocks size={24} color={integration.isConnected ? '#00C27A' : 'var(--text-secondary)'} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{integration.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>{integration.desc}</div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: integration.isConnected ? '#00C27A' : 'var(--text-tertiary)', background: integration.isConnected ? 'rgba(0,194,122,0.1)' : 'transparent', padding: integration.isConnected ? '4px 8px' : '0', borderRadius: '4px' }}>
                  {integration.isConnected ? 'Connected' : 'Not Connected'}
                </span>
                
                <button 
                  className="btn btn-secondary" 
                  onClick={() => toggleConnection(integration.id, integration.isConnected, integration.name)}
                  disabled={processingId !== null}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    color: integration.isConnected ? '#ef4444' : 'var(--text-primary)',
                    borderColor: integration.isConnected ? 'transparent' : 'var(--border-subtle)',
                    background: integration.isConnected ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)'
                  }}
                >
                  {processingId === integration.id && <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: integration.isConnected ? '#ef4444' : 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                  {integration.isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
