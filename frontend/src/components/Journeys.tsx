import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, RefreshCw, Send, Target, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

import API_URL from '../config';

export default function Journeys() {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourneys();
    const interval = setInterval(fetchJourneys, 5000); // Live webhook updates
    return () => clearInterval(interval);
  }, []);

  const fetchJourneys = async () => {
    try {
      const res = await axios.get(`${API_URL}/campaigns/`);
      const drafts = JSON.parse(localStorage.getItem('journey_drafts') || '[]');
      setJourneys([...drafts, ...res.data]);
      setLoading(false);
    } catch (e) {
      console.error(e);
      const drafts = JSON.parse(localStorage.getItem('journey_drafts') || '[]');
      setJourneys(drafts);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading journeys...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ padding: '32px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={28} /> AI Journeys
          </h1>
          <p className="text-muted">Track the live execution of your AI-generated campaigns.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchJourneys}><RefreshCw size={16} /> Refresh</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {journeys.map(j => (
            <div key={j.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: j.status === 'completed' ? '#4ade80' : j.status === 'draft' ? '#f59e0b' : 'var(--accent-primary)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{j.name}</h3>
                  <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={14} /> Goal: {j.goal || 'General Outreach'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${j.status === 'completed' ? 'badge-success' : j.status === 'draft' ? 'badge-warning' : 'badge-primary'}`} style={{ marginBottom: '8px', display: 'inline-block', background: j.status === 'draft' ? 'rgba(245, 158, 11, 0.1)' : undefined, color: j.status === 'draft' ? '#f59e0b' : undefined, border: j.status === 'draft' ? '1px solid rgba(245, 158, 11, 0.2)' : undefined }}>
                    {j.status.toUpperCase()}
                  </span>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Created: {j.created_at ? format(new Date(j.created_at), 'MMM d, yyyy') : 'Recently'}
                  </p>
                </div>
              </div>

              {/* Journey Logic / Flow */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>AI Reasoning</p>
                <p style={{ fontSize: '15px', color: 'var(--accent-primary)', opacity: 0.9 }}>"{j.ai_reasoning || 'Executed based on historical segment performance.'}"</p>
              </div>

              {/* Funnel Stats */}
              {j.status === 'draft' ? (
                <div style={{ background: 'var(--bg-tertiary)', padding: '24px', borderRadius: '12px', border: '1px dashed rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  This journey is in draft mode. Activate it to start collecting metrics.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  {[
                    { label: 'Targeted', val: j.metrics?.sent || 0, color: 'var(--text-primary)' },
                    { label: 'Delivered', val: j.metrics?.delivered || 0, color: 'var(--text-secondary)' },
                    { label: 'Opened', val: j.metrics?.opened || 0, color: '#60a5fa' },
                    { label: 'Clicked', val: j.metrics?.clicked || 0, color: '#c084fc' },
                    { label: 'Converted', val: j.metrics?.converted || 0, color: '#4ade80' }
                  ].map((stat, idx) => (
                    <React.Fragment key={stat.label}>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{stat.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 600, color: stat.color }}>{stat.val}</p>
                      </div>
                      {idx < 4 && <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><ChevronRight size={20} /></div>}
                    </React.Fragment>
                  ))}
                  
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}><ChevronRight size={20} /></div>
                  
                  <div style={{ flex: 1, background: 'rgba(74,222,128,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.3)' }}>
                    <p style={{ fontSize: '13px', color: '#4ade80', marginBottom: '8px' }}>Revenue</p>
                    <p style={{ fontSize: '24px', fontWeight: 600, color: '#4ade80' }}>${(j.metrics?.revenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

            </div>
          ))}
          {journeys.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
              <Send size={48} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
              <h3>No Active Journeys</h3>
              <p>Use the AI Copilot to generate and launch your first journey.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
