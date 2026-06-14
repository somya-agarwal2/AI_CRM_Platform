import  { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Users, Filter, Sparkles, Search, MoreHorizontal, ArrowLeft,    GitBranch, PlusCircle, CheckCircle2 } from 'lucide-react';
import { TEMPLATES } from './JourneyBuilder';

import API_URL from '../config';

export default function SegmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [segment, setSegment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sample, setSample] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Customers');
  const [linkedJourneys, setLinkedJourneys] = useState<any[]>([]);
  const [allJourneys, setAllJourneys] = useState<any[]>([]);
  const [showAttachModal, setShowAttachModal] = useState(false);

  useEffect(() => {
    fetchSegment();
    
    try {
      const activeJourneys = JSON.parse(localStorage.getItem('journey_active') || '[]');
      const templateJourneys = JSON.parse(localStorage.getItem('journey_templates') || '[]');
      
      const builtInTemplates = Object.keys(TEMPLATES).map(key => ({
        id: `builtin_${key.replace(/\s+/g, '_').toLowerCase()}`,
        name: key,
        nodes: TEMPLATES[key]
      }));

      const allTemplates = [...builtInTemplates, ...templateJourneys];
      const combined = [...activeJourneys, ...allTemplates];
      
      setAllJourneys(allTemplates);
      
      const sj = JSON.parse(localStorage.getItem(`crm_segmentJourneys_${id}`) || '[]');
      const linked = combined.filter((j: any) => sj.includes(j.id));
      setLinkedJourneys(linked);
    } catch {}
  }, [id]);

  const attachJourney = (journey: any) => {
    localStorage.setItem(`crm_segmentJourneys_${id}`, JSON.stringify([journey.id]));
    setLinkedJourneys([journey]);
    setShowAttachModal(false);
  };

  const detachJourney = (journeyId: string) => {
    const sj = JSON.parse(localStorage.getItem(`crm_segmentJourneys_${id}`) || '[]');
    const newSj = sj.filter((jId: string) => jId !== journeyId);
    localStorage.setItem(`crm_segmentJourneys_${id}`, JSON.stringify(newSj));
    setLinkedJourneys(linkedJourneys.filter(j => j.id !== journeyId));
  };

  const fetchSegment = async () => {
    try {
      const res = await axios.get(`${API_URL}/segments/${id}`);
      setSegment(res.data);
      setSample(res.data.customers || []);
    } catch (e) {
      console.error("Failed to load segment", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (!segment) return <div style={{ padding: '24px' }}>Segment not found.</div>;

  // Filter sample locally based on tab and search
  let displayCustomers = sample;
  
  if (activeTab === 'High Value') {
      displayCustomers = displayCustomers.filter(c => c.total_spent > 1500);
  } else if (activeTab === 'High Churn Risk') {
      displayCustomers = displayCustomers.filter(c => c.churn_score > 0.6);
  } else if (activeTab === 'VIP') {
      displayCustomers = displayCustomers.filter(c => c.total_spent > 2500);
  } else if (activeTab === 'Recently Active') {
      // Just mock filter
      displayCustomers = displayCustomers.slice(0, Math.ceil(displayCustomers.length / 2));
  }

  if (search.trim()) {
      const s = search.toLowerCase();
      displayCustomers = displayCustomers.filter(c => 
          (c.first_name + ' ' + c.last_name).toLowerCase().includes(s) || 
          (c.email && c.email.toLowerCase().includes(s))
      );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      
      {/* Back Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/audiences')}>
        <ArrowLeft size={16} /> Back to Segments
      </div>

      {/* Hero Card */}
      <div className="card" style={{ padding: '32px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        {/* Background Concentric Circles SVG */}
        <svg style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', opacity: 0.05, pointerEvents: 'none' }} width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="15"/>
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="15"/>
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="15"/>
        </svg>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
                <Users size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{segment.name}</h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>{segment.description || 'No description provided.'}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>AUDIENCE SIZE</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{segment.count?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>CREATED</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(segment.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <Filter size={12} /> Custom Rules Applied
              </div>
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={() => navigate('/campaigns')} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            Generate Campaign <Sparkles size={14} />
          </button>
        </div>
      </div>


      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Segment Audience</h2>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        
        {/* Tabs & Search */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['All Customers', 'High Value', 'High Churn Risk', 'VIP', 'Recently Active'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  background: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeTab === tab ? 'var(--border-subtle)' : 'transparent',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 16px', maxWidth: '300px' }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)', marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }} 
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-primary)' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LTV / Total Spend</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Churn Risk</th>
                <th style={{ padding: '16px 24px', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {displayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {search ? 'No matching customers found.' : 'No customers found in this segment.'}
                  </td>
                </tr>
              ) : (
                displayCustomers.map((row, i) => {
                  const churnScore = row.churn_score || 0;
                  const churnPercent = Math.round(churnScore * 100);
                  
                  let riskColor = 'var(--accent-secondary)'; // Green
                  let riskBg = 'rgba(36, 138, 88, 0.1)';
                  let riskLabel = 'Low Risk';
                  
                  if (churnScore > 0.7) {
                    riskColor = '#ef4444'; // Red
                    riskBg = 'rgba(239, 68, 68, 0.1)';
                    riskLabel = 'High Risk';
                  } else if (churnScore > 0.4) {
                    riskColor = '#f59e0b'; // Orange
                    riskBg = 'rgba(245, 158, 11, 0.1)';
                    riskLabel = 'Medium Risk';
                  }

                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }} className="table-row-hover">
                      <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>
                        {row.first_name} {row.last_name}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {row.email || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {row.city || 'Unknown'}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>
                        ${row.total_spent?.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: riskBg, color: riskColor, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, width: 'fit-content' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: riskColor }}></div>
                          {riskLabel} ({churnPercent})
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                        <MoreHorizontal size={16} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attach Journey Modal */}
      {showAttachModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 480, background: 'var(--bg-primary)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Choose Journey</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Select a journey to attach to this segment.</div>
              </div>
              <button onClick={() => setShowAttachModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
              {allJourneys.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No journeys available.</div>
              )}
              {allJourneys.map((j: any) => {
                const isLinked = linkedJourneys.some(l => l.id === j.id);
                return (
                  <div 
                    key={j.id || j.name}
                    onClick={() => {
                      if (!isLinked) attachJourney(j);
                    }}
                    style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: isLinked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: isLinked ? 'rgba(255,255,255,0.02)' : 'transparent', opacity: isLinked ? 0.6 : 1 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GitBranch size={20} color="var(--accent-primary)" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{j.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{j.nodes?.length || 0} steps</div>
                    </div>
                    {isLinked && <CheckCircle2 size={20} color="var(--accent-secondary)" />}
                  </div>
                );
              })}
              
              <button onClick={() => navigate('/journeys/build', { state: { segmentId: id } })} style={{ marginTop: 12, padding: 16, borderRadius: 10, border: '1px dashed var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: 'transparent' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={20} color="var(--text-secondary)" /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>Create New Journey</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Build from scratch</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
