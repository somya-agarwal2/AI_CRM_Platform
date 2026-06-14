import  { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Download, Upload, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

import API_URL from '../config';

const ImportDataModal = ({ isOpen, onClose, onImportComplete }: any) => {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    try {
      setLoading(true);
      setError('');
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (e) {
        setError('Invalid JSON format');
        setLoading(false);
        return;
      }

      await axios.post(`${API_URL}/ingest`, data);
      onImportComplete();
      onClose();
      setJsonText('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '500px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Import Data</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Paste a JSON object containing a `customers` array.</p>
        
        {error && <div style={{ color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
        
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"customers": [{"email": "...", "orders": []}]}'
          style={{ width: '100%', height: '200px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '16px', borderRadius: '8px', outline: 'none', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleImport} disabled={loading || !jsonText} className="btn btn-primary" style={{ background: 'var(--accent-secondary)', color: 'white', border: 'none' }}>
            {loading ? 'Processing...' : 'Import JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers`);
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ImportDataModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportComplete={fetchCustomers} 
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Customer Profiles</h1>
          <p className="text-muted">Manage your {total.toLocaleString()} shoppers.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
            <Upload size={16} /> Import Data
          </button>
          <button className="btn btn-secondary">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
          <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', flex: 1 }}>
            <Search size={16} className="text-muted" />
            <input type="text" placeholder="Search by name, email, or city..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>Shopper</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>City</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>Total Spent</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>Orders</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>Last Purchase</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>Churn Risk</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</div>
                    <div className="text-muted" style={{ fontSize: '13px' }}>{c.email}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{c.city}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-secondary)' }}>${c.total_spent?.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{c.order_count}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {c.last_purchase_date ? format(new Date(c.last_purchase_date), 'MMM d, yyyy') : 'Unknown'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
                        <div style={{ width: `${(c.churn_score || 0) * 100}%`, height: '100%', background: (c.churn_score || 0) > 0.7 ? '#ef4444' : (c.churn_score || 0) > 0.4 ? '#eab308' : '#22c55e', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <Link to={`/customers/${c.id}`} style={{ textDecoration: 'none' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <Eye size={14} /> Profile
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
