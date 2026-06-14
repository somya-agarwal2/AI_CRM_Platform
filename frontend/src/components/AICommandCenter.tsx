import  { useState, useEffect, useRef } from 'react';
import {  Send, Bot, User, CheckCircle2, Activity,    Sparkles } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

type Message = {
  role: 'assistant' | 'user';
  content: string;
  previewData?: any;
};

const AICommandCenter = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('ai_command_center_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
    return [
      { role: 'assistant', content: 'Hi! I am your AI Marketing Command Center. Tell me your goal, such as "Create segment for customers with order > 3" or "Create campaign for customers who ordered yesterday".' }
    ];
  });

  useEffect(() => {
    sessionStorage.setItem('ai_command_center_messages', JSON.stringify(messages));
  }, [messages]);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, analyzing]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setInput('');
    setAnalyzing(true);
    
    try {
      const res = await axios.post(`${API_URL}/command-center/intent`, { goal: currentInput });
      const intent = res.data;
      
      let contentText = '';
      if (intent.action === 'create_segment') {
        contentText = `Found ${intent.preview?.count || 0} matching customers. Would you like to create this segment?`;
      } else if (intent.action === 'create_campaign') {
        contentText = `Found ${intent.preview?.count || 0} matching customers for this campaign. Ready to launch?`;
      } else {
        contentText = "I didn't quite understand that action. Could you rephrase?";
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: contentText,
        previewData: intent.action !== 'fallback' ? intent : undefined
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, there was an error analyzing your request.` }]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecute = async (previewData: any) => {
    setExecuting(true);
    try {
      const res = await axios.post(`${API_URL}/command-center/execute`, { 
        action: previewData.action, 
        name: previewData.name,
        channel: previewData.channel,
        message: previewData.message,
        customer_ids: previewData.customer_ids
      });
      
      let successMsg = "";
      if (previewData.action === 'create_segment') {
        successMsg = `Segment "${previewData.name}" created successfully!\n\nWould you like me to:\n1. Create Campaign\n2. Create Journey\n3. Generate Insights\n4. View Customers`;
      } else if (previewData.action === 'create_campaign') {
        successMsg = `Campaign "${previewData.name}" created successfully!`;
      }

      // We remove the previewData from the last message so the buttons disappear
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg.previewData) {
          lastMsg.previewData = { ...lastMsg.previewData, executed: true };
        }
        return newMsgs;
      });

      setMessages(prev => [...prev, { role: 'assistant', content: successMsg }]);
    } catch (e) {
      alert("Error executing command");
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = () => {
    setMessages(prev => {
      const newMsgs = [...prev];
      const lastMsg = newMsgs[newMsgs.length - 1];
      if (lastMsg.previewData) {
        lastMsg.previewData = { ...lastMsg.previewData, executed: true };
      }
      return newMsgs;
    });
    setMessages(prev => [...prev, { role: 'assistant', content: "Action cancelled. What would you like to do next?" }]);
  };

  const handleNewChat = () => {
    setMessages([
      { role: 'assistant', content: 'Hi! I am your AI Marketing Command Center. Tell me your goal, such as "Create segment for customers with order > 3" or "Create campaign for customers who ordered yesterday".' }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-secondary))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>AI Command Center</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Omnichannel Orchestration Copilot</p>
          </div>
        </div>
        <button 
          onClick={handleNewChat}
          style={{ background: 'white', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          New Chat
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.role === 'assistant' ? 'var(--bg-tertiary)' : 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.role === 'assistant' ? <Bot size={20} color="var(--text-primary)" /> : <User size={20} color="white" />}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '85%' }}>
                  <div style={{ 
                    background: msg.role === 'user' ? 'var(--accent-secondary)' : '#F8FAFC', 
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    padding: '16px 20px', 
                    borderRadius: '16px', 
                    fontSize: '14px', 
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(16,185,129,0.2)' : 'none'
                  }}>
                    {msg.content}
                  </div>

                  {/* Preview Card */}
                  {msg.previewData && !msg.previewData.executed && (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden', width: '400px' }}>
                      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: '#F8FAFC' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {msg.previewData.action === 'create_segment' ? 'Segment Preview' : 'Campaign Preview'}
                        </h4>
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Name</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{msg.previewData.name}</div>
                        </div>

                        {msg.previewData.action === 'create_campaign' && (
                          <>
                            <div>
                              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Channel</div>
                              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{msg.previewData.channel}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Message</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '4px' }}>
                                "{msg.previewData.message}"
                              </div>
                            </div>
                          </>
                        )}

                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ flex: 1, background: 'rgba(16,185,129,0.05)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: 700, marginBottom: '4px' }}>Customers Matched</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-secondary)' }}>{msg.previewData.preview?.count || 0}</div>
                          </div>
                          <div style={{ flex: 1, background: 'rgba(59,130,246,0.05)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: 700, marginBottom: '4px' }}>Est. Revenue</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-secondary)' }}>₹{msg.previewData.preview?.estimated_revenue || 0}</div>
                          </div>
                        </div>

                        {msg.previewData.preview?.customers && msg.previewData.preview.customers.length > 0 && (
                          <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Matched Customers</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {msg.previewData.preview.customers.map((c: any) => (
                                <div key={c.id} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <CheckCircle2 size={12} color="var(--accent-secondary)" /> {c.name}
                                </div>
                              ))}
                              {msg.previewData.preview.count > 5 && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                                  + {msg.previewData.preview.count - 5} more...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button 
                            onClick={() => handleExecute(msg.previewData)}
                            disabled={executing}
                            style={{ flex: 1, background: 'var(--accent-secondary)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: executing ? 'not-allowed' : 'pointer' }}
                          >
                            {executing ? 'Executing...' : (msg.previewData.action === 'create_segment' ? 'Create Segment' : 'Launch Campaign')}
                          </button>
                          <button 
                            onClick={handleCancel}
                            disabled={executing}
                            style={{ flex: 1, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: executing ? 'not-allowed' : 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {analyzing && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={20} className="spinner" color="var(--text-primary)" />
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '16px', fontSize: '14px', background: '#F8FAFC', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Querying database and generating insights...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid var(--border-subtle)', background: '#F8FAFC' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type your command here..."
                style={{ 
                  flex: 1, minHeight: '60px', padding: '16px 56px 16px 20px', borderRadius: '16px', 
                  border: '2px solid var(--border-subtle)', outline: 'none', resize: 'none',
                  fontSize: '14px', fontFamily: 'inherit', background: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              />
              <button 
                onClick={handleSend}
                style={{ position: 'absolute', right: '12px', bottom: '12px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Send size={16} style={{ marginLeft: '2px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;
