import { Beaker, Plus, Zap, CheckCircle, TrendingUp,    ArrowRight, Play, Copy, BarChart2, Activity,   Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const chartData = [
  { name: 'VIP Win-back', 'Variant A': 12, 'Variant B': 16 },
  { name: 'Cart Recovery', 'Variant A': 18, 'Variant B': 21 },
  { name: 'Flash Sale', 'Variant A': 22, 'Variant B': 28 },
  { name: 'Cross-Sell Offer', 'Variant A': 14, 'Variant B': 19 }
];

export default function ABTesting() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Beaker size={24} color="#f59e0b" /> A/B Testing Studio
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Compare campaign variants, identify winners, and maximize conversion rates using AI-powered experimentation.
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 24px' }}>
          <Plus size={16} /> Create Experiment
        </button>
      </div>

      {/* SECTION 1: KPI OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Experiments</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginTop: '8px' }}>42</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Running Tests</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b', marginTop: '8px' }}>8</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Winning Variants Found</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '8px' }}>27</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue Lift</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '8px' }}>₹3.42L</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Conv. Improvement</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '8px' }}>+18.4%</div>
        </div>
      </div>

      {/* SECTION 2: ENGAGEX AI OPTIMIZATION CENTER */}
      <div className="card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(36, 138, 88, 0.1) 0%, rgba(36, 138, 88, 0.05) 100%)', border: '1px solid rgba(36, 138, 88, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Zap size={20} color="var(--accent-secondary)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--accent-secondary)' }}>EngageX Optimization Center</h2>
        </div>
        
        <p style={{ fontSize: '18px', color: 'white', fontWeight: 600, marginBottom: '24px' }}>
          AI identified a winning WhatsApp variant with 32% higher conversion.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Campaign</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>VIP Win-back Campaign</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Control Conversion</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>12.4%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Variant Conversion</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)' }}>16.3%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Improvement</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-secondary)' }}>+31.5%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Confidence</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)' }}>96%</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/campaigns')} style={{ padding: '12px 24px' }}>
            <CheckCircle size={16} /> Apply Winning Variant
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/messages/generate')} style={{ padding: '12px 24px' }}>
            <Zap size={16} /> Generate New Variant
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/journeys')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--accent-secondary)', color: 'var(--accent-secondary)' }}>
            <Play size={16} /> Launch Campaign
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION 4: CHART */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>Conversion Rate Comparison</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px' }}
                    itemStyle={{ color: 'white' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Variant A" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Variant B" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION 3: ACTIVE EXPERIMENTS */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#f59e0b" /> Active Experiments
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {[
                { name: 'VIP Win-back Campaign', aud: '142 Customers', chan: 'WhatsApp', a: '12.4%', b: '16.3%', conf: '96%', lift: '₹24,300' },
                { name: 'Summer Flash Sale', aud: '1,250 Customers', chan: 'Email', a: '21.5%', b: '25.8%', conf: '88%', lift: '₹85,000' },
                { name: 'New User Onboarding', aud: '450 Customers', chan: 'SMS', a: '8.2%', b: '11.5%', conf: '92%', lift: '₹12,400' },
                { name: 'Abandoned Cart Rescue', aud: '85 Customers', chan: 'Push', a: '14.1%', b: '14.5%', conf: '45%', lift: '₹3,200' }
              ].map((exp, i) => (
                <div key={i} className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', margin: 0 }}>{exp.name}</h4>
                    <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>Running</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Audience</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>{exp.aud}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Channel</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>{exp.chan}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Variant A</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{exp.a}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Variant B</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{exp.b}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Confidence</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{exp.conf}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Revenue Lift</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{exp.lift}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>View Results</button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Pause Test</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION 5: AI RECOMMENDED TESTS */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--accent-secondary)" /> AI Recommended Tests
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 12px 0' }}>WhatsApp Subject Line Test</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Potential Lift: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>+15%</span>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/messages/generate')} style={{ width: '100%', padding: '8px', fontSize: '12px' }}>Generate Test</button>
              </div>

              <div className="card" style={{ padding: '20px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 12px 0' }}>Discount Optimization</h4>
                <div style={{ fontSize: '13px', color: 'white', marginBottom: '8px' }}>Compare: 10% OFF vs 20% OFF</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Potential Lift: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>+22%</span>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/messages/generate')} style={{ width: '100%', padding: '8px', fontSize: '12px' }}>Generate Test</button>
              </div>

              <div className="card" style={{ padding: '20px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 12px 0' }}>CTA Optimization</h4>
                <div style={{ fontSize: '13px', color: 'white', marginBottom: '8px' }}>Shop Now vs Claim Offer</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Potential Lift: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>+11%</span>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/messages/generate')} style={{ width: '100%', padding: '8px', fontSize: '12px' }}>Generate Test</button>
              </div>
            </div>
          </div>

          {/* SECTION 6: WINNING VARIANTS LEADERBOARD */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(36, 138, 88, 0.05)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> Winning Variants Leaderboard
              </h3>
            </div>
            {[
              { rank: 1, name: 'VIP Win-back', lift: '+31.5%', rev: '₹47,000' },
              { rank: 2, name: 'Summer Flash Sale', lift: '+22.3%', rev: '₹85,000' },
              { rank: 3, name: 'Cart Recovery', lift: '+19.8%', rev: '₹12,400' },
              { rank: 4, name: 'Loyalty Upgrade', lift: '+17.1%', rev: '₹22,000' },
              { rank: 5, name: 'New User Onboarding', lift: '+14.4%', rev: '₹18,000' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text-secondary)' }}>#{item.rank}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{item.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{item.lift}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.rev}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 9: AI INSIGHTS PANEL */}
          <div className="card" style={{ padding: '24px', border: '1px solid rgba(36, 138, 88, 0.3)', background: 'rgba(36, 138, 88, 0.05)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} /> Optimization Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: 'white', display: 'flex', gap: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)', marginTop: '6px' }}></div>
                <div style={{ flex: 1 }}>Customers respond better to urgency-based copy.</div>
              </div>
              <div style={{ fontSize: '13px', color: 'white', display: 'flex', gap: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)', marginTop: '6px' }}></div>
                <div style={{ flex: 1 }}>WhatsApp messages outperform Email by 18%.</div>
              </div>
              <div style={{ fontSize: '13px', color: 'white', display: 'flex', gap: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)', marginTop: '6px' }}></div>
                <div style={{ flex: 1 }}>20% discounts outperform 10% discounts among churn-risk customers.</div>
              </div>
              <div style={{ fontSize: '13px', color: 'white', display: 'flex', gap: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)', marginTop: '6px' }}></div>
                <div style={{ flex: 1 }}>Messages sent between 6PM–8PM generate highest conversion.</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 7: EXPERIMENT FUNNEL */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>Experiment Funnel</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '24px 48px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>42</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Created</div>
          </div>
          <ArrowRight size={20} color="var(--border-strong)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>8</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Running</div>
          </div>
          <ArrowRight size={20} color="var(--border-strong)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>34</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Completed</div>
          </div>
          <ArrowRight size={20} color="var(--border-strong)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>27</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Winning Variants</div>
          </div>
          <ArrowRight size={20} color="var(--border-strong)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>21</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Applied</div>
          </div>
          <ArrowRight size={20} color="var(--border-strong)" />
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(36, 138, 88, 0.1)', borderRadius: '12px', border: '1px solid rgba(36, 138, 88, 0.3)' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-secondary)' }}>₹3.42L</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Revenue Lift</div>
          </div>
        </div>
      </div>

      {/* SECTION 8: EXPERIMENT LIBRARY TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Experiment Library</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', background: 'var(--bg-secondary)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Experiment Name</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Campaign</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Channel</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Var A</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Var B</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Winner</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Rev Lift</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Conf.</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Created Date</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'VIP Win-back Test', camp: 'VIP Win-back Campaign', chan: 'WhatsApp', status: 'Completed', a: '12.4%', b: '16.3%', win: 'Variant B', lift: '₹24,300', conf: '96%', date: 'Jun 8, 2024' },
              { name: 'Subject Line Emoji', camp: 'Summer Flash Sale', chan: 'Email', status: 'Completed', a: '22.0%', b: '28.1%', win: 'Variant B', lift: '₹85,000', conf: '99%', date: 'Jun 1, 2024' },
              { name: 'Discount Type 10 vs 20', camp: 'Cart Recovery', chan: 'SMS', status: 'Running', a: '18.1%', b: '21.0%', win: '-', lift: '-', conf: '82%', date: 'Jun 10, 2024' }
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{row.camp}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{row.chan}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '10px', background: row.status === 'Completed' ? 'rgba(36, 138, 88, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: row.status === 'Completed' ? 'var(--accent-secondary)' : '#f59e0b', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.a}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.b}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: row.win !== '-' ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>{row.win}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: row.lift !== '-' ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>{row.lift}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{row.conf}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{row.date}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }} title="View Analytics"><BarChart2 size={14} /></button>
                    <button style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Clone Test"><Copy size={14} /></button>
                    <button style={{ padding: '6px', background: 'transparent', border: '1px solid var(--accent-secondary)', borderRadius: '6px', cursor: 'pointer', color: 'var(--accent-secondary)' }} title="Apply Winner"><CheckCircle size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
