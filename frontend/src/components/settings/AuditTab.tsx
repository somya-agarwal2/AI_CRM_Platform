import  { useState } from 'react';
import { Search } from 'lucide-react';

const mockLogs = [
  { id: 1, user: 'Sarah Johnson', action: 'created campaign', target: 'Summer Sale Blast', time: '10 mins ago', category: 'Campaigns' },
  { id: 2, user: 'Mike Chen', action: 'activated journey', target: 'VIP Winback', time: '1 hour ago', category: 'Journeys' },
  { id: 3, user: 'Emma Watson', action: 'exported customers', target: 'Churn Risk Segment', time: '3 hours ago', category: 'Data' },
  { id: 4, user: 'System', action: 'completed sync', target: 'Shopify Store', time: '5 hours ago', category: 'System' },
  { id: 5, user: 'Sarah Johnson', action: 'updated settings', target: 'Brand Colors', time: 'Yesterday', category: 'Settings' },
  { id: 6, user: 'Mike Chen', action: 'deleted template', target: 'Old Welcome Email', time: 'Yesterday', category: 'Templates' },
  { id: 7, user: 'System', action: 'failed sync', target: 'Salesforce API', time: '2 days ago', category: 'System' },
  { id: 8, user: 'Emma Watson', action: 'invited user', target: 'David Lee', time: '3 days ago', category: 'Team' },
];

export default function AuditTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('All');

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTime = timeFilter === 'All' 
      ? true 
      : timeFilter === 'Today' 
        ? log.time.includes('ago') 
        : timeFilter === 'This Week' 
          ? true 
          : true;

    return matchesSearch && matchesTime;
  });

  return (
    <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Audit Logs</h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', width: '240px' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} 
            />
          </div>
          
          <select 
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}
            style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, idx) => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: idx < filteredLogs.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: log.user === 'System' ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: log.user === 'System' ? '#ef4444' : 'var(--text-secondary)' }}>
                  {log.user === 'System' ? 'SYS' : log.user.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{log.user}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 6px' }}>{log.action}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{log.target}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{log.category}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{log.time}</div>
            </div>
          ))
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No audit logs match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
