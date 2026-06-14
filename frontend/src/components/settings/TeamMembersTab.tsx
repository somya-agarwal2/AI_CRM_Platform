import  { useState, useEffect } from 'react';

type Role = 'Admin' | 'Campaign Manager' | 'Analyst' | 'Viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Pending Invitation';
  isMe: boolean;
}

export default function TeamMembersTab() {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('crm_teamMembers');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Sarah Johnson', email: 'sarah.j@nike.in', role: 'Admin', status: 'Active', isMe: true },
      { id: '2', name: 'Mike Chen', email: 'mike.c@nike.in', role: 'Campaign Manager', status: 'Active', isMe: false },
      { id: '3', name: 'Emma Watson', email: 'emma.w@nike.in', role: 'Analyst', status: 'Active', isMe: false },
    ];
  });

  const [toast, setToast] = useState<{type: string, message: string} | null>(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Viewer' as Role });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    localStorage.setItem('crm_teamMembers', JSON.stringify(members));
  }, [members]);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      showToast('Name and email are required', 'error');
      return;
    }
    setIsInviting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API
    
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'Pending Invitation',
      isMe: false
    };
    
    setMembers([...members, newMember]);
    setIsInviting(false);
    setShowInviteModal(false);
    setInviteForm({ name: '', email: '', role: 'Viewer' });
    showToast('Invitation sent successfully');
  };

  const handleEdit = async () => {
    if (!editingMember) return;
    setIsEditing(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate API

    setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
    setIsEditing(false);
    setShowEditModal(false);
    showToast('Member role updated');
  };

  const handleRemove = async () => {
    if (!removingMember) return;
    setIsRemoving(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate API

    setMembers(members.filter(m => m.id !== removingMember.id));
    setIsRemoving(false);
    setShowRemoveModal(false);
    showToast('Member removed from workspace');
  };

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s', zIndex: 10 }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Team Members</h2>
        <button className="btn btn-primary" onClick={() => setShowInviteModal(true)} style={{ padding: '8px 16px', fontSize: '13px' }}>Invite Member</button>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Name</th>
            <th style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Role</th>
            <th style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Status</th>
            <th style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <td style={{ padding: '16px 0', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                  {user.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user.name}
                    {user.isMe && <span style={{ background: 'rgba(0,194,122,0.1)', color: '#00C27A', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>You</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</span>
                </div>
              </td>
              <td style={{ padding: '16px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{user.role}</td>
              <td style={{ padding: '16px 0', fontSize: '13px' }}>
                {user.status === 'Active' ? (
                  <span style={{ color: '#00C27A', fontWeight: 500 }}>Active</span>
                ) : (
                  <span style={{ color: '#f59e0b', fontWeight: 500 }}>Pending Invitation</span>
                )}
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right' }}>
                <button 
                  onClick={() => { setEditingMember(user); setShowEditModal(true); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginRight: '16px' }}
                >
                  Edit
                </button>
                {!user.isMe && (
                  <button 
                    onClick={() => { setRemovingMember(user); setShowRemoveModal(true); }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Invite Team Member</h3>
            <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Name</label>
              <input type="text" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} placeholder="Jane Doe" />
            </div>
            <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</label>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }} placeholder="jane@example.com" />
            </div>
            <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Role</label>
              <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value as Role})} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}>
                <option value="Admin">Admin</option>
                <option value="Campaign Manager">Campaign Manager</option>
                <option value="Analyst">Analyst</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowInviteModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInvite} disabled={isInviting} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isInviting && <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Edit Team Member</h3>
            <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Name</label>
              <input type="text" value={editingMember.name} disabled style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'not-allowed' }} />
            </div>
            <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</label>
              <input type="email" value={editingMember.email} disabled style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'not-allowed' }} />
            </div>
            <div className="input-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: 'none', padding: 0 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Role</label>
              <select value={editingMember.role} onChange={e => setEditingMember({...editingMember, role: e.target.value as Role})} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}>
                <option value="Admin">Admin</option>
                <option value="Campaign Manager">Campaign Manager</option>
                <option value="Analyst">Analyst</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={isEditing} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing && <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {showRemoveModal && removingMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Remove Team Member?</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'white' }}>{removingMember.name}</strong> will lose access to the workspace. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowRemoveModal(false)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRemove} disabled={isRemoving} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isRemoving && <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
