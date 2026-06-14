import  { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import API_URL from '../config';

export default function Copilot() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', text: "Hi! I'm your AI Marketing Copilot. Tell me who you want to target, like 'Bring back inactive customers who spend a lot'." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/copilot/parse`, { prompt: userText });
      const proposal = res.data;
      setMessages(prev => [...prev, { role: 'assistant', proposal }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that request right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const launchCampaign = async (proposal: any) => {
    try {
      const res = await axios.post(`${API_URL}/campaigns/`, {
        name: "AI Generated Journey",
        goal: "Engage audience",
        reasoning: proposal.reasoning,
        predicted_conversion: proposal.predicted_conversion,
        journey_steps: proposal.journey_steps
      });
      const campaignId = res.data.id;
      await axios.post(`${API_URL}/campaigns/${campaignId}/launch`);
      navigate(`/journeys`);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Failed to launch the journey. Please try again." }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles /> AI Campaign Copilot
        </h1>
        <p className="text-muted">Converse in natural language to generate segments, copy, and campaigns.</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '60%' : '80%',
            }}>
              {msg.text && (
                <div style={{ 
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  border: msg.role === 'assistant' ? 'var(--glass-border)' : 'none'
                }}>
                  {msg.text}
                </div>
              )}
              
              {msg.proposal && (
                <div className="glass-panel" style={{ padding: '24px', marginTop: '24px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                    <Zap size={20} /> AI Strategist Proposal
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Audience Discovered</p>
                        <p style={{ fontSize: '24px', fontWeight: 600 }}>{msg.proposal.audience_size} Shoppers</p>
                        <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--accent-primary)', opacity: 0.8 }}>{msg.proposal.reasoning}</p>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Simulation & Impact</p>
                        <p style={{ fontSize: '24px', fontWeight: 600, color: '#4ade80' }}>${msg.proposal.predicted_revenue?.toLocaleString() || 0}</p>
                        <p style={{ fontSize: '14px', marginTop: '8px', color: '#4ade80', opacity: 0.8 }}>{msg.proposal.historical_reference}</p>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Recommended Journey Plan</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                        {msg.proposal.journey_steps?.map((step: any, index: number) => (
                          <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid rgba(30,58,44,0.3)', flexShrink: 0, marginTop: '4px' }}>
                              {index + 1}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span className="badge badge-info">{step.channel.toUpperCase()}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{step.delay_days === 0 ? 'Immediate' : `Day ${step.delay_days}`}</span>
                              </div>
                              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{step.message_template}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '12px 32px', fontSize: '16px', boxShadow: '0 0 20px rgba(30,58,44,0.4)' }}
                        onClick={() => launchCampaign(msg.proposal)}
                      >
                        <Send size={20} style={{ marginRight: '8px' }} /> Approve & Launch Journey
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></span>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: 'var(--glass-border)', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="E.g., Target high spenders in Fashion who haven't ordered recently..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
