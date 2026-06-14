import  { useState, useRef, useEffect } from 'react';
import { 
  Brain, Send, ArrowRight, Bot, Users, Navigation, Sparkles, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AIStrategistOverview = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setPrompt('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I analyzed 500 customers based on your request to "${text}".`,
        opportunity: {
          text: "142 customers have not purchased in 60+ days.",
          recovery: "₹24,300",
          strategy: "Win-back campaign",
          channel: "WhatsApp",
          confidence: "91%"
        },
        actions: [
          { label: "Create Segment", path: "/audiences/ai-build" },
          { label: "Generate Campaign", path: "/copilot" }
        ]
      }]);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 100px)', paddingBottom: '20px' }}>
      
      {/* LEFT PANEL: 70% Chat Interface */}
      <div style={{ flex: '7', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        
        {messages.length === 0 ? (
          // EMPTY STATE (HERO)
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(36, 138, 88, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Brain size={32} color="var(--accent-secondary)" />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>EngageX Strategist</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '40px' }}>What would you like to achieve today?</p>
            
            <div style={{ width: '100%', maxWidth: '700px', position: 'relative', marginBottom: '32px' }}>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(prompt);
                  }
                }}
                placeholder="Message EngageX..."
                style={{ 
                  width: '100%', minHeight: '60px', padding: '20px 60px 20px 24px', borderRadius: '30px', 
                  border: '1px solid var(--border-strong)', background: 'var(--bg-tertiary)', outline: 'none', resize: 'none',
                  fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transition: '0.2s'
                }}
              />
              <button 
                onClick={() => handleSend(prompt)}
                style={{ position: 'absolute', right: '12px', bottom: '12px', background: prompt.trim() ? 'var(--accent-secondary)' : 'var(--border-strong)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: prompt.trim() ? 'pointer' : 'default', border: 'none', transition: '0.2s' }}
              >
                <Send size={16} />
              </button>
            </div>

            <div style={{ width: '100%', maxWidth: '700px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>Examples</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                {[
                  "Increase repeat purchases this month",
                  "Recover customers likely to churn",
                  "Generate a Father's Day campaign",
                  "Find customers who buy shoes but not accessories",
                  "Improve WhatsApp conversion rate"
                ].map((goal, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(goal)}
                    style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '24px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.background = 'rgba(36, 138, 88, 0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // CONVERSATION STATE
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-tertiary)' }}>
              <Brain size={20} color="var(--accent-secondary)" />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>EngageX Strategist</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '85%', padding: '16px 20px', borderRadius: '16px', fontSize: '15px', lineHeight: '1.5',
                    background: msg.role === 'user' ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  }}>
                    {msg.content}
                  </div>
                  
                  {msg.role === 'assistant' && msg.opportunity && (
                    <div style={{ marginTop: '16px', maxWidth: '85%', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '14px' }}>
                        <Sparkles size={16} /> Opportunity Found
                      </div>
                      <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {msg.opportunity.text}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Potential Recovery</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{msg.opportunity.recovery}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Confidence</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.opportunity.confidence}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recommended Strategy</div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{msg.opportunity.strategy}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recommended Channel</div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{msg.opportunity.channel}</div>
                        </div>
                      </div>
                      
                      {msg.actions && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          {msg.actions.map((act: any, idx: number) => (
                            <Link key={idx} to={act.path} style={{ textDecoration: 'none' }}>
                              <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                                {act.label} <ArrowRight size={14} />
                              </button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', padding: '16px' }}>
                  <Bot size={18} /> <span style={{ fontSize: '14px' }} className="typing-indicator">EngageX is thinking...</span>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
            
            <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(prompt);
                    }
                  }}
                  placeholder="Message EngageX..."
                  style={{ 
                    width: '100%', minHeight: '52px', padding: '16px 56px 16px 20px', borderRadius: '26px', 
                    border: '1px solid var(--border-strong)', background: 'var(--bg-tertiary)', outline: 'none', resize: 'none',
                    fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'inherit',
                  }}
                />
                <button 
                  onClick={() => handleSend(prompt)}
                  style={{ position: 'absolute', right: '8px', bottom: '8px', background: prompt.trim() ? 'var(--accent-secondary)' : 'var(--border-strong)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: prompt.trim() ? 'pointer' : 'default', border: 'none', transition: '0.2s' }}
                >
                  <Send size={16} />
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                AI Strategist can make mistakes. Consider verifying important metrics.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: 30% Context Sidebar */}
      <div style={{ flex: '3', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Today's Snapshot */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Today's Snapshot
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Revenue</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)' }}>₹12.4L</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Total Customers</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>12,500</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Active Campaigns</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>12</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Customers At Risk</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>154</span>
            </div>
          </div>
        </div>

        {/* Recent AI Actions */}
        <div className="card" style={{ padding: '20px', flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent AI Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { text: "Generated 'Summer Sale' segment", time: "2 hours ago", icon: <Users size={14} /> },
              { text: "Paused low-performing 'Old Shoes' campaign", time: "5 hours ago", icon: <Target size={14} /> },
              { text: "Recommended WhatsApp for VIPs", time: "Yesterday", icon: <Sparkles size={14} /> }
            ].map((action, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  {action.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>{action.text}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{action.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIStrategistOverview;
