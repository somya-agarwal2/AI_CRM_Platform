import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Users, Search, Filter, ChevronRight, ChevronLeft, Activity, Zap,
  AlertTriangle, DollarSign, TrendingDown, X, PlayCircle,
  CheckCircle2, Sparkles, GitBranch, MessageCircle, Mail,
  Clock, ArrowRight, Target, Star, ShoppingBag, Heart, PlusCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import API_URL from '../config';

// ─────────────────────────────────────────────────────────────────────────────
// Personalisation Engine
// ─────────────────────────────────────────────────────────────────────────────

interface Personalisation {
  type: 'winback' | 'vip' | 'crosssell' | 'nurture';
  buttonLabel: string;
  action: string;
  channel: string;
  channelIcon: React.ComponentType<any>;
  accentColor: string;
  accentBg: string;
  expectedRevenue: string;
  successProbability: number;
  reasons: string[];
  alternatives: { label: string; revenue: string; channel: string }[];
  offerType: string;
  discountCode: string;
  expiryDays: number;
  message: string;
}

function getPersonalisation(customer: any): Personalisation | null {
  if (!customer.ai_recommendation) return null;

  try {
    const ai = typeof customer.ai_recommendation === 'string' ? JSON.parse(customer.ai_recommendation) : customer.ai_recommendation;
    const churnScore = ai.churn_analysis?.score || 0;
    
    let type: any = 'nurture';
    let buttonLabel = ai.next_best_action?.action || 'Send Offer';
    let accentColor = 'var(--accent-secondary)';
    let accentBg = 'rgba(16,185,129,0.1)';
    
    if (churnScore > 0.7) {
      type = 'winback';
      accentColor = '#ef4444';
      accentBg = 'rgba(239,68,68,0.1)';
    } else if (churnScore > 0.4) {
      type = 'crosssell';
      accentColor = '#f59e0b';
      accentBg = 'rgba(245,158,11,0.1)';
    } else {
      type = 'vip';
      accentColor = 'var(--accent-secondary)';
      accentBg = 'rgba(59,130,246,0.1)';
    }

    // Force override buttonLabel if AI didn't provide a good one
    if (buttonLabel === 'Send Offer') {
      if (churnScore > 0.7) buttonLabel = 'Recover Customer';
      else if (churnScore > 0.4) buttonLabel = 'Recommend Product';
      else buttonLabel = 'Send VIP Offer';
    }

    let channel = ai.next_best_action?.channel || 'Email';
    let channelIcon = Mail;
    if (channel.toLowerCase().includes('whatsapp')) channelIcon = MessageCircle;
    if (channel.toLowerCase().includes('sms')) channelIcon = MessageCircle;

    return {
      type,
      buttonLabel,
      action: ai.next_best_action?.action || 'Recommended Action',
      channel,
      channelIcon,
      accentColor,
      accentBg,
      expectedRevenue: ai.expected_business_impact || '$0',
      successProbability: ai.confidence_score || 75,
      offerType: ai.campaign_recommendation || 'Special Offer',
      discountCode: `AI-${customer.id}`,
      expiryDays: 7,
      message: ai.message_copy || `Hi ${customer.first_name}, here is a special offer just for you! Use code AI-${customer.id} at https://store.com/shop. We hope to see you back soon!`,
      reasons: ai.reasoning ? [ai.reasoning] : ['AI generated insight'],
      alternatives: [
        { label: 'Alternative Channel', revenue: 'Varies', channel: 'SMS' },
        { label: 'No Action', revenue: '$0', channel: '—' },
      ]
    };
  } catch (e) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery lifecycle
// ─────────────────────────────────────────────────────────────────────────────

interface DeliveryStatus {
  sent: boolean;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  purchased: boolean;
  redeemed: boolean;
  channel: string;
  action: string;
  sentAt: string; // ISO string
}

const LIFECYCLE_STAGES: { key: keyof DeliveryStatus; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'opened', label: 'Opened' },
  { key: 'clicked', label: 'Clicked' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'redeemed', label: 'Redeemed' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CustomerIntelligence = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({ total_customers: 0, high_risk: 0, avg_ltv: 0, revenue_at_risk: 0 });
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 25;
  const navigate = useNavigate();

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeAction, setActiveAction] = useState<any>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [executingAction, setExecutingAction] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [generatingMessage, setGeneratingMessage] = useState(false);
  
  const [attachedJourney, setAttachedJourney] = useState<any>(null);
  const [showAttachModal, setShowAttachModal] = useState(false);
  
  const [customerJourneys, setCustomerJourneys] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('crm_customerJourneys');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('crm_customerJourneys', JSON.stringify(customerJourneys));
  }, [customerJourneys]);

  const [existingJourneys, setExistingJourneys] = useState<any[]>([]);

  // Live delivery status from backend (replaces localStorage approach)
  const [liveStatus, setLiveStatus] = React.useState<any>(null);
  const [rowStatuses, setRowStatuses] = React.useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('crm_rowStatuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('crm_rowStatuses', JSON.stringify(rowStatuses));
  }, [rowStatuses]);

  const pollingRef = React.useRef<any>(null);

  const stopPollingDelivery = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPollingDelivery = (customerId: string) => {
    stopPollingDelivery();
    const poll = async () => {
      try {
        const res = await axios.get(`${API_URL}/customers/${customerId}/delivery-status`);
        if (res.data?.status) {
          setLiveStatus(res.data);
          setRowStatuses(prev => ({ ...prev, [customerId]: res.data }));
        }
      } catch (e) {
        // silently ignore
      }
    };
    poll();
    pollingRef.current = setInterval(poll, 2000);
  };

  // Cleanup polling when panel closes
  useEffect(() => {
    if (!panelOpen) {
      stopPollingDelivery();
    }
  }, [panelOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPollingDelivery();
  }, []);

  // Track which customer we're showing "progress" for in the panel
  const [panelMode, setPanelMode] = useState<'recommend' | 'progress'>('recommend');

  const fetchJourneysList = async () => {
    try {
      const res = await axios.get(`${API_URL}/campaigns/`);
      const drafts = JSON.parse(localStorage.getItem('journey_drafts') || '[]');
      const active = JSON.parse(localStorage.getItem('journey_active') || '[]');
      const templates = JSON.parse(localStorage.getItem('journey_templates') || '[]');
      setExistingJourneys([...drafts, ...active, ...templates, ...(Array.isArray(res.data) ? res.data : [])]);
    } catch (e) {
      const drafts = JSON.parse(localStorage.getItem('journey_drafts') || '[]');
      const active = JSON.parse(localStorage.getItem('journey_active') || '[]');
      const templates = JSON.parse(localStorage.getItem('journey_templates') || '[]');
      setExistingJourneys([...drafts, ...active, ...templates]);
    }
  };

  const fetchCustomers = async (filter: string) => {
    try {
      const res = await axios.get(`${API_URL}/customers?filter=${filter}&limit=1000`);
      setCustomers(res.data.customers);
      if (res.data.kpis) setKpis(res.data.kpis);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomers(activeFilter);
    setCurrentPage(1);
    fetchJourneysList();
  }, [activeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const openPanel = (e: React.MouseEvent, customer: any, mode: 'recommend' | 'progress' = 'recommend') => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    const p = getPersonalisation(customer);
    if (!p) return;
    setActiveAction(p);
    setEditedMessage(p.message);
    setPanelMode(mode);
    setPanelOpen(true);
    setPanelLoading(false);
    setActionFeedback(null);
    setLiveStatus(null);
    // Always fetch latest delivery status from DB
    axios.get(`${API_URL}/customers/${customer.id}/delivery-status`)
      .then(res => {
        if (res.data?.status) {
          setLiveStatus(res.data);
          if (res.data.sent && mode === 'progress') {
            startPollingDelivery(customer.id);
          }
        }
      })
      .catch(() => {});
  };

  const executeAction = async () => {
    if (!selectedCustomer || !activeAction) return;
    const p = activeAction;
    setExecutingAction(true);
    try {
      await axios.post(`${API_URL}/customers/${selectedCustomer.id}/action`, {
        action_type: p.action,
        channel: p.channel,
        expected_recovery: p.expectedRevenue,
        message: editedMessage
      });

      setActionFeedback({ message: `${p.action} sent via ${p.channel}!`, type: 'success' });
      setPanelMode('progress');
      setLiveStatus({ sent: true, delivered: false, opened: false, clicked: false, purchased: false, redeemed: false, channel: p.channel, sentAt: new Date().toISOString() });
      startPollingDelivery(selectedCustomer.id);
      fetchCustomers(activeFilter);
    } catch {
      setActionFeedback({ message: 'Failed to send action. Please try again.', type: 'error' });
    } finally {
      setExecutingAction(false);
    }
  };

  const createJourney = async () => {
    if (!selectedCustomer || !activeAction) return;
    const p = activeAction;
    try {
      const campRes = await axios.post(`${API_URL}/campaigns`, {
        name: `1-to-1 Journey for ${selectedCustomer.first_name}`,
        customer_id: selectedCustomer.id,
        type: 'personal',
        channels: p.channel,
      });
      const res = await axios.post(`${API_URL}/journeys`, {
        name: `${selectedCustomer.first_name} — ${p.action}`,
        campaign_id: campRes.data.id,
      });
      navigate(`/journeys/${res.data.id}`);
    } catch {
      setActionFeedback({ message: 'Failed to create journey.', type: 'error' });
    }
  };

  // ─── Pagination ────────────────────────────────────────────────────────────

  const filteredCustomers = useMemo(() => customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.first_name && c.first_name.toLowerCase().includes(q)) ||
      (c.last_name && c.last_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }), [customers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (safeCurrentPage - 1) * PER_PAGE,
    safeCurrentPage * PER_PAGE
  );
  const startIndex = (safeCurrentPage - 1) * PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * PER_PAGE, filteredCustomers.length);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      for (let i = Math.max(2, safeCurrentPage - 1); i <= Math.min(totalPages - 1, safeCurrentPage + 1); i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // ─── Panel rendering ───────────────────────────────────────────────────────

  const renderPanel = () => {
    if (!selectedCustomer || !activeAction) return null;
    const p = activeAction;
    const ds = liveStatus;
    const churnScore = selectedCustomer.churn_score || 0;
    const churnColor = churnScore > 0.7 ? '#ef4444' : churnScore > 0.4 ? '#f59e0b' : 'var(--accent-secondary)';
    const ChIcon = p.channelIcon;

    const sentAt = ds?.sentAt ? new Date(ds.sentAt) : null;

    const enrolledJourneyId = customerJourneys[selectedCustomer.id];
    const enrolledJourney = enrolledJourneyId ? existingJourneys.find(j => j.id === enrolledJourneyId) : null;

    return (
      <>
        {/* Backdrop & Modal Container */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setPanelOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />

          {/* Modal */}
          <div style={{
            position: 'relative', width: '850px', maxHeight: '90vh',
            background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflowY: 'auto',
            animation: 'fadeIn 0.2s ease-out'
          }}>
          {/* ── Header ── */}
          <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${p.accentColor}30, ${p.accentColor}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${p.accentColor}30` }}>
                  <Sparkles size={20} color={p.accentColor} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Action Panel</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </div>
                </div>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

          {/* Quick stats */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[
                { label: 'Churn Risk', value: `${(churnScore * 100).toFixed(0)}%`, color: churnColor },
                { label: 'LTV', value: `₹${selectedCustomer.total_spent?.toLocaleString()}`, color: 'var(--accent-secondary)' },
                { label: 'Orders', value: `${selectedCustomer.order_count}`, color: 'var(--accent-secondary)' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {panelMode === 'recommend' && (
            <div style={{ padding: '24px 28px', display: 'flex', gap: 28, flex: 1 }}>
              
              {/* Left Panel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Why block */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Why this customer needs attention</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {p.reasons.map((reason: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.accentColor, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{reason}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternative actions */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Alternative Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {p.alternatives.map((alt: any, i: number) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          if (alt.revenue === 0) return;
                          
                          const newActive = {
                            ...p,
                            action: alt.label,
                            channel: alt.channel,
                            expectedRevenue: alt.revenue,
                            successProbability: Math.max(30, p.successProbability - 5 - (i * 2)),
                            buttonLabel: alt.label.split(' ')[0] + ' Customer'
                          };
                          
                          const newAlts = [...p.alternatives];
                          newAlts[i] = { label: p.action, revenue: p.expectedRevenue, channel: p.channel };
                          newActive.alternatives = newAlts;
                          
                          setActiveAction(newActive);
                          setEditedMessage(newActive.message.replace(/WhatsApp|Email|SMS/gi, alt.channel));
                        }}
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, 
                          border: '1px solid var(--border-subtle)',
                          cursor: alt.revenue === 0 ? 'default' : 'pointer'
                        }}
                        className={alt.revenue !== 0 ? "table-row-hover" : ""}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: alt.revenue === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{alt.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>via {alt.channel}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: alt.revenue === 0 ? 'var(--text-secondary)' : 'var(--accent-secondary)' }}>
                            {alt.revenue === 0 ? '—' : `₹${alt.revenue}`}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>expected</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Recommended Action block */}
                <div style={{ padding: '12px 16px', background: `linear-gradient(135deg, ${p.accentBg}, rgba(255,255,255,0.02))`, border: `1px solid ${p.accentColor}30`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: p.accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended Action</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{p.action}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { label: 'Offer', value: p.offerType },
                      { label: 'Code', value: p.discountCode, color: p.accentColor, isCode: true },
                      { label: 'Expiry', value: `${p.expiryDays} Days` },
                      { label: 'Channel', value: p.channel, isSelect: true },
                    ].map(m => (
                      <div key={m.label} style={{ minWidth: '80px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
                        {m.isSelect ? (
                          <select 
                            value={p.channel}
                            onChange={(e) => {
                              setActiveAction({ ...p, channel: e.target.value });
                              setEditedMessage(p.message.replace(/WhatsApp|Email|SMS/g, e.target.value));
                            }}
                            style={{
                              fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                              background: 'transparent', border: '1px solid var(--border-subtle)',
                              borderRadius: 4, padding: '2px 4px', outline: 'none', cursor: 'pointer',
                              marginLeft: '-4px'
                            }}
                          >
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Email">Email</option>
                            <option value="SMS">SMS</option>
                          </select>
                        ) : (
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 700, 
                            color: m.color || 'var(--text-primary)',
                            fontFamily: m.isCode ? 'monospace' : 'inherit',
                            background: m.isCode ? 'rgba(0,0,0,0.2)' : 'transparent',
                            padding: m.isCode ? '2px 6px' : 0,
                            borderRadius: m.isCode ? 4 : 0,
                            display: 'inline-block'
                          }}>
                            {m.value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 20, borderTop: `1px solid ${p.accentColor}20`, paddingTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Est. Revenue</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{p.expectedRevenue}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Success Prob.</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-secondary)' }}>{p.successProbability}%</div>
                    </div>
                  </div>
                </div>

                {/* Message Preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Generated Message</div>
                    <button 
                      onClick={async () => {
                        setGeneratingMessage(true);
                        try {
                          const res = await axios.post(`${API_URL}/ai/campaign/generate`, {
                            prompt: `Write a highly personalized ${p.channel} message for ${selectedCustomer.first_name}. Reason: ${p.reasons.join(', ')}. Offer: ${p.offerType}. Code: ${p.discountCode}. Limit to 4 sentences and sound friendly.`
                          });
                          if (res.data?.body) {
                            setEditedMessage(res.data.body);
                          }
                        } catch (e: any) {
                          console.error(e);
                          const errorMsg = e.response?.data?.error || "AI service is currently unavailable. Please try again later.";
                          alert(`Regeneration failed: ${errorMsg}`);
                        } finally {
                          setGeneratingMessage(false);
                        }
                      }}
                      disabled={generatingMessage}
                      style={{ padding: '4px 10px', background: 'rgba(36,138,88,0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(36,138,88,0.2)', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: generatingMessage ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {generatingMessage ? <span className="spinner" style={{ width: 10, height: 10, border: '2px solid rgba(36,138,88,0.3)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
                      {generatingMessage ? 'Generating...' : 'AI Re-generate'}
                    </button>
                  </div>
                  <textarea 
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    style={{ width: '100%', flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, resize: 'none', minHeight: '200px', outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>


                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                  <button onClick={executeAction} disabled={executingAction} className="btn btn-primary"
                    style={{ flex: ds ? 1 : 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700, opacity: executingAction ? 0.7 : 1 }}>
                    {executingAction ? '⏳ Processing…' : <><PlayCircle size={16} /> {p.buttonLabel}</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PROGRESS MODE ── */}
          {panelMode === 'progress' && ds && (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

              {/* Campaign info card */}
              <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>Campaign Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Campaign Name:</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>VIP Recovery - {selectedCustomer.first_name} {selectedCustomer.last_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Channel:</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ds.channel || p.channel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Generated By:</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Gemini AI</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Message:</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{editedMessage}</div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Status Timeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { key: 'created', label: 'Campaign Created', done: true },
                    { key: 'queued', label: 'Queued For Delivery', done: true },
                    { key: 'sent', label: 'Sent', done: ds.sent },
                    { key: 'delivered', label: 'Delivered', done: ds.delivered },
                    { key: 'opened', label: 'Opened', done: ds.opened },
                    { key: 'clicked', label: 'Clicked', done: ds.clicked },
                    { key: 'purchased', label: 'Purchased', done: ds.purchased },
                  ].map((stage, idx, arr) => {
                    const done = stage.done as boolean;
                    const isActive = !done && (idx === 0 || arr[idx - 1].done);
                    const isLast = idx === arr.length - 1;
                    return (
                      <div key={stage.key} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Dot + line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: done ? 'var(--accent-secondary)' : isActive ? 'rgba(36,138,88,0.1)' : 'rgba(255,255,255,0.06)',
                            border: `2px solid ${done ? 'var(--accent-secondary)' : isActive ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.12)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.4s ease'
                          }}>
                            {done
                              ? <CheckCircle2 size={14} color="white" />
                              : isActive
                                ? <span style={{ fontSize: 12 }}>⏳</span>
                                : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                            }
                          </div>
                          {!isLast && <div style={{ width: 2, height: 28, background: done ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.08)', transition: 'all 0.4s ease' }} />}
                        </div>
                        {/* Label */}
                        <div style={{ paddingBottom: isLast ? 0 : 16, paddingTop: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: done ? 700 : isActive ? 600 : 400, color: done ? 'var(--text-primary)' : isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
                            {stage.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue Recovered */}
              <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', marginBottom: 3 }}>Revenue Recovered</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {ds.purchased ? `₹${Math.round(p.expectedRevenue * 0.85)}` : '₹0'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Target</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>₹{p.expectedRevenue}</div>
                </div>
              </div>

              {/* Navigate to full profile */}
              <button onClick={() => navigate(`/customers/${selectedCustomer.id}`)} className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <Users size={15} /> Open Full Customer Profile
              </button>
            </div>
          )}

          {/* Attach Journey Modal */}
          {showAttachModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 480, background: 'var(--bg-primary)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Choose Journey</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Select a journey to attach to this customer.</div>
                  </div>
                  <button onClick={() => setShowAttachModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
                  {existingJourneys.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No journeys available.</div>
                  )}
                  {existingJourneys.map((j: any) => (
                    <div 
                      key={j.id || j.name}
                      onClick={() => {
                        setAttachedJourney(j);
                        setShowAttachModal(false);
                      }}
                      style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: attachedJourney?.id === j.id ? 'rgba(99,102,241,0.05)' : 'transparent', borderColor: attachedJourney?.id === j.id ? 'var(--accent-primary)' : 'var(--border-subtle)' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GitBranch size={20} color="var(--accent-primary)" /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{j.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{j.nodes?.length || 0} steps</div>
                      </div>
                      {attachedJourney?.id === j.id && <CheckCircle2 size={20} color="var(--accent-secondary)" />}
                    </div>
                  ))}
                  
                  <button onClick={() => navigate('/journeys/build')} style={{ marginTop: 12, padding: 16, borderRadius: 10, border: '1px dashed var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: 'transparent' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={20} color="var(--text-secondary)" /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>Create New Journey</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Build from scratch</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      </>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="var(--accent-secondary)" /> Customer Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            AI-powered actions, personalised per customer, with full lifecycle tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Customers', value: kpis.total_customers.toLocaleString(), icon: Users, color: 'var(--accent-secondary)' },
          { label: 'High Risk', value: kpis.high_risk.toLocaleString(), icon: AlertTriangle, color: '#ef4444' },
          { label: 'Avg LTV', value: `₹${kpis.avg_ltv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'var(--accent-secondary)' },
          { label: 'Revenue at Risk', value: `₹${kpis.revenue_at_risk.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingDown, color: '#f59e0b' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: kpi.color, fontSize: '13px', fontWeight: 600 }}>
                <Icon size={16} /> {kpi.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { id: '', label: 'All Customers' },
          { id: 'high_risk', label: '🔴 High Risk' },
          { id: 'vip', label: '⭐ VIP Customers' },
          { id: 'inactive', label: '💤 Inactive 60+ Days' },
          { id: 'high_ltv', label: '💰 High LTV' },
          { id: 'recent', label: '🕒 Recent Buyers' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`btn ${activeFilter === filter.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '13px' }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', width: '280px' }}>
              <Search size={16} style={{ color: 'var(--text-tertiary)', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search customers…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredCustomers.length === 0 ? 0 : startIndex}–{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{filteredCustomers.length}</strong>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/audiences/create')}>
            <Filter size={16} /> Advanced Filters
          </button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Customer</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>LTV</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Churn Risk</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>Last Activity</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}>AI Recommendation</th>
              <th style={{ padding: '12px 24px', fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map(c => {
              const churnScore = c.churn_score || 0;
              const churnPercent = (churnScore * 100).toFixed(0);
              const churnColor = churnScore > 0.7 ? '#ef4444' : churnScore > 0.4 ? '#f59e0b' : 'var(--accent-secondary)';
              const churnLevel = churnScore > 0.7 ? 'High' : churnScore > 0.4 ? 'Medium' : 'Low';
              const p = getPersonalisation(c);
              const ds = (selectedCustomer?.id === c.id && liveStatus) ? liveStatus : null;

              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: '0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Customer */}
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{c.email}</div>
                  </td>

                  {/* LTV */}
                  <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{c.total_spent?.toLocaleString()}
                  </td>

                  {/* Churn Risk */}
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: churnColor, fontWeight: 600, fontSize: 12 }}>
                      <Activity size={13} /> Risk: {churnLevel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {churnPercent}% churn probability
                    </div>
                  </td>

                  {/* Last Activity */}
                  <td style={{ padding: '14px 24px', color: 'var(--text-secondary)', fontSize: 12 }}>
                    {c.last_purchase_date
                      ? formatDistanceToNow(new Date(c.last_purchase_date), { addSuffix: true })
                      : 'Never'}
                  </td>

                  {/* AI Recommendation column */}
                  <td style={{ padding: '14px 24px' }} onClick={e => e.stopPropagation()}>
                    {p ? (
                      rowStatuses[c.id] ? (
                        /* ── Live Status block ── */
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Activity size={12} /> Recovery Active
                          </div>
                          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-primary)', marginBottom: 8, flexWrap: 'wrap' }}>
                            {rowStatuses[c.id].sent && <span>Sent ✓</span>}
                            {rowStatuses[c.id].delivered && <span>Delivered ✓</span>}
                            {rowStatuses[c.id].opened && <span>Opened ✓</span>}
                          </div>
                          <div 
                            onClick={e => openPanel(e, c, 'progress')}
                            style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            View Timeline <ArrowRight size={10} />
                          </div>
                        </div>
                      ) : (
                        /* ── Pre-action: personalised recommendation ── */
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: p.accentColor, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={10} /> {p.action}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 7 }}>
                            Est. {p.expectedRevenue} · {p.successProbability}% success
                          </div>
                          <button
                            onClick={e => openPanel(e, c, 'recommend')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              color: p.accentColor, fontSize: 12, fontWeight: 700,
                              background: p.accentBg, padding: '5px 12px',
                              borderRadius: 6, border: `1px solid ${p.accentColor}30`,
                              cursor: 'pointer', transition: '0.15s',
                            }}
                          >
                            <Zap size={11} /> Launch {p.action}
                          </button>
                        </div>
                      )
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Pending AI Analysis (est. 1-2 mins)</div>
                    )}
                  </td>

                  {/* Arrow */}
                  <td style={{ padding: '14px 24px', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                    <ChevronRight size={16} />
                  </td>
                </tr>
              );
            })}

            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No customers found matching these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page <strong style={{ color: 'var(--text-primary)' }}>{safeCurrentPage}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', color: safeCurrentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={15} />
              </button>
              {getPageNumbers().map((pg, idx) =>
                pg === '...' ? (
                  <span key={`e-${idx}`} style={{ padding: '0 6px', color: 'var(--text-secondary)', fontSize: 13 }}>…</span>
                ) : (
                  <button key={pg} onClick={() => setCurrentPage(pg as number)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: safeCurrentPage === pg ? 'none' : '1px solid var(--border-subtle)', background: safeCurrentPage === pg ? 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' : 'transparent', color: safeCurrentPage === pg ? 'white' : 'var(--text-primary)', fontWeight: safeCurrentPage === pg ? 700 : 400, fontSize: 13, cursor: 'pointer', boxShadow: safeCurrentPage === pg ? '0 2px 8px rgba(30,58,44,0.4)' : 'none' }}>
                    {pg}
                  </button>
                )
              )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', color: safeCurrentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={15} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {filteredCustomers.length} total customers
            </div>
          </div>
        )}
      </div>

      {/* Slide-over panel */}
      {panelOpen && renderPanel()}
    </div>
  );
};

export default CustomerIntelligence;
