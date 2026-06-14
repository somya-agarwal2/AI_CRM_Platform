import  { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, DollarSign, Activity, PieChart, Users, PlayCircle,  Zap, ArrowDownRight, Award, Crown,  Target, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function ValueIntelligence() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchValueData();
  }, []);

  const fetchValueData = async () => {
    try {
      const res = await axios.get(`${API_URL}/value-analytics`);
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
            <Award size={24} color="var(--accent-secondary)" /> Customer Value Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Identify high-value customers, build growth audiences, and launch revenue-driving journeys.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <DollarSign size={16} /> Total Customer Value
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${data.kpis.total_customer_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <Activity size={16} /> Average LTV
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${data.kpis.avg_ltv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <Crown size={16} /> High Value Customers
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.kpis.high_value_customers.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(145deg, rgba(36, 138, 88, 0.05) 0%, rgba(36, 138, 88, 0.05) 100%)', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <PieChart size={16} /> VIP Revenue Contribution
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.kpis.vip_revenue_contribution.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Hero Section & Growth Pipeline */}
      {data.hero_alert && Object.keys(data.hero_alert).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Massive AI Growth Card */}
          <div className="card" style={{ padding: '32px', background: 'linear-gradient(145deg, rgba(36, 138, 88, 0.08) 0%, rgba(0, 0, 0, 0) 100%)', border: '1px solid rgba(36, 138, 88, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Zap size={28} color="var(--accent-secondary)" fill="var(--accent-secondary)" fillOpacity={0.2} /> EngageX Growth Opportunity
              </h2>
              <span className="badge" style={{ background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(36, 138, 88, 0.3)', fontSize: '14px', padding: '6px 12px' }}>
                Confidence: {data.hero_alert.confidence}%
              </span>
            </div>

            <div style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>
              <strong style={{ color: 'var(--accent-secondary)' }}>{data.hero_alert.vip_count} VIP customers</strong> generate {data.hero_alert.vip_contribution?.toFixed(0) || 0}% of total revenue.
            </div>
            
            {data.hero_alert.explanation && (
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.5' }}>
                <strong>AI Analysis:</strong> {data.hero_alert.explanation}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Potential Upsell Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '4px' }}>${data.hero_alert.potential_upsell?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Recommended Campaign</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{data.hero_alert.recommended_campaign}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Campaign Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '4px' }}>${data.hero_alert.expected_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-secondary" onClick={() => handleAction('audience', 'VIPs')} style={{ padding: '12px 24px', fontSize: '15px', color: 'var(--accent-secondary)', borderColor: 'rgba(36, 138, 88, 0.3)' }}>
                <Users size={18} /> Create Audience
              </button>
              <button className="btn btn-primary" onClick={() => handleAction('campaign', 'Upsell')} style={{ padding: '12px 24px', fontSize: '15px' }}>
                <PlayCircle size={18} /> Generate Campaign
              </button>
              <button className="btn btn-secondary" onClick={() => handleAction('journey', 'Growth')} style={{ padding: '12px 24px', fontSize: '15px' }}>
                <Activity size={18} /> Launch Journey
              </button>
            </div>
          </div>

          {/* Revenue Growth Pipeline */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--accent-secondary)" /> Growth Pipeline
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Current VIP Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>${(data.hero_alert.vip_count * data.kpis.avg_ltv * 1.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowDownRight size={24} color="var(--text-tertiary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(36, 138, 88, 0.05)', border: '1px solid rgba(36, 138, 88, 0.2)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>AI Upsell Opportunity</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${data.hero_alert.potential_upsell?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowDownRight size={24} color="var(--text-tertiary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(36, 138, 88, 0.05)', border: '1px solid rgba(36, 138, 88, 0.2)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Campaign Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${data.hero_alert.expected_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>

            </div>
          </div>

        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Value Distribution */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--accent-secondary)" /> LTV Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>High Value</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{data.distribution.high_value}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ width: '15%', height: '100%', background: 'var(--accent-secondary)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Medium Value</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.distribution.medium_value}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ width: '35%', height: '100%', background: 'var(--accent-secondary)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Low Value</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.distribution.low_value}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ width: '50%', height: '100%', background: 'var(--text-tertiary)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Segments */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Customer Value Segments</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {data.segments?.map((seg: any, idx: number) => (
              <div key={idx} className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '16px', margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {seg.name === 'VIP Customers' ? <Crown size={16} color="#f59e0b" /> : <Target size={16} color="var(--accent-secondary)" />} {seg.name}
                </h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{seg.count} Customers</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Revenue: ${seg.revenue.toLocaleString()}</div>
                </div>

                <div style={{ background: 'rgba(36, 138, 88, 0.05)', border: '1px solid rgba(36, 138, 88, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Potential Upsell</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${seg.upsell.toLocaleString()}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }} onClick={() => handleAction('audience', seg.name)}>
                    <Users size={14} /> Create Audience
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }} onClick={() => handleAction('campaign', seg.name)}>
                    <PlayCircle size={14} /> Generate Campaign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Growth Opportunities */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', marginTop: '16px' }}>Future Growth Opportunities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {data.growth_opportunities?.map((opp: any, idx: number) => (
            <div key={idx} className="card" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{opp.title}</h4>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{opp.subtitle}</div>
                </div>
                <span className="badge" style={{ background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(36, 138, 88, 0.3)' }}>{opp.confidence}% Match</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Recommended</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '12px' }}>{opp.recommended}</div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Revenue</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '4px' }}>${opp.expected_revenue.toLocaleString()}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }} onClick={() => handleAction('audience', opp.title)}>
                    <Users size={14} /> Create Audience
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }} onClick={() => handleAction('campaign', opp.title)}>
                    <PlayCircle size={14} /> Generate Campaign
                  </button>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', padding: '8px', fontSize: '12px', justifyContent: 'center' }} onClick={() => handleAction('journey', opp.title)}>
                  <Activity size={14} /> Launch Journey
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Revenue Customers Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '16px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} color="#f59e0b" /> Top 20 Revenue Customers
          </h3>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>LTV</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Orders</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Last Purchase</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Predicted Future Value</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>AI Action</th>
              </tr>
            </thead>
            <tbody>
              {data.top_customers?.map((c: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
                    {c.name}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'white', fontSize: '14px' }}>
                    ${c.ltv?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {c.orders}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {c.last_purchase ? formatDistanceToNow(new Date(c.last_purchase), { addSuffix: true }) : 'Unknown'}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-secondary)', fontSize: '14px' }}>
                    ${c.future_value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
  );
}
