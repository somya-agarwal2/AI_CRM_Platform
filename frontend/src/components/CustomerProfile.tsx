import  { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Zap, Sparkles, TrendingUp, DollarSign, Activity,
  ShoppingBag, Target, MessageCircle, Clock, CheckCircle2, AlertCircle, PlayCircle, GitBranch
} from 'lucide-react';
import { format } from 'date-fns';

const API_URL = 'http://localhost:5000/api';

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchCustomer = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_URL}/customers/${id}`);
      setCustomer(res.data.customer);
      setRecentOrders(res.data.recent_orders);
      
      if (!silent) {
        axios.get(`${API_URL}/ai/customer/${id}`)
          .then(aiRes => setAiInsight(aiRes.data))
          .catch(err => console.error("AI Insight Error:", err));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer(false);
    // Poll silently for live updates to reflect real-time delivery simulation
    const interval = setInterval(() => fetchCustomer(true), 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (actionFn: () => Promise<void>) => {
    try {
      await actionFn();
    } catch (e) {
      setActionStatus({ message: 'Action failed. Please try again.', type: 'error' });
      setTimeout(() => setActionStatus(null), 3000);
    }
  };

  const executeAIAction = async () => {
    // Determine the channel based on the AI's recommendation, default to Email
    const channel = aiInsight?.next_best_action?.channel || 'Email';
    await axios.post(`${API_URL}/channel/send`, {
      customer_id: customer.id,
      channel: channel
    });
    setActionStatus({ message: `Action executed successfully via ${channel}!`, type: 'success' });
    setTimeout(() => setActionStatus(null), 3000);
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading AI Intelligence...</div>;
  if (!customer) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Customer not found.</div>;

  const churnScore = aiInsight?.churn_analysis?.score || customer.churn_score || 0;
  const churnRiskColor = churnScore > 0.7 ? '#ef4444' : churnScore > 0.4 ? '#f59e0b' : 'var(--accent-secondary)';

  // Get real counts from delivery events via campaign_engagement
  const engagement = customer.campaign_engagement || [];
  const sent = engagement.filter((c: any) => c.sent).length;
  const opened = engagement.filter((c: any) => c.opened).length;
  const clicked = engagement.filter((c: any) => c.clicked).length;
  const converted = engagement.filter((c: any) => c.converted).length;
  const totalRevenue = engagement.reduce((acc: number, c: any) => acc + (c.revenue || 0), 0);

  // Filter timeline for meaningful events
  const meaningfulEvents = customer.timeline?.filter((e: any) => e.type === 'purchase' || e.type === 'engagement') || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* SECTION 1: Customer Hero Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/customer-intelligence" style={{ color: 'var(--text-secondary)' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }}>
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
            {customer.first_name[0]}{customer.last_name[0]}
          </div>
          <div>
            <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 700 }}>
              {customer.first_name} {customer.last_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: churnScore < 0.4 ? 'var(--accent-secondary)' : (churnScore > 0.7 ? '#ef4444' : '#f59e0b') }}></div>
                {churnScore < 0.4 ? 'Healthy' : (churnScore > 0.7 ? 'At Risk' : 'Needs Attention')}
              </span>
              <span>•</span>
              <span>Customer since {format(new Date(customer.created_at || new Date()), 'MMM yyyy')}</span>
              <span>•</span>
              <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                {customer.segment || 'General Audience'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Spend</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>${(customer.total_spent || 0).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Last Purchase</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {customer.last_purchase_date ? format(new Date(customer.last_purchase_date), 'MMM d, yyyy') : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {actionStatus && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: actionStatus.type === 'success' ? 'rgba(36, 138, 88, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: actionStatus.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${actionStatus.type === 'success' ? 'rgba(36, 138, 88, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
          {actionStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {actionStatus.message}
        </div>
      )}

      {/* SECTION 2: AI Customer Intelligence */}
      {aiInsight ? (
        <div className="card" style={{ padding: '32px', background: 'linear-gradient(145deg, rgba(36, 138, 88, 0.08) 0%, rgba(36, 138, 88, 0.05) 100%)', border: '1px solid rgba(36, 138, 88, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={28} color="var(--accent-secondary)" /> Executive AI Summary
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <p style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '24px', fontWeight: 500 }}>
                {aiInsight.summary || "Pending strategic summary..."}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Churn Risk Level</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: aiInsight.churn_analysis?.risk_level === 'High' ? '#ef4444' : 'var(--accent-secondary)' }}>
                    {aiInsight.churn_analysis?.risk_level || 'Unknown'} ({(aiInsight.churn_analysis?.score * 100).toFixed(0)}%)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Business Impact</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{aiInsight.revenue_opportunity?.recoverable_revenue || '$0'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>AI Confidence</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{aiInsight.confidence_score || 0}%</div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>AI Reasoning</div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {aiInsight.reasoning}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Sparkles size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
          <div>Analyzing customer profile...</div>
        </div>
      )}

      {/* SECTION 3: Customer Snapshot Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={14} color="var(--accent-secondary)" /> Total Revenue
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '12px' }}>${(customer.total_spent || 0).toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={14} color="var(--accent-secondary)" /> Orders
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px' }}>{customer.order_count || 0}</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} color="#f59e0b" /> Avg Order Value
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px' }}>
            ${customer.order_count > 0 ? (customer.total_spent / customer.order_count).toFixed(2) : '0.00'}
          </div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={14} color="var(--accent-secondary)" /> Predicted LTV
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px' }}>${((customer.total_spent || 0) * 1.5).toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* SECTION 4: Purchase Intelligence */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--accent-secondary)" /> Purchase Intelligence
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Category Affinity</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {aiInsight?.purchase_intelligence?.category_affinity?.map((cat: string, i: number) => (
                  <span key={i} style={{ padding: '4px 12px', background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                    {cat}
                  </span>
                )) || <span style={{ color: 'var(--text-tertiary)' }}>No data available</span>}
              </div>
            </div>
            
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Predicted Next Purchase</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {aiInsight?.purchase_intelligence?.predicted_next_purchase || 'Unknown'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>AI Product Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiInsight?.purchase_intelligence?.product_recommendations?.map((product: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{product}</span>
                  </div>
                )) || <span style={{ color: 'var(--text-tertiary)' }}>No recommendations available</span>}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: Revenue Opportunity */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#f59e0b" /> Revenue Opportunity
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '12px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Recoverable Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                  {aiInsight?.revenue_opportunity?.recoverable_revenue || '$0'}
                </div>
              </div>
              <div style={{ padding: '20px', background: 'rgba(36, 138, 88, 0.05)', borderRadius: '12px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Expected ROI</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {aiInsight?.revenue_opportunity?.expected_roi || '0x'}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>Recommended Strategy</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {aiInsight?.revenue_opportunity?.recommended_campaign || 'N/A'}
                </div>
                <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  via {aiInsight?.revenue_opportunity?.recommended_channel || 'Email'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* SECTION 5: Engagement Journey */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--accent-secondary)" /> Key Engagement Journey
          </h3>
          
          {meaningfulEvents.length > 0 ? (
            <div style={{ position: 'relative', paddingLeft: '16px', marginTop: '16px' }}>
              <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
              
              {meaningfulEvents.map((event: any, idx: number) => (
                <div key={idx} style={{ position: 'relative', marginBottom: idx === meaningfulEvents.length - 1 ? 0 : '24px' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-16px', 
                    top: '4px', 
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    background: event.type === 'purchase' ? 'var(--accent-secondary)' : 'var(--accent-secondary)',
                    border: '3px solid var(--bg-secondary)',
                    zIndex: 2
                  }}></div>
                  <div style={{ marginLeft: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>
                      {event.date ? format(new Date(event.date), 'MMM d, yyyy - h:mm a') : 'Unknown'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: event.type === 'purchase' ? 600 : 400 }}>{event.action}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              No meaningful engagement events found.
            </div>
          )}
        </div>

        {/* SECTION 7: Campaign Performance Summary */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-secondary)" /> Campaign Performance Summary
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{sent}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Campaigns Sent</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{opened}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Opened</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{clicked}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Clicked</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(36, 138, 88, 0.05)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{converted}</div>
              <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>Purchased</div>
            </div>
          </div>
          
          <div style={{ padding: '16px', background: 'rgba(36, 138, 88, 0.05)', borderRadius: '8px', border: '1px solid rgba(36, 138, 88, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--accent-secondary)', fontWeight: 600 }}>Revenue Recovered</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{totalRevenue.toLocaleString()}</div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Best Performing Channel</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
              <MessageCircle size={16} color="var(--accent-secondary)" /> WhatsApp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
