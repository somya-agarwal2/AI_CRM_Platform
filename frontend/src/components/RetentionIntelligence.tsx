import  { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, TrendingDown, DollarSign, Activity,  BarChart2, PieChart, Users, PlayCircle,  Zap, ShieldAlert, ArrowDownRight,  Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import API_URL from '../config';

export default function RetentionIntelligence() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRetentionData();
  }, []);

  const fetchRetentionData = async () => {
    try {
      const res = await axios.get(`${API_URL}/retention-analytics`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, context: string) => {
    try {
      const fallbackName = typeof context === 'string' && context ? context : 'AI Audience';
      
      if (action === 'audience' || action === 'create' || action === 'create-ai') {
        await axios.post(`${API_URL}/segments`, {
          name: fallbackName,
          filters: [{ field: 'auto', operator: 'equals', value: fallbackName }]
        });
        navigate('/audiences');
      } else if (action === 'campaign') {
        const segRes = await axios.post(`${API_URL}/segments`, {
          name: fallbackName,
          filters: [{ field: 'auto', operator: 'equals', value: fallbackName }]
        });
        await axios.post(`${API_URL}/campaigns`, {
          name: `${fallbackName} Campaign`,
          audience_id: segRes.data.id,
          channels: 'WhatsApp',
          expected_revenue: 20000
        });
        navigate('/campaigns');
      } else if (action === 'journey') {
        const segRes = await axios.post(`${API_URL}/segments`, {
          name: fallbackName,
          filters: [{ field: 'auto', operator: 'equals', value: fallbackName }]
        });
        const campRes = await axios.post(`${API_URL}/campaigns`, {
          name: `${fallbackName} Campaign`,
          audience_id: segRes.data.id,
          channels: 'WhatsApp',
          expected_revenue: 20000
        });
        await axios.post(`${API_URL}/journeys`, {
          name: `${fallbackName} Journey`,
          campaign_id: campRes.data.id,
          nodes: [
            { type: 'TRIGGER', config: { event: 'Audience Joins' } },
            { type: 'ACTION', config: { channel: 'WhatsApp' } }
          ]
        });
        navigate('/journeys');
      }
    } catch (e) {
      console.error('Action failed', e);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading data.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={24} color="#ef4444" /> Retention Command Center
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Identify churn risk, build recovery audiences, and launch retention journeys.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
            <Users size={16} /> High Risk Customers
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.kpis.high_risk_customers.toLocaleString()}
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
            <TrendingDown size={16} /> Revenue At Risk
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${data.kpis.revenue_at_risk.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <Activity size={16} /> Predicted Churn Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.kpis.predicted_churn_rate.toFixed(1)}%
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(145deg, rgba(36, 138, 88, 0.05) 0%, rgba(36, 138, 88, 0.05) 100%)', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <DollarSign size={16} /> Recoverable Revenue
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${data.kpis.recoverable_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Hero Section & Recovery Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Massive AI Alert Card */}
        <div className="card" style={{ padding: '32px', background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={28} color="#ef4444" fill="#ef4444" fillOpacity={0.2} /> EngageX Alert
            </h2>
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '14px', padding: '6px 12px' }}>
              Confidence: {data.hero_alert.confidence}%
            </span>
          </div>

          <div style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            <strong style={{ color: '#ef4444' }}>{data.hero_alert.customers_count} customers</strong> are likely to churn in the next 30 days.
          </div>
          
          {data.hero_alert.explanation && (
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.5' }}>
              <strong>AI Analysis:</strong> {data.hero_alert.explanation}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue at Risk</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>${data.hero_alert.revenue_at_risk.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Recommended Recovery</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{data.hero_alert.recommended_recovery}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Channel: {data.hero_alert.suggested_channel}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Recovery</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '4px' }}>${data.hero_alert.expected_recovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-secondary" onClick={() => handleAction('audience', 'High Risk')} style={{ padding: '12px 24px', fontSize: '15px' }}>
              <Users size={18} /> Create Audience
            </button>
            <button className="btn btn-primary" onClick={() => handleAction('campaign', 'Win-back')} style={{ padding: '12px 24px', fontSize: '15px' }}>
              <PlayCircle size={18} /> Generate Campaign
            </button>
            <button className="btn btn-secondary" onClick={() => handleAction('journey', 'Recovery')} style={{ padding: '12px 24px', fontSize: '15px' }}>
              <Activity size={18} /> Launch Journey
            </button>
          </div>
        </div>

        {/* Revenue Recovery Pipeline */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-secondary)" /> Recovery Pipeline
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue At Risk</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>${data.hero_alert.revenue_at_risk.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownRight size={24} color="var(--text-tertiary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(36, 138, 88, 0.05)', border: '1px solid rgba(36, 138, 88, 0.2)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Potential AI Recovery</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${data.hero_alert.expected_recovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownRight size={24} color="var(--text-tertiary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(36, 138, 88, 0.05)', border: '1px solid rgba(36, 138, 88, 0.2)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Post-Campaign</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${(data.hero_alert.expected_recovery * 0.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>

          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        
        {/* Churn Distribution */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--accent-secondary)" /> Risk Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Low Risk</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.distribution.low_risk}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ width: '60%', height: '100%', background: 'var(--accent-secondary)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Medium Risk</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.distribution.medium_risk}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ width: '25%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>High Risk</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>{data.distribution.high_risk}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ width: '15%', height: '100%', background: '#ef4444', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Churn Drivers */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="var(--accent-secondary)" /> Top Churn Drivers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.drivers.map((driver: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{driver.reason}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>{driver.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Trend */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={18} color="#f59e0b" /> Historical Churn Trend
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '12px', marginTop: '16px' }}>
            {data.trend.map((t: any, idx: number) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.rate}%</span>
                <div style={{ width: '100%', height: `${t.rate * 4}px`, background: t.rate > 14 ? '#ef4444' : 'var(--accent-secondary)', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t.month.slice(0,3)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Suggested Recovery Opportunities */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>AI Recovery Opportunities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {data.opportunities.map((opp: any, idx: number) => (
            <div key={idx} className="card" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{opp.title}</h4>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{opp.customers} Customers</div>
                </div>
                <span className="badge" style={{ background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(36, 138, 88, 0.3)' }}>Confidence: {opp.confidence}%</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue At Risk</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>${opp.revenue_at_risk.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Recovery</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '4px' }}>${opp.expected_recovery.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center' }} onClick={() => handleAction('audience', opp.title)}>
                  <Users size={16} /> Create Audience
                </button>
                <button className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center' }} onClick={() => handleAction('campaign', opp.title)}>
                  <PlayCircle size={16} /> Generate Campaign
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center' }} onClick={() => handleAction('journey', opp.title)}>
                  <Activity size={16} /> Launch Journey
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Pre-built Segments */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="var(--accent-secondary)" /> Pre-built Segments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.segments.map((seg: string, idx: number) => (
              <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{seg}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleAction('audience', seg)}>
                    <Users size={14} />
                  </button>
                  <button className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => handleAction('campaign', seg)}>
                    <PlayCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#ef4444" /> Top 20 Highest Risk Customers
            </h3>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Last Purchase</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>LTV</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Risk Score</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>AI Action</th>
                </tr>
              </thead>
              <tbody>
                {data.top_high_risk.map((c: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
                      {c.name}
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {c.last_purchase ? formatDistanceToNow(new Date(c.last_purchase), { addSuffix: true }) : 'Unknown'}
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'white', fontSize: '14px' }}>
                      ${c.ltv?.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>{(c.risk_score * 100).toFixed(0)}%</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent-secondary)', borderColor: 'rgba(36, 138, 88, 0.3)' }} onClick={() => handleAction('campaign', c.name)}>
                        <Zap size={14} /> {c.ai_action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
