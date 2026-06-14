import  { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Permission = 'Create Campaigns' | 'Delete Campaigns' | 'Manage Journeys' | 'View Analytics' | 'Workspace Settings';
type RoleName = 'Admin' | 'Manager' | 'Analyst' | 'Viewer';

interface RoleMatrix {
  permission: Permission;
  roles: Record<RoleName, boolean>;
}

const defaultMatrix: RoleMatrix[] = [
  { permission: 'Create Campaigns', roles: { Admin: true, Manager: true, Analyst: true, Viewer: false } },
  { permission: 'Delete Campaigns', roles: { Admin: true, Manager: false, Analyst: false, Viewer: false } },
  { permission: 'Manage Journeys', roles: { Admin: true, Manager: true, Analyst: false, Viewer: false } },
  { permission: 'View Analytics', roles: { Admin: true, Manager: true, Analyst: true, Viewer: true } },
  { permission: 'Workspace Settings', roles: { Admin: true, Manager: false, Analyst: false, Viewer: false } },
];

export default function RolesTab() {
  const [matrix, setMatrix] = useState<RoleMatrix[]>(() => {
    const saved = localStorage.getItem('crm_rolesData');
    return saved ? JSON.parse(saved) : defaultMatrix;
  });

  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const togglePermission = (permission: Permission, role: RoleName) => {
    // Admin permissions cannot be removed in this mock
    if (role === 'Admin') return;
    
    setMatrix(prev => prev.map(row => {
      if (row.permission === permission) {
        return {
          ...row,
          roles: { ...row.roles, [role]: !row.roles[role] }
        };
      }
      return row;
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    localStorage.setItem('crm_rolesData', JSON.stringify(matrix));
    setIsSaving(false);
    setHasChanges(false);
    
    setToast({ type: 'success', message: 'Permissions saved successfully.' });
    setTimeout(() => setToast(null), 3000);
  };

  const roleHeaders: RoleName[] = ['Admin', 'Manager', 'Analyst', 'Viewer'];

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Roles & Permissions</h2>
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving} 
          style={{ padding: '8px 16px', fontSize: '13px', opacity: !hasChanges ? 0.5 : 1, cursor: !hasChanges ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isSaving && <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
          Save Permissions
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
            <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textAlign: 'left', borderRadius: '8px 0 0 0' }}>Permission</th>
            {roleHeaders.map(role => (
              <th key={role} style={{ padding: '12px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, borderRadius: role === 'Viewer' ? '0 8px 0 0' : '0' }}>{role}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px', textAlign: 'left', fontWeight: 500 }}>{row.permission}</td>
              {roleHeaders.map(role => (
                <td 
                  key={role} 
                  style={{ padding: '16px', cursor: role === 'Admin' ? 'not-allowed' : 'pointer' }}
                  onClick={() => togglePermission(row.permission, role)}
                >
                  <div style={{ width: '32px', height: '32px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', transition: 'background 0.2s', background: role !== 'Admin' ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {row.roles[role] ? <CheckCircle2 size={18} color={role === 'Admin' ? 'var(--accent-secondary)' : '#00C27A'} /> : <span style={{ color: 'var(--text-tertiary)' }}>-</span>}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
