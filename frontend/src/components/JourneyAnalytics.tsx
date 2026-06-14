import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Activity, DollarSign, Users, Target, Zap, TrendingUp, 
  ChevronRight, MessageSquare, Mail, Smartphone, Award, ArrowUpRight 
} from 'lucide-react';

import API_URL from '../config';

const JourneyAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [journeyRes, analyticsRes] = await Promise.all([
          axios.get(`${API_URL}/journeys/${id}`),
          axios.get(`${API_URL}/journeys/${id}/analytics`)
        ]);
        setJourney(journeyRes.data);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <Activity size={24} className="spin" style={{ marginRight: '12px' }} />
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Failed to load analytics data.
      </div>
    );
  }

  const { metrics, funnel, channel_performance, cohorts, step_performance, ai_insights } = analytics;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/journeys/build', { state: { tab: 'active' } })}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-subtle)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {journey?.name || 'Journey'} Analytics
              </h1>
              <span style={{ padding: '4px 10px', background: journey?.campaign_id ? 'rgba(16,185,129,0.1)' : 'rgba(245, 158, 11, 0.1)', color: journey?.campaign_id ? 'var(--accent-secondary)' : '#f59e0b', fontSize: '12px', fontWeight: 700, borderRadius: '20px' }}>
                {journey?.campaign_id ? 'Active' : 'Draft'}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Monitoring performance and business outcomes
            </div>
          </div>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(`/journeys/build`, { state: { journeyId: id } })}
          style={{ padding: '10px 20px' }}
        >
          Edit Journey Nodes
        </button>
      </div>

      {/* KPI Hero Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--accent-secondary)" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Revenue Generated</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-secondary)' }}>
            ₹{metrics.revenue.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#64748b" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customers Recovered</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {metrics.recovered.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} color="var(--accent-secondary)" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Conversion Rate</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {metrics.conversion_rate}%
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#d97706" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>ROI</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {metrics.roi}x
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Funnel & AI Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Journey Summary */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '16px', padding: '32px', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Zap size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>AI Journey Summary</h2>
            </div>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '24px' }}>
              {ai_insights?.summary || "Analyzing journey performance to generate strategic insights..."}
            </p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                Recommended Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(ai_insights?.recommendations || []).map((rec: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 800 }}>✓</span>
                    </div>
                    <div style={{ fontSize: '15px', color: 'white', lineHeight: '1.5' }}>{rec}</div>
                  </div>
                ))}
              </div>
              {ai_insights?.expected_additional_revenue && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>Expected Additional Revenue</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-secondary)' }}>₹{ai_insights.expected_additional_revenue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>Conversion Funnel</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Entered Journey', count: funnel.entered, max: funnel.entered, color: '#64748b' },
                { label: 'Message Sent', count: funnel.sent, max: funnel.entered, color: 'var(--accent-secondary)' },
                { label: 'Opened', count: funnel.opened, max: funnel.entered, color: 'var(--accent-secondary)' },
                { label: 'Clicked', count: funnel.clicked, max: funnel.entered, color: '#f59e0b' },
                { label: 'Purchased', count: funnel.purchased, max: funnel.entered, color: 'var(--accent-secondary)' }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '140px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {step.label}
                  </div>
                  <div style={{ flex: 1, height: '32px', background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ 
                      width: `${step.count / step.max * 100}%`, 
                      height: '100%', 
                      background: step.color, 
                      borderRadius: '16px',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                  <div style={{ width: '80px', textAlign: 'right', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {step.count.toLocaleString()}
                  </div>
                  <div style={{ width: '60px', textAlign: 'right', fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {Math.round((step.count / step.max) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Channels, Cohorts, Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Channel Performance */}
          <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>Channel Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {channel_performance.map((cp: any, i: number) => (
                <div key={i} style={{ padding: '16px', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    {cp.channel === 'WhatsApp' ? <MessageSquare size={18} color="var(--accent-secondary)" /> : <Mail size={18} color="var(--accent-secondary)" />}
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{cp.channel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Open Rate</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{cp.open_rate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click Rate</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{cp.click_rate}</span>
                  </div>
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Revenue</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-secondary)' }}>₹{cp.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cohorts */}
          <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#f59e0b" /> Top Converting Segments
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cohorts.map((cohort: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{cohort.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-secondary)' }}>{cohort.conversion}</span>
                    <ArrowUpRight size={14} color="var(--accent-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Step Performance Table */}
      <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>Journey Steps Performance</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>Step</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>Reached</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {step_performance.map((step: any, i: number) => (
              <tr key={i} style={{ borderBottom: i === step_performance.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{step.step}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'right' }}>{step.reached.toLocaleString()}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: step.success === '100%' ? 'var(--text-tertiary)' : 'var(--accent-secondary)', textAlign: 'right' }}>{step.success}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default JourneyAnalytics;
