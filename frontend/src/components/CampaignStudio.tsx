import React, { useState, useEffect } from 'react';
import { Play, Pause,   Sparkles,  ChevronDown,  ChevronUp, Plus, X, Target, Check, Mail, Smartphone, MessageSquare, Bell, MoreVertical,    Copy, Download,      LayoutTemplate } from 'lucide-react';


class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{position:'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', padding: '20px'}}>{this.state.error.toString()}<br/><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children;
  }
}

import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';


const CreateCampaignModal = ({ isOpen, onClose, segments, onSave }: any) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    goal: 'Conversion',
    audience_id: '',
    channels: ['Email'],
    executionType: 'journey',
    journeyAction: 'link_existing',
    subject: '',
    message: ''
  });
//   const [showAttachModal, setShowAttachModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (showTemplateModal && templates.length === 0) {
      axios.get(`${API_URL}/templates`).then(res => setTemplates(res.data)).catch(console.error);
    }
  }, [showTemplateModal]);

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const selectTemplate = (t: any) => {
    setSelectedTemplate(t);
    // Extract text content from template blocks to populate subject/message
    try {
      const parsed = typeof t.json_content === 'string' ? JSON.parse(t.json_content) : t.json_content;
      const blocks: any[] = parsed?.blocks || [];
      const headerBlock = blocks.find((b: any) => b.type === 'Header');
      const textBlocks = blocks.filter((b: any) => ['Text', 'Button', 'Coupon'].includes(b.type));
      const bodyText = textBlocks.map((b: any) => b.content || '').filter(Boolean).join('\n\n');
      setFormData(prev => ({
        ...prev,
        subject: headerBlock?.content || prev.subject || t.name,
        message: bodyText || t.html_content || `Template: ${t.name} applied.`
      }));
    } catch {
      setFormData(prev => ({ ...prev, message: t.html_content || `Template: ${t.name} applied.` }));
    }
    setShowTemplateModal(false);
  };

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const toggleChannel = (channel: string) => {
    setFormData(prev => {
      const channels = prev.channels.includes(channel) 
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  const selectedSegment = segments.find((s: any) => s.id === formData.audience_id);

  const handleGenerateMessage = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/ai/campaign/generate`, { prompt: aiPrompt });
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          subject: res.data.subject || prev.subject,
          message: res.data.body || prev.message
        }));
      }
    } catch (e) {
      console.error("AI Generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '600px', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Create New Campaign</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', opacity: step >= num ? 1 : 0.5 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '12px', background: step > num ? 'var(--accent-secondary)' : step === num ? 'var(--accent-secondary)' : 'var(--border-strong)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                {step > num ? <Check size={14} /> : num}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: step >= num ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {num === 1 ? 'Details' : num === 2 ? 'Audience' : num === 3 ? 'Channels' : num === 4 ? 'Message' : 'Review'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px', minHeight: '300px', maxHeight: '70vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Campaign Name</label>
                <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Summer Sale 2026" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Primary Goal</label>
                <select className="input-field" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})}>
                  <option value="Conversion">Conversion</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Retention">Retention</option>
                  <option value="Win-back">Win-back</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select the target audience segment for this campaign.</div>
              {segments.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  No segments found. Please create a segment first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {segments.map((seg: any) => (
                    <div 
                      key={seg.id}
                      onClick={() => setFormData({...formData, audience_id: seg.id})}
                      style={{ padding: '16px', border: formData.audience_id === seg.id ? '2px solid var(--accent-secondary)' : '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', background: formData.audience_id === seg.id ? 'rgba(36, 138, 88, 0.05)' : 'white' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{seg.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{seg.count || 0} customers</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Which channels do you want to use to reach this audience?</div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 {[
                   { id: 'Email', icon: Mail },
                   { id: 'WhatsApp', icon: MessageSquare },
                   { id: 'SMS', icon: Smartphone },
                   { id: 'Push', icon: Bell }
                 ].map(channel => (
                   <div 
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: formData.channels.includes(channel.id) ? '2px solid var(--accent-secondary)' : '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', background: formData.channels.includes(channel.id) ? 'rgba(36, 138, 88, 0.05)' : 'white' }}
                   >
                     <div style={{ color: formData.channels.includes(channel.id) ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
                       <channel.icon size={20} />
                     </div>
                     <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{channel.id}</div>
                     {formData.channels.includes(channel.id) && <Check size={16} color="var(--accent-secondary)" style={{ marginLeft: 'auto' }} />}
                   </div>
                 ))}
               </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutTemplate size={16} color="var(--accent-secondary)" /> Design Template
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowTemplateModal(true)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                      {selectedTemplate ? 'Change' : 'Use Template'}
                    </button>
                    {selectedTemplate && (
                      <button onClick={() => { setSelectedTemplate(null); setFormData(prev => ({ ...prev, subject: '', message: '' })); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {selectedTemplate ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selectedTemplate.thumbnail && (
                      <img src={selectedTemplate.thumbnail} alt={selectedTemplate.name} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTemplate.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                        <span>✓ Template applied</span>
                        <span>·</span>
                        <span>{selectedTemplate.category}</span>
                        <span>·</span>
                        <span>{selectedTemplate.open_rate}% open rate</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pick a pre-built template to auto-fill subject &amp; message content.</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Describe the message to the AI, or write it manually.</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="input-field" 
                    value={aiPrompt} 
                    onChange={e => setAiPrompt(e.target.value)} 
                    placeholder="e.g. Draft a Win-back offer for dormant VIPs with a 20% discount" 
                    style={{ flex: 1 }}
                  />
                  <button 
                    onClick={handleGenerateMessage}
                    disabled={isGenerating || !aiPrompt.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-secondary)', background: 'rgba(36, 138, 88, 0.1)', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: isGenerating || !aiPrompt.trim() ? 'not-allowed' : 'pointer', opacity: isGenerating || !aiPrompt.trim() ? 0.7 : 1 }}
                  >
                    <Sparkles size={16} />
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Subject Line (for Email/Push)</label>
                <input className="input-field" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g. You won't want to miss this..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Message Body (Fallback)</label>
                <textarea className="input-field" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Hi {{name}},&#10;&#10;We have a special offer for you..." style={{ minHeight: '120px', resize: 'vertical' }} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>CAMPAIGN NAME</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{formData.name || 'Untitled Campaign'}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>GOAL</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formData.goal}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>AUDIENCE</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedSegment ? selectedSegment.name : 'None selected'}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>AUTOMATION</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Send Immediately</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>CHANNELS</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {formData.channels.map(c => (
                      <span key={c} className="badge badge-info">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-tertiary)' }}>
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={handlePrev}>Back</button>
          ) : <div></div>}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {step < 5 ? (
              <button 
                className="btn btn-primary" 
                onClick={handleNext}
                disabled={
                  (step === 1 && !formData.name) || 
                  (step === 2 && !formData.audience_id) || 
                  (step === 3 && formData.channels.length === 0) || 
                  (step === 4 && !formData.message)
                }
              >
                Continue
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => onSave({ ...formData, status: 'Draft' })}>Save as Draft</button>
                <button className="btn btn-primary" onClick={() => onSave({ ...formData, status: 'Running' })}>Launch Campaign</button>
              </>
            )}
          </div>
        </div>
      </div>

      {showTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowTemplateModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div className="card" style={{ position: 'relative', width: '760px', maxHeight: '85vh', background: 'var(--bg-secondary)', borderRadius: '16px', zIndex: 201, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700 }}>Choose a Template</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Select a template to pre-fill your campaign message content.</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            {/* Template Grid */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <LayoutTemplate size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <div>Loading templates...</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  {templates.map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      style={{
                        border: selectedTemplate?.id === t.id ? '2px solid var(--accent-secondary)' : '1px solid var(--border-subtle)',
                        borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                        background: selectedTemplate?.id === t.id ? 'rgba(36,138,88,0.04)' : 'var(--bg-tertiary)',
                        transition: 'all 0.15s', position: 'relative'
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-secondary)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = selectedTemplate?.id === t.id ? 'var(--accent-secondary)' : 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                    >
                      {/* Thumbnail */}
                      <div style={{ height: '110px', background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative' }}>
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                            <LayoutTemplate size={32} />
                          </div>
                        )}
                        {selectedTemplate?.id === t.id && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--accent-secondary)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={13} color="white" />
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
                          {t.category}
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{t.open_rate}%</span> open
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{t.click_rate}%</span> click
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 700, color: '#3b82f6' }}>{t.conversion_rate}%</span> conv
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
              <button onClick={() => setShowTemplateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => selectedTemplate && selectTemplate(selectedTemplate)} className="btn btn-primary" disabled={!selectedTemplate} style={{ opacity: selectedTemplate ? 1 : 0.5 }}>
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CommandCenter = ({ isOpen, onClose, selectedOpportunityId, baseCampaign, segmentCount, priorityCampaigns }: any) => {
  const selectedOpportunity = priorityCampaigns.find((c: any) => c.id === selectedOpportunityId) || priorityCampaigns[0] || {} as any;
  const [editableSubject, setEditableSubject] = useState(selectedOpportunity.subject);
  const [editableMessage, setEditableMessage] = useState(selectedOpportunity.message);
  const [editableChannel, setEditableChannel] = useState(selectedOpportunity.channel);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(true);

  useEffect(() => {
    if (selectedOpportunity && selectedOpportunity.subject) {
      setEditableSubject(selectedOpportunity.subject);
      setEditableMessage(selectedOpportunity.message);
      setEditableChannel(selectedOpportunity.channel);
    }
  }, [selectedOpportunity]);

  const generateAnotherVersion = () => {
    setIsGeneratingMessage(true);
    setTimeout(() => {
      setIsGeneratingMessage(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
      <div className="card" style={{ position: 'relative', width: '800px', maxHeight: '90vh', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${selectedOpportunity.color || 'var(--accent-secondary)'}30`, animation: 'fadeIn 0.2s ease-out', zIndex: 101, background: 'var(--bg-primary)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}>
          <X size={24} />
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '32px 32px 24px', background: `linear-gradient(135deg, ${selectedOpportunity.color || 'var(--accent-secondary)'}15 0%, transparent 100%)`, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${selectedOpportunity.color || 'var(--accent-secondary)'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color={selectedOpportunity.color || 'var(--accent-secondary)'} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{selectedOpportunity.title}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Target Segment</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOpportunity.target_segment_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Expected Revenue</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-secondary)' }}>₹{(selectedOpportunity.expected_revenue || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Confidence Score</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{selectedOpportunity.confidence_score}%</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <button onClick={() => setIsWhyOpen(!isWhyOpen)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Target size={16} color="var(--accent-secondary)" /> Why AI recommends this
                </div>
                {isWhyOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
              </button>
              {isWhyOpen && (
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '16px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)', marginTop: '6px', flexShrink: 0 }} />
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedOpportunity.reasoning}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

const generateRichCampaignData = (baseCampaign: any, segmentCount: number = 0) => {
  return { ...baseCampaign };
};

export default function CampaignStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(1);
  const [generatingOppId, setGeneratingOppId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [segments, setSegments] = useState([]);
  const [priorityCampaigns, setPriorityCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<any>(null);
//   const [activeDetailTab, setActiveDetailTab] = useState('Overview');
  const [selectedRecipientForTimeline, setSelectedRecipientForTimeline] = useState<any>(null);
  const [reminderCampaignSent, setReminderCampaignSent] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    // If navigated from AudiencesHub automation
    if (location.state?.autoOpenCampaignId && campaigns.length > 0) {
      const campToOpen = campaigns.find(c => c.id === location.state.autoOpenCampaignId);
      if (campToOpen) {
        setSelectedCampaignForDetails(campToOpen);
        setActiveTab('All'); // Switch to All tab
        // Clear state so it doesn't reopen on refresh
        navigate('/campaigns', { replace: true, state: {} });
      }
    }
  }, [location.state?.autoOpenCampaignId, campaigns]);

  useEffect(() => {
    if (selectedCampaignForDetails?.id) {
      setLoadingInsights(true);
      setAiInsights(null);
      axios.get(`${API_URL}/campaigns/${selectedCampaignForDetails.id}/insights`)
        .then(res => setAiInsights(res.data))
        .catch(err => setAiInsights({ error: 'AI insights unavailable' }))
        .finally(() => setLoadingInsights(false));
    }
  }, [selectedCampaignForDetails?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, statRes, segRes, oppRes] = await Promise.all([
        axios.get(`${API_URL}/campaigns`),
        axios.get(`${API_URL}/campaign-analytics`),
        axios.get(`${API_URL}/segments`),
        axios.get(`${API_URL}/campaigns/opportunities`)
      ]);
      setCampaigns(campRes.data);
      setAnalytics(statRes.data);
      setSegments(Array.isArray(segRes.data) ? segRes.data : segRes.data.segments || []);
      
      let opportunities = oppRes.data;
      if (opportunities && !Array.isArray(opportunities)) {
        opportunities = opportunities.recommended_campaigns || opportunities.campaigns || opportunities.opportunities || [];
      }
      setPriorityCampaigns(Array.isArray(opportunities) ? opportunities : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(`${API_URL}/campaigns/${id}`, { status: newStatus });
      setCampaigns(prev => prev.map((c: any) => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error('Failed to update campaign status', err);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await axios.delete(`${API_URL}/campaigns/${id}`);
      setCampaigns(prev => prev.filter((c: any) => c.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to delete campaign', err);
    }
  };

  const handleGenerateFromAI = async (camp: any, e: React.MouseEvent) => {

    e.stopPropagation();
    if (generatingOppId) return;
    
    try {
      setGeneratingOppId(camp.id);
      await axios.post(`${API_URL}/campaigns/generate-from-opportunity/${camp.id}`);
      setPriorityCampaigns(prev => prev.filter(c => c.id !== camp.id));
      fetchData();
    } catch (err) {
      console.error('Failed to create AI campaign', err);
    } finally {
      setGeneratingOppId(null);
    }
  };

  const handleSaveCampaign = async (campaignData: any) => {
    try {
      const saveStatus = (campaignData.executionType === 'journey' && campaignData.journeyAction === 'create_new') ? 'Draft' : (campaignData.status === 'Running' ? 'Running' : 'Draft');

      const res = await axios.post(`${API_URL}/campaigns`, {
        name: campaignData.name,
        goal: campaignData.goal,
        audience_id: campaignData.audience_id,
        channels: campaignData.channels.join(', '),
        status: saveStatus
      });
      
      if (saveStatus === 'Running') {
        try { await axios.post(`${API_URL}/campaigns/${res.data.id}/launch`); } catch(e) {}
      }
      
      setIsModalOpen(false);
      fetchData();

      if (campaignData.executionType === 'journey') {
        if (campaignData.journeyAction === 'create_new') {
          navigate('/journeys/build', { state: { segmentId: campaignData.audience_id, audienceSize: 0, initialPrompt: `Create a journey for ${campaignData.name}` } });
        }
      }
    } catch (e) {
      console.error('Failed to save campaign', e);
    }
  };

  const handleAction = async (action: string) => {
    const opp = priorityCampaigns.find(c => c.id === selectedOpportunityId) || priorityCampaigns[0];
    try {
      if (action === 'campaign') {
        const audienceName = opp.segment.split(' (')[0];
        const segRes = await axios.post(`${API_URL}/segments`, {
          name: audienceName,
          filters: [{ field: 'auto', operator: 'equals', value: audienceName }]
        });
        const campRes = await axios.post(`${API_URL}/campaigns`, {
          name: opp.title,
          audience_id: segRes.data.id,
          channels: opp.channel,
          expected_revenue: opp.expectedRevenue,
          status: 'Running'
        });
        try { await axios.post(`${API_URL}/campaigns/${campRes.data.id}/launch`); } catch(e) {}
        fetchData();
      }
    } catch (e) {
      console.error('Action failed', e);
    }
  };

  const filteredCampaigns = campaigns.filter((c: any) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return c.status === 'Running' || c.status === 'Active';
    if (activeTab === 'Completed') return c.status === 'Completed';
    if (activeTab === 'Drafts') return c.status === 'Draft';
    return true;
  });

  const openCommandCenter = (opp: any) => {
    setSelectedOpportunityId(opp.id);
    setIsCommandOpen(true);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Campaign Studio...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Campaign Studio</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage, monitor, and optimize your marketing campaigns.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '8px 24px' }}>
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      <CreateCampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        segments={segments} 
        onSave={handleSaveCampaign} 
      />

      <CommandCenter 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)} 
        selectedOpportunityId={selectedOpportunityId} 
        priorityCampaigns={priorityCampaigns} 
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
          Priority AI Opportunities
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {priorityCampaigns.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              No AI opportunities available. Connect AI provider.
            </div>
          ) : priorityCampaigns.map((camp, idx) => (
              <div 
              key={camp.id}
              onClick={() => openCommandCenter(camp)}
              className="ai-card-hover"
              style={{ 
                padding: '24px', 
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>#{idx + 1}</span>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="var(--accent-secondary)" />
                </div>
              </div>
              
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {camp.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5', fontWeight: 600 }}>
                Target: {camp.target_segment_name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Target Customers</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{camp.customer_count?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Avg LTV</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{Math.round((camp.expected_revenue || 0) / (camp.customer_count || 1)).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Expected Rev</div>
                    <div style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>₹{(camp.expected_revenue || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Predicted Conv.</div>
                    <div style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{Math.round(camp.confidence_score / 4)}%</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Reason</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{camp.reasoning}</div>
                </div>
                <button 
                  onClick={(e) => handleGenerateFromAI(camp, e)}
                  disabled={generatingOppId === camp.id}
                  style={{ 
                    width: '100%',
                    background: 'var(--accent-secondary)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '10px 16px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    cursor: generatingOppId === camp.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'opacity 0.2s, transform 0.1s',
                    opacity: generatingOppId === camp.id ? 0.7 : 1
                  }}
                  onMouseEnter={e => { if (generatingOppId !== camp.id) e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={e => { if (generatingOppId !== camp.id) e.currentTarget.style.opacity = '1'; }}
                  onMouseDown={e => { if (generatingOppId !== camp.id) e.currentTarget.style.transform = 'scale(0.98)'; }}
                  onMouseUp={e => { if (generatingOppId !== camp.id) e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {generatingOppId === camp.id ? (
                    <>Generating...</>
                  ) : (
                    <><Sparkles size={16} /> Generate AI Campaign</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Bottom Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>All Campaigns</h3>
          
          <div style={{ display: 'flex', background: 'transparent', gap: '4px' }}>
            {['All', 'Active', 'Completed', 'Drafts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: activeTab === tab ? '#f1f5f9' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: activeTab === tab ? '1px solid var(--border-strong)' : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px' }}>Campaign</th>
              <th style={{ padding: '16px 24px' }}>Status</th>
              <th style={{ padding: '16px 24px' }}>Channel</th>
              <th style={{ padding: '16px 24px' }}>Sent</th>
              <th style={{ padding: '16px 24px' }}>Open Rate</th>
              <th style={{ padding: '16px 24px' }}>CTR</th>
              <th style={{ padding: '16px 24px' }}>Revenue</th>
              <th style={{ padding: '16px 24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No campaigns found.
                </td>
              </tr>
            ) : filteredCampaigns.map((row, i) => {
              const segment = segments.find((s: any) => s.id === row.audience_id);
              const actualSent = row.reach || 0;
              const openRate = actualSent > 0 ? ((row.opened || 0) / actualSent * 100).toFixed(1) + '%' : '0.0%';
              const ctr = actualSent > 0 ? ((row.click_count || 0) / actualSent * 100).toFixed(1) + '%' : '0.0%';
              const revenue = typeof row.expected_revenue === 'number' ? `$${row.expected_revenue.toLocaleString()}` : '$0';
              return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '12px', background: row.status === 'Running' ? 'rgba(36, 138, 88, 0.1)' : row.status === 'Draft' ? 'var(--bg-tertiary)' : 'rgba(36, 138, 88, 0.1)', color: row.status === 'Running' ? 'var(--accent-secondary)' : row.status === 'Draft' ? 'var(--text-secondary)' : 'var(--accent-secondary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                    {row.status === 'Running' ? 'Active' : row.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{row.channels || 'Email'}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.status === 'Draft' ? '-' : actualSent.toLocaleString()}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.status === 'Draft' ? '-' : openRate}</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.status === 'Draft' ? '-' : ctr}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-secondary)' }}>{row.status === 'Draft' ? '-' : revenue}</td>
                <td style={{ padding: '16px 24px', position: 'relative' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === row.id ? null : row.id); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {openMenuId === row.id && (
                    <div style={{ position: 'absolute', right: '40px', top: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', border: '1px solid var(--border-subtle)', width: '120px', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenMenuId(null);
                        axios.get(`${API_URL}/campaigns/${row.id}`).then(res => {
                          setSelectedCampaignForDetails(generateRichCampaignData({...row, ...res.data}, actualSent));
                        }).catch(err => {
                          console.error("Failed to load campaign details:", err);
                          setSelectedCampaignForDetails(generateRichCampaignData(row, actualSent));
                        });
                      }} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }} className="table-row-hover">Details</button>
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row.id, row.status === 'Running' ? 'Paused' : 'Running'); }} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }} className="table-row-hover">{row.status === 'Running' ? 'Pause' : 'Resume'}</button>
                      <div style={{ height: '1px', background: 'var(--border-subtle)' }}></div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(row.id); }} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: 'var(--accent-danger)' }} className="table-row-hover">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Campaign Details Modal (Campaign Analytics Center) */}
      {selectedCampaignForDetails && (<ErrorBoundary>
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setSelectedCampaignForDetails(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          
          <div className="card" style={{ position: 'relative', width: '1100px', maxHeight: '92vh', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out', zIndex: 201, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            
            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                  {selectedCampaignForDetails.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, background: selectedCampaignForDetails.status === 'Running' ? 'rgba(36, 138, 88, 0.1)' : 'var(--bg-secondary)', color: selectedCampaignForDetails.status === 'Running' ? 'var(--accent-secondary)' : 'var(--text-secondary)', padding: '4px 10px', borderRadius: '12px' }}>
                    Status: {selectedCampaignForDetails.status === 'Running' ? 'Active 🟢' : selectedCampaignForDetails.status}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong>Channel:</strong> {selectedCampaignForDetails.channels || 'WhatsApp'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong>Audience:</strong> {selectedCampaignForDetails.audience || 'No Audience'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong>Template:</strong> {(selectedCampaignForDetails.name || '').includes('Win-back') || (selectedCampaignForDetails.name || '').includes('VIP') ? 'WINBACK_20_OFF' : 'REPLENISH_FREE_SHIPPING'}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCampaignForDetails(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', gap: '32px' }}>
              
              {/* Left Column (65%) */}
              <div style={{ flex: 1.8, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* KPI Cards Grid */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Campaign Performance Metrics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Audience Size</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{(selectedCampaignForDetails.reach || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Messages Sent</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{(selectedCampaignForDetails.reach || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Delivered</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{(selectedCampaignForDetails.delivered || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Opened</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{(selectedCampaignForDetails.opened || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Clicked</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{(selectedCampaignForDetails.click_count || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Purchased</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{(selectedCampaignForDetails.purchased || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(36, 138, 88, 0.05)', borderRadius: '8px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Revenue</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{(selectedCampaignForDetails.revenue || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(36, 138, 88, 0.05)', borderRadius: '8px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>ROI</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-secondary)' }}>4.2x</div>
                    </div>
                  </div>
                </div>

                {/* Funnel Visualization */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Funnel Visualization</h3>
                  <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    {[
                      { stage: 'Targeted', count: selectedCampaignForDetails.reach || 0, label: 'Customers Selected' },
                      { stage: 'Delivered', count: selectedCampaignForDetails.delivered || 0, label: 'Successfully Received' },
                      { stage: 'Opened', count: selectedCampaignForDetails.opened || 0, label: 'Read Messages' },
                      { stage: 'Clicked', count: selectedCampaignForDetails.click_count || 0, label: 'Clicked CTA Link' },
                      { stage: 'Purchased', count: selectedCampaignForDetails.purchased || 0, label: 'Completed Purchases' },
                      { stage: 'Revenue', count: `₹${(selectedCampaignForDetails.revenue || 0).toLocaleString()}`, label: 'Total Sales Generated' }
                    ].map((step, idx, arr) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{ 
                          width: '100%', 
                          maxWidth: `${550 - idx * 40}px`, 
                          background: idx === arr.length - 1 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.02))' : 'rgba(255,255,255,0.01)',
                          border: `1px solid ${idx === arr.length - 1 ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
                          borderRadius: '8px', 
                          padding: '10px 20px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: idx === arr.length - 1 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{step.stage}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({step.label})</span>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: idx === arr.length - 1 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                            {step.count}
                          </div>
                        </div>
                        {idx < arr.length - 1 && (
                          <div style={{ margin: '2px 0', color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 'bold' }}>↓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>



                {/* Audience Demographics & Risk */}
                {aiInsights && !aiInsights.error && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Risk Breakdown */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Churn Risk</h3>
                      <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {['High', 'Medium', 'Low'].map(risk => {
                          const count = aiInsights.risk_breakdown?.[risk] || 0;
                          const total = Object.values(aiInsights.risk_breakdown || {}).reduce((a:any,b:any)=>a+b, 0) || 1;
                          const perc = Math.round((Number(count) / Number(total)) * 100);
                          const color = risk === 'High' ? '#ef4444' : risk === 'Medium' ? '#f59e0b' : 'var(--accent-secondary)';
                          return (
                            <div key={risk}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{risk} Risk</span>
                                <span style={{ color }}>{perc}%</span>
                              </div>
                              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: color, width: `${perc}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {/* Top Cities */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Top Locations</h3>
                      <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(aiInsights.top_cities || []).map((cityObj: any, idx: number) => {
                          const perc = Math.round((cityObj.count / Number(selectedCampaignForDetails.customer_count || 1)) * 100) || 10;
                          return (
                            <div key={idx}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{cityObj.city}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{cityObj.count}</span>
                              </div>
                              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'var(--accent-primary)', width: `${perc}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sampled Audience Members */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Sampled Audience Members</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                            <th style={{ padding: '10px 16px' }}>Customer</th>
                            <th style={{ padding: '10px 16px' }}>LTV</th>
                            <th style={{ padding: '10px 16px' }}>Last Order</th>
                            <th style={{ padding: '10px 16px' }}>Risk</th>
                            <th style={{ padding: '10px 16px', width: '35%' }}>Included Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedCampaignForDetails.audience_members || []).map((rec: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '10px 16px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.name}</div>
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{rec.ltv?.toLocaleString()}</div>
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                <div style={{ color: 'var(--text-secondary)' }}>{rec.last_order ? `${rec.last_order}d ago` : 'Never'}</div>
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                <span style={{ 
                                  fontSize: '11px', 
                                  padding: '3px 8px', 
                                  borderRadius: '6px', 
                                  fontWeight: 600,
                                  background: rec.risk === 'High' ? 'rgba(239,68,68,0.1)' : rec.risk === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                  color: rec.risk === 'High' ? '#ef4444' : rec.risk === 'Medium' ? '#f59e0b' : 'var(--accent-secondary)'
                                }}>
                                  {rec.risk}
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px', whiteSpace: 'pre-wrap', lineHeight: '1.4', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {rec.reason}
                              </td>
                            </tr>
                          ))}
                          {(!selectedCampaignForDetails.audience_members || selectedCampaignForDetails.audience_members.length === 0) && (
                            <tr>
                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No audience data available yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>


                  </div>
                </div>

              </div>

              {/* Right Column (35%) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* AI Analysis (Insights) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Sparkles size={16} color="var(--accent-secondary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AI Insights</h3>
                  </div>
                  <div style={{ background: 'rgba(36, 138, 88, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(36, 138, 88, 0.2)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {loadingInsights ? (
                       <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Generating AI Insights...</div>
                    ) : aiInsights?.error ? (
                       <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>AI insights unavailable</div>
                    ) : (aiInsights?.insights || []).map((insight: string, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ color: 'var(--accent-secondary)', fontWeight: 800, fontSize: '14px', marginTop: '-2px' }}>✓</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{insight}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Sparkles size={16} color="var(--accent-secondary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AI Recommendations</h3>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loadingInsights ? (
                       <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Generating recommendations...</div>
                    ) : aiInsights?.error ? (
                       <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>AI insights unavailable</div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Campaign Strategy</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{aiInsights?.recommendations?.campaign || 'None'}</span>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Channel Optimization</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{aiInsights?.recommendations?.channel || 'None'}</span>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Audience Targeting</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{aiInsights?.recommendations?.audience || 'None'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Suggestion Box */}
                <div style={{ 
                  background: 'rgba(36, 138, 88, 0.05)', 
                  border: '1px solid rgba(36, 138, 88, 0.2)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  justifyContent: 'space-between'
                }}>
                  {loadingInsights ? (
                     <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Generating AI Insights...</div>
                  ) : aiInsights?.error ? (
                     <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>AI insights unavailable</div>
                  ) : (
                    <>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>
                          <Sparkles size={14} /> Follow-Up Recommendation
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '8px', lineHeight: '1.4' }}>
                          {aiInsights?.recommendations?.follow_up?.suggested_action || aiInsights?.next_best_action || 'No action suggested'}
                        </div>
                        {aiInsights?.recommendations?.follow_up?.reasoning && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {aiInsights.recommendations.follow_up.reasoning}
                            </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(139, 92, 246, 0.15)', paddingTop: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expected Recovery</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-secondary)' }}>{aiInsights?.recommendations?.follow_up?.expected_recovery || aiInsights?.expected_recovery || '-'}</div>
                        </div>
                        <button 
                          onClick={() => setReminderCampaignSent(true)} 
                          disabled={reminderCampaignSent}
                          className="btn btn-primary" 
                          style={{ background: 'var(--accent-secondary)', border: 'none', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}
                        >
                          {reminderCampaignSent ? '✓ Drafted' : 'One-Click Generate'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Message Preview (WhatsApp / Email style) */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                    Message Preview ({selectedCampaignForDetails.channels || 'WhatsApp'})
                  </h3>
                  {selectedCampaignForDetails.channels === 'Email' ? (
                    /* Email Client Mock */
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          <span style={{ fontWeight: 600 }}>Subject:</span> {selectedCampaignForDetails.subject || 'We Miss You ❤️'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          <span style={{ fontWeight: 600 }}>From:</span> EngageX CRM &lt;marketing@brand.in&gt;
                        </div>
                      </div>
                      <div style={{ padding: '20px', background: 'white', color: '#334155', minHeight: '180px', fontSize: '13px', lineHeight: '1.5' }}>
                        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui' }}>
                          {selectedCampaignForDetails.message ? (
                            selectedCampaignForDetails.message.includes('<html') || selectedCampaignForDetails.message.includes('<body') || selectedCampaignForDetails.message.includes('<div') ? (
                              <div dangerouslySetInnerHTML={{ __html: selectedCampaignForDetails.message }} />
                            ) : (
                              selectedCampaignForDetails.message
                            )
                          ) : `Hi {{name}},\n\nWe've missed you!\n\nUse code: WELCOME20\n\nGet 20% off on your next order.`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* WhatsApp Chat Bubble Mock */
                    <div style={{ background: '#efeae2', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden', padding: '16px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                      <div style={{ 
                        background: 'white', 
                        color: '#111b21', 
                        borderRadius: '8px', 
                        padding: '12px', 
                        maxWidth: '85%', 
                        fontSize: '13px', 
                        lineHeight: '1.4', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        position: 'relative'
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui' }}>
                          {selectedCampaignForDetails.message ? (
                            selectedCampaignForDetails.message.includes('<html') || selectedCampaignForDetails.message.includes('<body') || selectedCampaignForDetails.message.includes('<div') ? (
                              <div dangerouslySetInnerHTML={{ __html: selectedCampaignForDetails.message }} />
                            ) : (
                              selectedCampaignForDetails.message
                            )
                          ) : `Hi {{name}},\n\nWe've missed you!\n\nUse code:\n*VIP20*\n\nGet 20% off on your next order.`}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '9px', color: '#667781', marginTop: '4px' }}>
                          10:05 AM
                        </div>
                      </div>
                    </div>
                  )}
                </div>



              </div>

            </div>

            {/* Footer Actions */}
            <div style={{ padding: '24px 32px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => { handleUpdateStatus(selectedCampaignForDetails.id, selectedCampaignForDetails.status === 'Running' ? 'Paused' : 'Running'); setSelectedCampaignForDetails(null); }}
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {selectedCampaignForDetails.status === 'Running' ? <Pause size={16} /> : <Play size={16} />}
                  {selectedCampaignForDetails.status === 'Running' ? 'Pause Campaign' : 'Resume Campaign'}
                </button>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Copy size={16} /> Duplicate
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => console.log('Exporting...', selectedCampaignForDetails)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Export Report
                </button>
              </div>
              <button className="btn btn-primary" onClick={() => setSelectedCampaignForDetails(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
        </ErrorBoundary>
      )}

      {/* Customer Campaign Timeline Modal Overlay */}
      {selectedRecipientForTimeline && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setSelectedRecipientForTimeline(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} />
          
          <div className="card" style={{ position: 'relative', width: '400px', padding: '24px', zIndex: 301, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', borderRadius: '12px' }}>
            <button onClick={() => setSelectedRecipientForTimeline(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '4px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedRecipientForTimeline.name}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {selectedRecipientForTimeline.email}
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '16px', letterSpacing: '0.5px' }}>
              Campaign Timeline
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical timeline bar */}
              <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-subtle)' }} />
              
              {/* Step 1: Sent */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Message Sent</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>10:05 AM</span>
                </div>
              </div>

              {/* Step 2: Delivered */}
              {selectedRecipientForTimeline.delivered && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-secondary)', border: '2px solid var(--bg-primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Delivered</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>10:06 AM</span>
                  </div>
                </div>
              )}

              {/* Step 3: Opened */}
              {selectedRecipientForTimeline.opened && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-secondary)', border: '2px solid var(--bg-primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Opened</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>10:15 AM</span>
                  </div>
                </div>
              )}

              {/* Step 4: Clicked Offer */}
              {selectedRecipientForTimeline.clicked && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', border: '2px solid var(--bg-primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Clicked Offer</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>10:18 AM</span>
                  </div>
                </div>
              )}

              {/* Step 5: Purchased */}
              {selectedRecipientForTimeline.purchased && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-secondary)', border: '2px solid var(--bg-primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Purchased</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>10:30 AM</span>
                  </div>
                </div>
              )}
            </div>
            
            {selectedRecipientForTimeline.purchased && (
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Revenue Generated</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                  ₹{selectedRecipientForTimeline.revenue.toLocaleString()}
                </span>
              </div>
            )}
            
            <button 
              onClick={() => setSelectedRecipientForTimeline(null)} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
