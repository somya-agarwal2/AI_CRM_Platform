import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export default function AIPrefsTab({ setDirty }: { setDirty: (dirty: boolean) => void }) {
  const [prefsData, setPrefsData] = useState(() => {
    const saved = localStorage.getItem('crm_aiPrefsData');
    return saved ? JSON.parse(saved) : {
      generateSegments: true,
      suggestCampaigns: true,
      recommendWorkflows: true,
      predictChurn: true,
      confidenceThreshold: 80
    };
  });

  const [formData, setFormData] = useState(prefsData);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{type: string, message: string} | null>(null);

  const hasChanges = JSON.stringify(prefsData) !== JSON.stringify(formData);

  useEffect(() => {
    if (setDirty) setDirty(hasChanges);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, setDirty]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, confidenceThreshold: parseInt(e.target.value) });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    setPrefsData(formData);
    localStorage.setItem('crm_aiPrefsData', JSON.stringify(formData));
    setIsSaving(false);
    
    setToast({ type: 'success', message: 'AI preferences saved successfully.' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="#00C27A" /> AI Preferences
      </h2>
      
      <div style={{ background: 'rgba(0,194,122,0.05)', border: '1px solid rgba(0,194,122,0.2)', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>AI Autopilot</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { name: 'generateSegments', label: 'Generate segments automatically' },
            { name: 'suggestCampaigns', label: 'Suggest campaigns based on trends' },
            { name: 'recommendWorkflows', label: 'Recommend journey workflows' },
            { name: 'predictChurn', label: 'Predict churn risk' }
          ].map((pref) => (
            <label key={pref.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name={pref.name} 
                checked={formData[pref.name as keyof typeof formData] as boolean} 
                onChange={handleCheckboxChange} 
                style={{ accentColor: '#00C27A', width: '18px', height: '18px', cursor: 'pointer' }} 
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{pref.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: 'none', padding: 0, marginTop: '8px' }}>
        <label style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>AI Confidence Threshold</label>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>AI will only trigger actions automatically if its prediction confidence meets this threshold.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <input 
            type="range" 
            min="50" 
            max="99" 
            value={formData.confidenceThreshold} 
            onChange={handleSliderChange} 
            style={{ flex: 1, accentColor: '#00C27A', cursor: 'pointer' }} 
          />
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', width: '48px', textAlign: 'right' }}>{formData.confidenceThreshold}%</span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || isSaving} style={{ padding: '12px 24px', alignSelf: 'flex-start', marginTop: '16px', opacity: !hasChanges ? 0.5 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSaving ? <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : null}
        Save Preferences
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
