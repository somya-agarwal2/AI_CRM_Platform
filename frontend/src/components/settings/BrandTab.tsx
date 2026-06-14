import React, { useState, useEffect } from 'react';

export default function BrandTab({ setDirty }: { setDirty: (dirty: boolean) => void }) {
  const [brandData, setBrandData] = useState(() => {
    const saved = localStorage.getItem('crm_brandData');
    return saved ? JSON.parse(saved) : {
      brandName: 'Nike India',
      primaryColor: '#00C27A',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata (IST)',
      logoUrl: null
    };
  });

  const [formData, setFormData] = useState(brandData);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{type: string, message: string} | null>(null);

  const hasChanges = JSON.stringify(brandData) !== JSON.stringify(formData);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ type: 'error', message: 'Only JPG, PNG, and WEBP formats are supported.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setFormData((prev: any) => ({ ...prev, logoUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    setBrandData(formData);
    localStorage.setItem('crm_brandData', JSON.stringify(formData));
    setIsSaving(false);
    
    setToast({ type: 'success', message: 'Brand settings saved successfully.' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Brand Settings</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {formData.logoUrl ? (
            <img src={formData.logoUrl} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{formData.brandName.charAt(0) || 'B'}</span>
          )}
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Brand Logo</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', margin: 0 }}>
              Upload Logo
              <input type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </label>
            {formData.logoUrl && (
              <button className="btn btn-secondary" onClick={() => setFormData((prev: any) => ({...prev, logoUrl: null}))} style={{ padding: '6px 12px', fontSize: '13px', color: '#ef4444', borderColor: 'transparent' }}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Brand Name</label>
          <input type="text" name="brandName" value={formData.brandName} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
        </div>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Primary Color (Hex)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: formData.primaryColor || '#000', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
            <input type="text" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} placeholder="#00C27A" />
          </div>
        </div>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Currency</label>
          <select name="currency" value={formData.currency} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}>
            <option value="INR (₹)">INR (₹)</option>
            <option value="USD ($)">USD ($)</option>
            <option value="EUR (€)">EUR (€)</option>
            <option value="GBP (£)">GBP (£)</option>
          </select>
        </div>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Timezone</label>
          <select name="timezone" value={formData.timezone} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}>
            <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
            <option value="America/New_York (EST)">America/New_York (EST)</option>
            <option value="Europe/London (GMT)">Europe/London (GMT)</option>
            <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || isSaving} style={{ padding: '12px 24px', alignSelf: 'flex-start', marginTop: '8px', opacity: !hasChanges ? 0.5 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSaving && <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
        Save Branding
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
