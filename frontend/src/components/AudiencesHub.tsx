import  { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Target,  Zap,  PlusCircle, Search, Filter,   Edit2, Copy, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import API_URL from '../config';

export default function AudiencesHub() {
  const [audiencesData, setAudiencesData] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [aiOpportunities, setAiOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [creatingSegmentId, setCreatingSegmentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
    
    // Poll for AI opportunities if there's less than 3 to simulate realtime background generation
    const interval = setInterval(async () => {
      try {
        const oppsRes = await axios.get(`${API_URL}/ai/audience-opportunities`);
        if (Array.isArray(oppsRes.data)) {
          setAiOpportunities(oppsRes.data);
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [audRes, segRes] = await Promise.all([
        axios.get(`${API_URL}/audiences`),
        axios.get(`${API_URL}/segments`)
      ]);
      setAudiencesData(audRes.data);
      setSegments(segRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    
    try {
      setAiLoading(true);
      const oppsRes = await axios.get(`${API_URL}/ai/audience-opportunities`);
      if (Array.isArray(oppsRes.data)) {
        setAiOpportunities(oppsRes.data);
      } else {
        setAiOpportunities([]);
      }
    } catch (e) {
      console.error("Failed to load AI opportunities:", e);
      setAiOpportunities([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      if (action === 'view') {
        navigate(`/segments/${id}`);
      } else if (action === 'edit') {
        navigate(`/audiences/create?edit=${id}`);
      } else if (action === 'duplicate') {
        await axios.post(`${API_URL}/segments/${id}/duplicate`);
        fetchData(); // Refresh list
      } else if (action === 'archive') {
        if(window.confirm('Are you sure you want to archive this segment?')) {
          await axios.post(`${API_URL}/segments/${id}/archive`);
          fetchData(); // Refresh list
        }
      }
    } catch (e) {
      console.error(`Action ${action} failed`, e);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!audiencesData) return <div>Error loading data.</div>;

  const createSegmentFromOpp = async (opp: any) => {
    setCreatingSegmentId(opp.id);
    try {
      const res = await axios.post(`${API_URL}/ai/audience-opportunities/${opp.id}/convert`);
      showToast('success', `Segment "${opp.segment_name}" created successfully!`);
      setSelectedInsight(null);
      fetchData();
      // Navigate to segments list after a short delay
      setTimeout(() => navigate('/audiences'), 1500);
    } catch (e: any) {
      console.error("Failed to convert opportunity", e);
      showToast('error', e?.response?.data?.error || 'Failed to create segment. Please try again.');
    } finally {
      setCreatingSegmentId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={24} color="var(--accent-secondary)" /> All Segments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage, analyze, and organize your customer segments.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/audiences/create')} style={{ padding: '8px 24px', fontSize: '14px' }}>
          <PlusCircle size={16} /> Create Segment
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Segments
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{segments.length}</div>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Reach
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{audiencesData.kpis.total_reach.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Campaigns
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{audiencesData.kpis.active_campaign_audiences}</div>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Revenue Influenced
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${audiencesData.kpis.revenue_influenced.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            AI Opportunities
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{aiOpportunities.length}</div>
        </div>
      </div>

      {/* AI Opportunities Engine */}
      <div className="card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(36, 138, 88, 0.08) 0%, rgba(36, 138, 88, 0.01) 100%)', border: '1px solid rgba(36, 138, 88, 0.3)', boxShadow: '0 10px 40px rgba(36, 138, 88, 0.05) inset' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="var(--accent-secondary)" />
          </div>
          AI Opportunities Engine
        </h2>
        
        {aiLoading ? (
          <div style={{ padding: '48px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(36, 138, 88, 0.2)', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 16px auto', width: '48px', height: '48px', border: '3px solid rgba(36, 138, 88, 0.3)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary)' }}>AI is scanning your CRM data...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 auto', maxWidth: '400px', lineHeight: '1.5' }}>
              Finding novel segment opportunities based on purchase behaviors and customer trends.
            </p>
          </div>
        ) : aiOpportunities.length === 0 ? (
          <div style={{ padding: '48px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary)' }}>AI Opportunities unavailable</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 auto 24px auto', maxWidth: '400px', lineHeight: '1.5' }}>
              Unable to generate new AI opportunities at this time. Please check your AI connection or try again later.
            </p>
          </div>
        ) : null}

        {/* New Opportunities */}
        {!aiLoading && aiOpportunities.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              Pending Opportunities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiOpportunities.map((opp, idx) => (
                <div key={idx} className="ai-card-hover" style={{ 
                  background: 'var(--bg-secondary)', borderRadius: '12px', border: `1px solid rgba(255,255,255,0.05)`, 
                  borderLeft: `4px solid var(--accent-secondary)`,
                  display: 'flex', alignItems: 'center', padding: '20px 24px', gap: '24px',
                  transition: 'all 0.3s ease', cursor: 'default', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px' }}>✨</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{opp.segment_name}</span>
                      <span style={{ padding: '4px 8px', background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                        AI Generated
                      </span>
                    </div>
                    <div 
                      title={opp.reasoning}
                      style={{ 
                        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        paddingRight: '16px'
                      }}>
                      {opp.reasoning}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingLeft: '24px', borderLeft: '1px solid var(--border-subtle)', minWidth: '350px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Target Customers</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{opp.estimated_customers}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Avg LTV</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>${Math.round((opp.estimated_revenue || 0) / (opp.estimated_customers || 1)).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Expected Revenue</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${(opp.estimated_revenue || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Predicted Conv.</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{Math.round(opp.confidence_score / 4)}%</div>
                    </div>
                  </div>


                  <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid var(--border-subtle)' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setSelectedInsight(opp)}
                      style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
                    >
                      View Insight
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => createSegmentFromOpp(opp)}
                      disabled={creatingSegmentId === opp.id}
                      style={{ padding: '8px 16px', fontSize: '13px', background: creatingSegmentId === opp.id ? 'rgba(36,138,88,0.5)' : 'var(--accent-secondary)', color: 'white', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {creatingSegmentId === opp.id ? (
                        <><div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating...</>
                      ) : 'Create Segment'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Strategic Segments Removed */}
      </div>

      {/* Enterprise Data Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-secondary)" /> All Segments Data
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 12px' }}>
              <Search size={14} style={{ color: 'var(--text-tertiary)', marginRight: '8px' }} />
              <input type="text" placeholder="Search segments..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '200px', fontSize: '13px', color: 'var(--text-primary)' }} />
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '24px' }}>
          {segments.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No segments created yet.
            </div>
          ) : (
            segments.map((row: any, idx: number) => {
              const isAI = row.is_ai === true;
              const source = isAI ? 'AI' : 'Manual';
              
              return (
                <div key={idx} className="card card-hover" onClick={() => handleAction('view', row.id)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'pointer', borderTop: isAI ? '3px solid var(--accent-secondary)' : '3px solid var(--accent-secondary)', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Decorative background element */}
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.03, pointerEvents: 'none' }}>
                    <Users size={120} />
                  </div>

                  {/* Top: Icon & Name */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isAI ? 'rgba(36, 138, 88, 0.1)' : 'rgba(36, 138, 88, 0.1)', color: isAI ? 'var(--accent-secondary)' : 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isAI ? <Zap size={20} /> : <Users size={20} />}
                    </div>
                    <div style={{ flex: 1, zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</h4>
                        <span style={{ padding: '4px 10px', background: row.status === 'archived' ? 'var(--bg-tertiary)' : 'rgba(36, 138, 88, 0.1)', color: row.status === 'archived' ? 'var(--text-secondary)' : 'var(--accent-secondary)', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
                          {row.status || 'Active'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                        {row.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>AUDIENCE SIZE</span>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.count?.toLocaleString()}</span>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--border-subtle)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>LAST UPDATED</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Actions & Source */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', zIndex: 1 }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                       {source === 'AI' ? <Zap size={14} color="var(--accent-secondary)" /> : <Target size={14} color="var(--accent-secondary)" />}
                       {source} Generated
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary hover-bg-subtle" onClick={() => handleAction('edit', row.id)} title="Edit Segment" style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-secondary hover-bg-subtle" onClick={() => handleAction('duplicate', row.id)} title="Duplicate Segment" style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <Copy size={16} />
                      </button>
                      <button className="btn btn-secondary hover-bg-red" onClick={() => handleAction('archive', row.id)} title="Archive Segment" style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Insight Drawer Modal */}
      {selectedInsight && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedInsight(null)} />
          <div style={{ 
            position: 'relative', width: '480px', maxHeight: '90vh', background: 'var(--bg-secondary)', 
            borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' 
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: `linear-gradient(135deg, rgba(36, 138, 88, 0.1), transparent)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>✨</div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Why AI Found This Segment</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedInsight.segment_name}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Segment Size</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedInsight.estimated_customers} <span style={{fontSize:'13px', fontWeight: 500, color:'var(--text-tertiary)'}}>customers</span></div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Est. Revenue</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${(selectedInsight.estimated_revenue || 0).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(36, 138, 88, 0.05)', borderRadius: '12px', border: `1px solid rgba(36, 138, 88, 0.2)` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>AI Reasoning</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {selectedInsight.reasoning}
                </div>
              </div>

              <div style={{ flexShrink: 0, padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid var(--border-subtle)` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', position: 'sticky', top: 0, background: 'var(--bg-secondary)', paddingBottom: '8px' }}>Customers Included</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedInsight.customers && selectedInsight.customers.length > 0 ? (
                    selectedInsight.customers.slice(0, 8).map((c: any) => (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', alignItems: 'center', fontSize: '12px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>${c.total_spent?.toLocaleString()}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.last_purchase_date ? new Date(c.last_purchase_date).toLocaleDateString() : 'N/A'}</span>
                        <span style={{ 
                          color: c.churn_score > 70 ? '#ef4444' : c.churn_score > 40 ? '#f59e0b' : 'var(--accent-secondary)',
                          fontWeight: 600,
                          textAlign: 'right'
                        }}>
                          {c.churn_score > 70 ? 'High' : c.churn_score > 40 ? 'Med' : 'Low'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '12px' }}>No customer data available.</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedInsight(null)}
                  style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary" 
                  disabled={creatingSegmentId === selectedInsight?.id}
                  onClick={() => {
                    createSegmentFromOpp(selectedInsight);
                  }}
                  style={{ flex: 1, padding: '12px', justifyContent: 'center', background: creatingSegmentId === selectedInsight?.id ? 'rgba(36,138,88,0.5)' : 'var(--accent-secondary)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {creatingSegmentId === selectedInsight?.id ? (
                    <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating...</>
                  ) : 'Create Segment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

    {/* Toast Notification */}
    {toast && (
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '10px',
        background: toast.type === 'success' ? 'rgba(36, 138, 88, 0.95)' : 'rgba(239, 68, 68, 0.95)',
        color: 'white', padding: '14px 20px', borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)', fontSize: '14px', fontWeight: 600,
        animation: 'fadeIn 0.3s ease-out',
        backdropFilter: 'blur(8px)'
      }}>
        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        {toast.message}
      </div>
    )}
  );
}
