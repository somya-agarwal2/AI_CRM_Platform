import { MessageSquare, Mail, Smartphone, Wand2, Copy, Save } from 'lucide-react';

const MessageGenerator = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={24} color="var(--accent-secondary)" /> Message Generator
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            AI-powered copywriting for WhatsApp, Email, and SMS.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary">
            <Save size={16} /> Save Templates
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Side: Prompt & Generation */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={16} color="var(--accent-secondary)" /> Campaign Context
          </h3>
          
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Goal</label>
            <input type="text" className="input-field" defaultValue="Win back VIP customers inactive for 60+ days" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Offer / Incentive</label>
            <input type="text" className="input-field" defaultValue="20% discount on next purchase" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Tone of Voice</label>
            <select className="input-field">
              <option>Friendly & Urgent</option>
              <option>Professional</option>
              <option>Playful</option>
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
            <Wand2 size={16} /> Generate Variants
          </button>
        </div>

        {/* Right Side: Previews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* WhatsApp Preview */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--accent-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Smartphone size={16} color="var(--accent-secondary)" /> WhatsApp
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '10px', background: '#ECFDF5', color: 'var(--accent-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Variant A</span>
                <Copy size={14} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              Hi [First Name] 👋<br/><br/>
              We've missed you! As one of our most valued customers, we'd love to welcome you back with a special gift. 🎁<br/><br/>
              Enjoy <strong>20% OFF</strong> your next purchase with code <strong>VIP20</strong>.<br/><br/>
              Shop now: [Link] (Valid for 48 hours!)
            </div>
          </div>

          {/* Email Preview */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Mail size={16} color="#f59e0b" /> Email
              </div>
              <Copy size={14} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong>Subject:</strong> We miss you, [First Name]! Here's a 20% gift 🎁<br/><br/>
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }}></div>
              It’s been a while since we last saw you. We wanted to drop by and say thank you for being a VIP shopper.<br/><br/>
              To show our appreciation, please use code <strong>VIP20</strong> at checkout for 20% off your entire cart.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageGenerator;
