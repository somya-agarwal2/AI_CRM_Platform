import React, { useState, useEffect } from 'react';

export default function ProfileTab({ setDirty }: { setDirty: (dirty: boolean) => void }) {
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem('crm_profileData');
    return saved ? JSON.parse(saved) : {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@nike.in',
      department: 'Marketing Manager',
      timezone: 'Asia/Kolkata (IST)',
      avatarUrl: null
    };
  });

  const [formData, setFormData] = useState(profileData);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const hasChanges = JSON.stringify(profileData) !== JSON.stringify(formData);

  useEffect(() => {
    setDirty(hasChanges);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, setDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setToast({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    setProfileData(formData);
    localStorage.setItem('crm_profileData', JSON.stringify(formData));
    window.dispatchEvent(new Event('profileUpdated'));
    setIsSaving(false);
    setToast({ type: 'success', message: 'Profile updated successfully.' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData((prev: any) => ({ ...prev, avatarUrl: url }));
      setToast({ type: 'success', message: 'Avatar changed. Click Save Changes to apply.' });
      setTimeout(() => setToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData((prev: any) => ({ ...prev, avatarUrl: null }));
    setShowRemoveModal(false);
    setToast({ type: 'success', message: 'Avatar removed. Click Save Changes to apply.' });
    setTimeout(() => setToast(null), 3000);
  };

  const initials = `${formData.firstName?.charAt(0) || ''}${formData.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Profile</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: formData.avatarUrl ? 'transparent' : '#00C27A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: formData.avatarUrl ? 'transparent' : '#031B34', fontWeight: 700, overflow: 'hidden', border: formData.avatarUrl ? '1px solid var(--border-subtle)' : 'none' }}>
          {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{formData.firstName} {formData.lastName}</h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{formData.department || 'Marketing Manager'}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', margin: 0 }}>
              Change Avatar
              <input type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </label>
            <button className="btn btn-secondary" onClick={() => setShowRemoveModal(true)} disabled={!formData.avatarUrl} style={{ padding: '6px 12px', fontSize: '13px', color: formData.avatarUrl ? '#ef4444' : 'var(--text-tertiary)', borderColor: 'transparent', cursor: formData.avatarUrl ? 'pointer' : 'not-allowed' }}>Remove Avatar</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>First Name *</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
          </div>
          <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Last Name *</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
          </div>
        </div>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email Address *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
        </div>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Department</label>
          <input type="text" name="department" value={formData.department} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
        </div>
        <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Timezone</label>
          <input type="text" name="timezone" value={formData.timezone} onChange={handleChange} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || isSaving} style={{ padding: '12px 24px', alignSelf: 'flex-start', marginTop: '8px', opacity: !hasChanges ? 0.5 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSaving ? <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : null}
        Save Changes
      </button>

      {showRemoveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Remove Avatar</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Are you sure you want to remove your avatar? This will reset your profile to use your initials.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowRemoveModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRemoveAvatar} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
