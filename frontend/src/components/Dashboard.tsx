import  { useState, useEffect } from 'react';
import { 
  Users, Target, Megaphone, GitBranch, DollarSign, 
  ShoppingBag, ArrowRight, Sparkles, Plus, TrendingUp, Zap, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const chartData = [
  { month: 'Jan', revenue: 150000, orders: 450 },
  { month: 'Feb', revenue: 180000, orders: 520 },
  { month: 'Mar', revenue: 160000, orders: 480 },
  { month: 'Apr', revenue: 210000, orders: 610 },
  { month: 'May', revenue: 240000, orders: 750 },
  { month: 'Jun', revenue: 280000, orders: 890 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceInsights, setWorkspaceInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ai/dashboard-insights');
        const data = await response.json();
        setAiData(data);
      } catch (err) {
        console.error("Failed to load AI dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchWorkspaceInsights = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ai/workspace-insights');
        const data = await response.json();
        setWorkspaceInsights(data);
      } catch (err) {
        console.error("Failed to load workspace insights:", err);
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchDashboard();
    fetchWorkspaceInsights();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            Good Morning, Sarah <span style={{ fontSize: '24px' }}>👋</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '6px 0 0 0', fontWeight: 500 }}>
            AI is monitoring customer behavior and surfacing the highest-impact actions for today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-subtle)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          <Activity size={16} color="#00C27A" /> Mission Control
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: EXECUTIVE OVERVIEW (KPIs) */}
      {/* ========================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <Users size={16} /> Customers
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>12,540</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-secondary)' }}>+14%</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <DollarSign size={16} /> Revenue
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>₹12.1L</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-secondary)' }}>+22%</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <Megaphone size={16} /> Campaigns
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>13</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Active</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <GitBranch size={16} /> Journeys
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>8</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Running</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
            <ShoppingBag size={16} /> Orders
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>2,000</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontSize: '13px', fontWeight: 600 }}>
            <Target size={16} /> Segments
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>48</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
        
        {/* ========================================================= */}
        {/* SECTION 3: REVENUE TRENDS GRAPH */}
        {/* ========================================================= */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-secondary)" /> Revenue & Orders Trend
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-secondary)' }} activeDot={{ r: 6 }} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="var(--accent-secondary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent-secondary)' }} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ========================================================= */}
          {/* SECTION 4: QUICK ACTIONS */}
          {/* ========================================================= */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', margin: '0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/audiences/create')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
                <Plus size={14} /> Segment
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/campaigns')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
                <Plus size={14} /> Campaign
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/journeys/build')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
                <Plus size={14} /> Journey
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/customer-intelligence')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
                <Users size={14} /> Customers
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/purchase-history')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
                <ShoppingBag size={14} /> Orders
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: AI MISSION CENTER */}
          {/* ========================================================= */}
          <div className="card" style={{ 
            padding: '24px', 
            background: 'linear-gradient(145deg, rgba(0, 194, 122, 0.1) 0%, rgba(0, 194, 122, 0.02) 100%)', 
            border: '1px solid rgba(0, 194, 122, 0.3)', 
            display: 'flex', flexDirection: 'column', flex: 1, minHeight: '220px'
          }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#00C27A', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Zap size={16} /> AI Mission Center
            </h3>
            
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C27A' }}>
                <Loader2 className="spinner" size={24} />
              </div>
            ) : aiData ? (
              <>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>
                  {aiData.risk?.count || 0} customers at risk
                </div>

                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Potential Recovery</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#00C27A' }}>
                      ₹{Math.round(aiData.risk?.revenue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Confidence</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{aiData.confidence || 0}%</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Recommended Action:</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    {aiData.opportunities?.[0]?.title}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/journeys/build')} style={{ background: '#00C27A', color: '#031B34', flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: 'none' }}>
                      Launch Journey
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}>
                      View Segment
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>Failed to load insights.</div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* SECTION 5: AI INSIGHTS FEED */}
      {/* ========================================================= */}
      <div className="card" style={{ padding: '24px', background: 'linear-gradient(90deg, rgba(0, 194, 122, 0.08) 0%, rgba(0, 194, 122, 0.02) 100%)', border: '1px solid rgba(0, 194, 122, 0.2)', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', color: '#00C27A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} /> EngageX Insights Feed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insightsLoading ? (
            <div style={{ display: 'flex', gap: '8px', color: '#00C27A' }}>
              <Loader2 className="spinner" size={16} /> <span>Analyzing latest CRM data...</span>
            </div>
          ) : workspaceInsights && workspaceInsights.length > 0 ? (
            workspaceInsights.slice(0, 3).map((insight: any, idx: number) => (
              <div 
                key={idx} 
                onClick={() => navigate('/audiences/ai-build', { state: { intent: insight.action } })}
                style={{ 
                  padding: '16px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#00C27A';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 194, 122, 0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>
                    {insight.title}
                  </div>
                  <div style={{ color: '#00C27A', fontSize: '12px', fontWeight: 600, background: 'rgba(0, 194, 122, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    {insight.confidence}% Confidence
                  </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {insight.insight}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00C27A', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                  {insight.action} <ArrowRight size={14} />
                </div>
              </div>
            ))
          ) : (
             <div style={{ color: 'var(--text-secondary)' }}>No AI insights available yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
