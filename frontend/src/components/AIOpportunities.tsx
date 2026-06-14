import { Sparkles, TrendingUp, Users, ShoppingCart, Briefcase, Navigation } from 'lucide-react';

const AIOpportunities = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="var(--accent-secondary)" /> AI Opportunities
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Automatically detected revenue opportunities waiting to be captured.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {[
          { icon: <Users size={20} color="var(--accent-secondary)" />, title: 'Churn Recovery', desc: '142 VIP customers inactive for 60+ days.', impact: '₹24,300', tag: 'High Priority', tagColor: '#ef4444' },
          { icon: <ShoppingCart size={20} color="#f59e0b" />, title: 'Abandoned Carts', desc: '85 customers left high-value items in cart.', impact: '₹18,000', tag: 'Quick Win', tagColor: 'var(--accent-secondary)' },
          { icon: <TrendingUp size={20} color="var(--accent-secondary)" />, title: 'Upsell Premium', desc: '64 buyers ready for premium tier upgrade.', impact: '₹17,900', tag: 'High ROI', tagColor: 'var(--accent-secondary)' },
          { icon: <Briefcase size={20} color="var(--accent-secondary)" />, title: 'Loyalty Campaign', desc: '120 customers approaching 1-year anniversary.', impact: '₹9,000', tag: 'Engagement', tagColor: 'var(--accent-secondary)' }
        ].map((opp, i) => (
          <div key={i} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `4px solid ${opp.icon.props.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {opp.icon}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: opp.tagColor, border: `1px solid ${opp.tagColor}`, padding: '2px 8px', borderRadius: '12px' }}>{opp.tag}</span>
            </div>
            
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{opp.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{opp.desc}</p>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Impact</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{opp.impact}</span>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Navigation size={16} /> Launch Campaign
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIOpportunities;
