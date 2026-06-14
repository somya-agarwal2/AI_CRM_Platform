import React, { useState } from 'react';
import {
  Sparkles, GitBranch, Play, Save, Plus, Smartphone, Mail, Clock,
  CheckCircle, Users, Zap, Brain, Tag, CreditCard, Settings,
  XCircle, ShoppingCart, Gift, Bell, MessageSquare,
  Loader2, X, TrendingUp, DollarSign,
  Wand2, Cpu, Activity, Package,
  MousePointerClick, Target, Shuffle, Eye,
  ChevronDown, ChevronUp, BarChart2, Star, Trash2, Copy
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type NodeType = 'trigger' | 'action' | 'wait' | 'condition' | 'ai_action' | 'exit' | 'goal';

export interface JNode {
  id: string;
  type: NodeType;
  subtype?: string;
  label: string;
  config: Record<string, any>;
  yesBranch?: JNode[];
  noBranch?: JNode[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const uid = () => `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

function regenIds(nodes: JNode[]): JNode[] {
  return nodes.map(n => ({
    ...n,
    id: uid(),
    yesBranch: n.yesBranch ? regenIds(n.yesBranch) : undefined,
    noBranch: n.noBranch ? regenIds(n.noBranch) : undefined,
  }));
}

const NODE_STYLE: Record<string, { color: string; bg: string }> = {
  trigger:    { color: 'var(--accent-secondary)', bg: 'rgba(36,138,88,0.12)' },
  ai_action:  { color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  wait:       { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  condition:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  exit:       { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  goal:       { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  // action subtypes
  whatsapp:   { color: 'var(--accent-secondary)', bg: 'rgba(16,185,129,0.1)' },
  email:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  sms:        { color: 'var(--accent-secondary)', bg: 'rgba(59,130,246,0.1)' },
  push:       { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  coupon:     { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  tag:        { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  crm:        { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
};

function nodeStyle(n: JNode) {
  if (n.type === 'action' && n.subtype && NODE_STYLE[n.subtype]) return NODE_STYLE[n.subtype];
  return NODE_STYLE[n.type] ?? { color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.1)' };
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // triggers
  segment: Users, segment_exited: Users, churn_risk: Activity, vip: Star, first_purchase: ShoppingCart, order_delivered: Package, purchase_completed: Package, no_purchase: Clock,
  cart_abandoned: ShoppingCart, product_viewed: Eye, birthday: Gift,
  campaign_clicked: MousePointerClick, custom: Zap, inactive: Users,
  // actions
  whatsapp: MessageSquare, email: Mail, sms: Smartphone, push: Bell, rcs: MessageSquare,
  coupon: CreditCard, tag: Tag, crm: Settings, move_segment: Users, task: CheckCircle, notify_sales: Bell,
  // logic
  wait: Clock, condition: GitBranch, split_test: Shuffle, ab_split: Shuffle, channel_select: Cpu, purchase_check: ShoppingCart, engagement_check: Activity, revenue_check: DollarSign, goal: Target, exit: XCircle,
  // ai
  generate_message: Sparkles, predict_churn: Activity, predict_product: Brain,
  best_offer: DollarSign, recommend_channel: Cpu,
};

function nodeIcon(n: JNode): React.ComponentType<any> {
  if (n.subtype && ICON_MAP[n.subtype]) return ICON_MAP[n.subtype];
  if (n.type === 'trigger') return Users;
  if (n.type === 'wait') return Clock;
  if (n.type === 'condition') return GitBranch;
  if (n.type === 'exit') return XCircle;
  if (n.type === 'goal') return Target;
  if (n.type === 'ai_action') return Sparkles;
  return Mail;
}

const TYPE_LABEL: Record<NodeType, string> = {
  trigger: 'TRIGGER', action: 'ACTION', wait: 'WAIT',
  condition: 'CONDITION', ai_action: 'AI ACTION', exit: 'EXIT', goal: 'GOAL',
};

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────

export const TEMPLATES: Record<string, JNode[]> = {
  'Win Back': [
    { id: 't1', type: 'trigger', subtype: 'inactive', label: 'Customer Inactive 60 Days', config: { days: 60 } },
    { id: 'ai1', type: 'ai_action', subtype: 'generate_message', label: 'Generate AI Message', config: { goal: 'win_back' } },
    { id: 'a1', type: 'action', subtype: 'whatsapp', label: 'Send WhatsApp', config: { message: 'Hey {{first_name}}, we miss you! 👋', channel: 'WhatsApp', sendTime: 'Best AI Time', expectedOpenRate: '72%', expectedConversion: '14%' } },
    { id: 'w1', type: 'wait', label: 'Wait 3 Days', config: { duration: 3, unit: 'days' } },
    {
      id: 'c1', type: 'condition', label: 'Purchased?', config: { condition: 'Made a purchase in last 3 days' },
      yesBranch: [{ id: 'e1', type: 'exit', label: 'Exit — Converted ✓', config: {} }],
      noBranch:  [{ id: 'a3', type: 'action', subtype: 'email', label: 'Send Discount Email', config: { message: "Here's 15% off just for you!", channel: 'Email', expectedOpenRate: '45%', expectedConversion: '8%' } }]
    }
  ],
  'New Customer': [
    { id: 't1', type: 'trigger', subtype: 'first_purchase', label: 'First Purchase', config: {} },
    { id: 'a1', type: 'action', subtype: 'email', label: 'Thank You Email', config: { message: 'Welcome to the family, {{first_name}}! 🎉', channel: 'Email', expectedOpenRate: '68%', expectedConversion: '22%' } },
    { id: 'w1', type: 'wait', label: 'Wait 3 Days', config: { duration: 3, unit: 'days' } },
    { id: 'a2', type: 'action', subtype: 'email', label: 'Product Tips Email', config: { message: 'Get the most from your purchase', channel: 'Email', expectedOpenRate: '55%', expectedConversion: '18%' } },
    { id: 'w2', type: 'wait', label: 'Wait 7 Days', config: { duration: 7, unit: 'days' } },
    { id: 'a3', type: 'action', subtype: 'whatsapp', label: 'Review Request', config: { message: 'How are you enjoying your purchase? ⭐', channel: 'WhatsApp', expectedOpenRate: '75%', expectedConversion: '12%' } }
  ],
  'Cart Recovery': [
    { id: 't1', type: 'trigger', subtype: 'cart_abandoned', label: 'Cart Abandoned', config: {} },
    { id: 'w1', type: 'wait', label: 'Wait 1 Hour', config: { duration: 1, unit: 'hours' } },
    {
      id: 'c1', type: 'condition', label: 'Cart Purchased?', config: { condition: 'Customer completed the purchase' },
      yesBranch: [{ id: 'e1', type: 'exit', label: 'Exit — Purchase Done ✓', config: {} }],
      noBranch:  [{ id: 'a1', type: 'action', subtype: 'whatsapp', label: 'Send WhatsApp', config: { message: "You left items in your cart! 🛒", channel: 'WhatsApp', expectedOpenRate: '80%', expectedConversion: '25%' } }]
    }
  ],
  'VIP Loyalty': [
    { id: 't1', type: 'trigger', subtype: 'segment', label: 'Joined VIP Segment', config: {} },
    { id: 'a1', type: 'action', subtype: 'whatsapp', label: 'VIP Welcome Message', config: { message: '🌟 Welcome to VIP, {{first_name}}!', channel: 'WhatsApp', expectedOpenRate: '88%', expectedConversion: '32%' } },
    { id: 'a2', type: 'action', subtype: 'coupon', label: 'Create Exclusive Coupon', config: { discount: '20%', code: 'VIP20' } },
    { id: 'w1', type: 'wait', label: 'Wait 30 Days', config: { duration: 30, unit: 'days' } },
    { id: 'ai1', type: 'ai_action', subtype: 'predict_product', label: 'Predict Next Product', config: {} },
    { id: 'a3', type: 'action', subtype: 'email', label: 'Personalized Recommendation', config: { message: 'Based on your taste, {{first_name}}...', channel: 'Email', expectedOpenRate: '62%', expectedConversion: '28%' } }
  ],
  'Cross Sell': [
    { id: 't1', type: 'trigger', subtype: 'order_delivered', label: 'Order Delivered', config: {} },
    { id: 'ai1', type: 'ai_action', subtype: 'predict_product', label: 'Predict Next Product', config: {} },
    { id: 'w1', type: 'wait', label: 'Wait 5 Days', config: { duration: 5, unit: 'days' } },
    { id: 'a1', type: 'action', subtype: 'email', label: 'Cross-Sell Email', config: { message: 'Customers like you also bought...', channel: 'Email', expectedOpenRate: '48%', expectedConversion: '16%' } }
  ],
  'Reactivation': [
    { id: 't1', type: 'trigger', subtype: 'inactive', label: 'Inactive 90 Days', config: { days: 90 } },
    { id: 'ai1', type: 'ai_action', subtype: 'predict_churn', label: 'Predict Churn Risk', config: {} },
    { id: 'ai2', type: 'ai_action', subtype: 'best_offer', label: 'Calculate Best Offer', config: {} },
    { id: 'a1', type: 'action', subtype: 'sms', label: 'Send SMS', config: { message: "We've missed you! Special offer inside 🎁", channel: 'SMS', expectedOpenRate: '92%', expectedConversion: '11%' } },
    { id: 'w1', type: 'wait', label: 'Wait 5 Days', config: { duration: 5, unit: 'days' } },
    {
      id: 'c1', type: 'condition', label: 'Responded?', config: { condition: 'Customer engaged with the SMS' },
      yesBranch: [{ id: 'a2', type: 'action', subtype: 'whatsapp', label: 'Send Personalized Offer', config: { message: 'Your exclusive deal is ready!', channel: 'WhatsApp', expectedOpenRate: '78%', expectedConversion: '22%' } }],
      noBranch:  [
        { id: 'a3', type: 'action', subtype: 'email', label: 'Final Attempt Email', config: { message: 'Last chance — expires soon', channel: 'Email', expectedOpenRate: '35%', expectedConversion: '6%' } },
        { id: 'e1', type: 'exit', label: 'Exit Journey', config: {} }
      ]
    }
  ]
};

// Hardcoded logic removed in favor of Grok AI

// ─────────────────────────────────────────────
// Palette data
// ─────────────────────────────────────────────

const PALETTE = {
  Triggers: {
    color: 'var(--accent-secondary)',
    items: [
      { subtype: 'segment', label: 'Segment Entered', icon: Users },
      { subtype: 'segment_exited', label: 'Segment Exited', icon: Users },
      { subtype: 'churn_risk', label: 'High Churn Risk', icon: Activity },
      { subtype: 'vip', label: 'VIP Customer', icon: Star },
      { subtype: 'cart_abandoned', label: 'Cart Abandoned', icon: ShoppingCart },
      { subtype: 'purchase_completed', label: 'Purchase Completed', icon: Package },
      { subtype: 'no_purchase', label: 'No Purchase 30 Days', icon: Clock },
    ]
  },
  Actions: {
    color: 'var(--accent-secondary)',
    items: [
      { subtype: 'whatsapp', label: 'Send WhatsApp', icon: MessageSquare },
      { subtype: 'email', label: 'Send Email', icon: Mail },
      { subtype: 'sms', label: 'Send SMS', icon: Smartphone },
      { subtype: 'rcs', label: 'Send RCS', icon: MessageSquare },
      { subtype: 'coupon', label: 'Apply Coupon', icon: CreditCard },
      { subtype: 'tag', label: 'Add Tag', icon: Tag },
      { subtype: 'move_segment', label: 'Move To Segment', icon: Users },
      { subtype: 'task', label: 'Create Task', icon: CheckCircle },
      { subtype: 'notify_sales', label: 'Notify Sales Team', icon: Bell },
    ]
  },
  Logic: {
    color: '#f59e0b',
    items: [
      { subtype: 'wait', label: 'Wait', icon: Clock },
      { subtype: 'condition', label: 'Condition', icon: GitBranch },
      { subtype: 'ab_split', label: 'A/B Split', icon: Shuffle },
      { subtype: 'channel_select', label: 'Channel Selection', icon: Cpu },
      { subtype: 'purchase_check', label: 'Purchase Check', icon: ShoppingCart },
      { subtype: 'engagement_check', label: 'Engagement Check', icon: Activity },
      { subtype: 'revenue_check', label: 'Revenue Check', icon: DollarSign },
      { subtype: 'goal', label: 'Goal', icon: Target },
      { subtype: 'exit', label: 'Exit Journey', icon: XCircle },
    ]
  },
  'AI Actions': {
    color: '#ec4899',
    items: [
      { subtype: 'generate_message', label: 'Generate AI Message', icon: Sparkles },
      { subtype: 'predict_churn', label: 'Predict Churn', icon: Activity },
      { subtype: 'predict_product', label: 'Predict Next Product', icon: Brain },
      { subtype: 'best_offer', label: 'Calculate Best Offer', icon: DollarSign },
      { subtype: 'recommend_channel', label: 'Recommend Channel', icon: Cpu },
    ]
  }
};

const SECTION_TYPES: Record<string, NodeType> = {
  Triggers: 'trigger',
  Actions: 'action',
  Logic: 'wait',
  'AI Actions': 'ai_action',
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Connector({ color = '#cbd5e1' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 2, height: 20, background: color }} />
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${color}` }} />
    </div>
  );
}

function NodeCard({ node, selected, onSelect, isActive }: { node: JNode; selected: boolean; onSelect: (id: string) => void; isActive?: boolean }) {
  const s = nodeStyle(node);
  const Icon = nodeIcon(node);
  const [hovered, setHovered] = useState(false);

  const stats = isActive && node.config?.stats ? node.config.stats : null;

  return (
    <div
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 230,
        background: 'white',
        border: `2px solid ${selected ? s.color : hovered ? s.color + '60' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 12,
        padding: isActive ? '13px 14px 28px 14px' : '13px 14px',

        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        boxShadow: selected
          ? `0 0 0 3px ${s.color}25, 0 6px 16px rgba(0,0,0,0.1)`
          : hovered
          ? '0 4px 14px rgba(0,0,0,0.1)'
          : '0 2px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Color stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color, borderRadius: '12px 0 0 12px' }} />
      {/* Icon */}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 4 }}>
        <Icon size={17} color={s.color} />
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
          {TYPE_LABEL[node.type]}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.label}
        </div>
      </div>
      {isActive && stats && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#f8fafc', padding: '4px 10px', fontSize: 9, color: '#475569', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.05)', fontWeight: 600 }}>
          {node.type === 'trigger' && <span>Entered: {stats.entered}</span>}
          {node.type === 'action' && (
            <>
              <span>Sent: {stats.sent}</span>
              <span style={{ color: 'var(--accent-secondary)' }}>Opn: {stats.opn}%</span>
              <span style={{ color: 'var(--accent-primary)' }}>Clk: {stats.clk}%</span>
            </>
          )}
          {(node.type === 'wait' || node.type === 'condition' || node.type === 'ai_action') && <span>Proceeded: {stats.proceeded}</span>}
        </div>
      )}
    </div>
  );
}

function JourneyFlow({ nodes, selected, onSelect, isActive }: { nodes: JNode[]; selected: string | null; onSelect: (id: string) => void, isActive?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {nodes.map((node, idx) => (
        <React.Fragment key={node.id}>
          <NodeCard node={node} selected={selected === node.id} onSelect={onSelect} isActive={isActive} />

          {node.type === 'condition' && (
            <div style={{ display: 'flex', width: 560, marginTop: 0 }}>
              {/* YES branch */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Connector color="var(--accent-secondary)" />
                <div style={{ padding: '3px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 8 }}>YES</div>
                {node.yesBranch && node.yesBranch.length > 0
                  ? <JourneyFlow nodes={node.yesBranch} selected={selected} onSelect={onSelect} isActive={isActive} />
                  : <div style={{ padding: '10px 18px', border: '2px dashed rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 600 }}>+ Add Step</div>
                }
              </div>
              {/* Divider */}
              <div style={{ width: 1, background: '#e2e8f0', alignSelf: 'stretch', minHeight: 60, margin: '10px 0' }} />
              {/* NO branch */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Connector color="#ef4444" />
                <div style={{ padding: '3px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>NO</div>
                {node.noBranch && node.noBranch.length > 0
                  ? <JourneyFlow nodes={node.noBranch} selected={selected} onSelect={onSelect} isActive={isActive} />
                  : <div style={{ padding: '10px 18px', border: '2px dashed rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 11, color: '#ef4444', fontWeight: 600 }}>+ Add Step</div>
                }
              </div>
            </div>
          )}

          {idx < nodes.length - 1 && <Connector />}
        </React.Fragment>
      ))}
    </div>
  );
}

function PropertiesPanel({ node, onClose, onDelete }: { node: JNode; onClose: () => void; onDelete: () => void }) {
  const s = nodeStyle(node);
  const Icon = nodeIcon(node);

  return (
    <div style={{ width: 280, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: `linear-gradient(135deg, ${s.bg}, white)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} color={s.color} />
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          {TYPE_LABEL[node.type]}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}>{node.label}</div>
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>

        {/* Message */}
        {node.config.message && (
          <div>
            <label style={lbl}>Message</label>
            <textarea defaultValue={node.config.message} rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(0,0,0,0.11)', borderRadius: 8, fontSize: 13, resize: 'none', color: 'var(--accent-primary)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        )}

        {/* Channel */}
        {node.config.channel && (
          <div>
            <label style={lbl}>Channel</label>
            <div style={pill}>{node.config.channel}</div>
          </div>
        )}

        {/* Send Time */}
        {node.config.sendTime && (
          <div>
            <label style={lbl}>Send Time</label>
            <div style={{ ...pill, background: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: '1px solid rgba(36,138,88,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} /> {node.config.sendTime}
            </div>
          </div>
        )}

        {/* Wait duration */}
        {node.type === 'wait' && (
          <div>
            <label style={lbl}>Duration</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" defaultValue={node.config.duration}
                style={{ flex: 1, padding: '9px 12px', border: '1px solid rgba(0,0,0,0.11)', borderRadius: 8, fontSize: 13, color: 'var(--accent-primary)', outline: 'none' }} />
              <select defaultValue={node.config.unit}
                style={{ flex: 1.2, padding: '9px 12px', border: '1px solid rgba(0,0,0,0.11)', borderRadius: 8, fontSize: 13, color: 'var(--accent-primary)', background: 'white', outline: 'none' }}>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Condition */}
        {node.type === 'condition' && node.config.condition && (
          <div>
            <label style={lbl}>Condition</label>
            <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#92400e', lineHeight: 1.4 }}>
              {node.config.condition}
            </div>
          </div>
        )}

        {/* Coupon */}
        {node.subtype === 'coupon' && (
          <div>
            <label style={lbl}>Coupon Code</label>
            <input type="text" defaultValue={node.config.code} placeholder="e.g. SAVE20"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(0,0,0,0.11)', borderRadius: 8, fontSize: 13, color: 'var(--accent-primary)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* AI Block */}
        {node.type === 'ai_action' && (
          <div style={{ padding: '13px 14px', background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.06))', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ec4899', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} /> EngageX Powered
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>
              {node.subtype === 'generate_message' && 'Crafts a personalised message for each customer using purchase history and behaviour.'}
              {node.subtype === 'predict_churn' && 'Scores each customer\'s churn probability and surfaces high-risk profiles.'}
              {node.subtype === 'predict_product' && 'Identifies the most likely next product a customer will buy using collaborative filtering.'}
              {node.subtype === 'best_offer' && 'Calculates the minimum discount needed to convert each individual customer.'}
              {node.subtype === 'recommend_channel' && 'Picks WhatsApp, Email, or SMS based on each customer\'s historical open behaviour.'}
            </div>
          </div>
        )}

        {/* AI Predictions for action nodes */}
        {node.type === 'action' && node.config.expectedOpenRate && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={11} color="var(--accent-secondary)" /> AI Predictions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Expected Open Rate', value: node.config.expectedOpenRate, color: 'var(--accent-secondary)' },
                { label: 'Expected Conversion', value: node.config.expectedConversion, color: 'var(--accent-secondary)' },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{p.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Button */}
        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button 
            onClick={onDelete}
            style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid #fca5a5', borderRadius: 8, color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            <Trash2 size={14} /> Delete Node
          </button>
        </div>
      </div>
    </div>
  );
}

// Label style helper
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const pill: React.CSSProperties = { padding: '9px 12px', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#334155' };

// ─────────────────────────────────────────────
// Collapsible palette section
// ─────────────────────────────────────────────

function PaletteSection({ title, items, color, onAdd }: { title: string; items: any[]; color: string; onAdd: (item: any, category: string) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 2px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
          {title}
        </span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
          {items.map(item => {
            const Ic = item.icon;
            const s = NODE_STYLE[item.subtype] ?? { color, bg: color + '18' };
            return (
              <button
                key={item.subtype}
                onClick={() => onAdd(item, title)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#334155', textAlign: 'left', width: '100%', transition: 'all 0.14s ease' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = s.bg; el.style.color = s.color; el.style.borderColor = s.color + '40'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f8fafc'; el.style.color = '#334155'; el.style.borderColor = 'rgba(0,0,0,0.06)'; }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 6, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic size={13} color={s.color} />
                </div>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                <Plus size={11} style={{ opacity: 0.35, flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const TEMPLATE_NAMES = Object.keys(TEMPLATES);

export default function JourneyBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nodes, setNodes] = useState<JNode[]>(() => {
    if (location.state?.viewJourney?.nodes) {
      return location.state.viewJourney.nodes;
    }
    if (location.state?.customerId) {
      return [{
        id: `t_${Date.now()}`,
        type: 'trigger',
        subtype: 'segment',
        label: `Customer: ${location.state.customerName}`,
        config: { intent: location.state.intent }
      }];
    }
    if (location.state?.segmentId) {
      const saved = localStorage.getItem(`journey_nodes_${location.state.segmentId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<'builder' | 'active' | 'drafts' | 'templates'>(location.state?.tab || 'builder');
  const [showTemplateModal, setShowTemplateModal] = useState(() => !!location.state?.customerId);

  const [selected, setSelected] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [journeyName, setJourneyName] = useState(location.state?.viewJourney?.name || 'Untitled Journey');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [journeyStatus, setJourneyStatus] = useState(location.state?.viewJourney?.status === 'active' ? 'Active' : 'Draft');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [saveModal, setSaveModal] = useState<{isOpen: boolean, type: 'draft' | 'template' | null, tempName: string}>({isOpen: false, type: null, tempName: ''});
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [activateModal, setActivateModal] = useState<{isOpen: boolean, tempName: string}>({isOpen: false, tempName: ''});
  const [dbActiveJourneys, setDbActiveJourneys] = useState<any[]>([]);

  const fetchActiveJourneys = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/journeys');
      const data = await res.json();
      setDbActiveJourneys(data);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveJourneys();
    }
  }, [activeTab]);  React.useEffect(() => {
    const savedTemplates = localStorage.getItem('journey_templates');
    if (savedTemplates) {
      try { setCustomTemplates(JSON.parse(savedTemplates)); } catch (e) {}
    }
  }, [saved]);

  const allTemplateNames = [...TEMPLATE_NAMES, ...customTemplates.map(t => t.name)];

  React.useEffect(() => {
    if (location.state?.initialPrompt) {
      const p = location.state.initialPrompt;
      setPrompt(p);
      setJourneyName(p.split('\n')[0].slice(0, 40));
      
      if (!location.state.segmentId) {
        const generateInitial = async () => {
          setGenerating(true);
          try {
            const res = await fetch('http://localhost:5000/api/ai/journey/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: p })
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.nodes) {
                setNodes(regenIds(data.nodes));
                setJourneyName(data.journey_name || p.slice(0, 40));
                setAiReasoning(data.reasoning || null);
              }
            }
          } catch(e) {}
          setGenerating(false);
        };
        generateInitial();
      }
    }
  }, [location.state]);

  // Persist nodes to localStorage when they change
  React.useEffect(() => {
    if (location.state?.segmentId && nodes.length > 0) {
      localStorage.setItem(`journey_nodes_${location.state.segmentId}`, JSON.stringify(nodes));
    }
  }, [nodes, location.state?.segmentId]);

  // Flatten-find a node by id (including inside branches)
  function findNode(list: JNode[], id: string): JNode | null {
    for (const n of list) {
      if (n.id === id) return n;
      const y = n.yesBranch ? findNode(n.yesBranch, id) : null;
      if (y) return y;
      const nb = n.noBranch ? findNode(n.noBranch, id) : null;
      if (nb) return nb;
    }
    return null;
  }

  const selectedNode = selected ? findNode(nodes, selected) : null;

  async function handleAIGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setSelected(null);
    setAiReasoning(null);
    try {
      const res = await fetch('http://localhost:5000/api/ai/journey/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) {
        alert("AI Journey Generation Unavailable");
        setGenerating(false);
        return;
      }
      const data = await res.json();
      if (data && data.nodes) {
        setNodes(regenIds(data.nodes));
        setJourneyName(data.journey_name || prompt.slice(0, 40));
        setAiReasoning(data.reasoning || null);
      } else {
        alert("AI Journey Generation Unavailable");
      }
    } catch (e) {
      console.error(e);
      alert("AI Journey Generation Unavailable");
    }
    setActiveTemplate(null);
    setGenerating(false);
  }

  function loadTemplate(name: string) {
    setActiveTemplate(name);
    if (TEMPLATES[name]) {
      setNodes(regenIds(TEMPLATES[name]));
      setJourneyName(name + ' Journey');
    } else {
      const custom = customTemplates.find(t => t.name === name);
      if (custom) {
        setNodes(regenIds(custom.nodes));
        setJourneyName(custom.name);
      }
    }
    setSelected(null);
  }

  function addNode(item: any, section: string) {
    const typeMap: Record<string, NodeType> = {
      Triggers: 'trigger', Actions: 'action', 'AI Actions': 'ai_action',
      wait: 'wait', condition: 'condition', exit: 'exit', goal: 'goal', split_test: 'goal',
    };
    const logicType: Record<string, NodeType> = { wait: 'wait', condition: 'condition', exit: 'exit', goal: 'goal', split_test: 'goal' };
    const type: NodeType = section === 'Logic' ? (logicType[item.subtype] ?? 'wait') : (typeMap[section] ?? 'action');

    const newNode: JNode = {
      id: uid(),
      type,
      subtype: item.subtype,
      label: item.label,
      config: type === 'wait' ? { duration: 2, unit: 'days' } : type === 'condition' ? { condition: 'Define condition...' } : {},
    };
    setNodes(prev => [...prev, newNode]);
  }

  function deleteNode(id: string) {
    const filterOut = (list: JNode[]): JNode[] => {
      return list.filter(n => n.id !== id).map(n => ({
        ...n,
        yesBranch: n.yesBranch ? filterOut(n.yesBranch) : undefined,
        noBranch: n.noBranch ? filterOut(n.noBranch) : undefined,
      }));
    };
    setNodes(prev => filterOut(prev));
    setSelected(null);
  }

  function handleSave() {
    setSaveModal({ isOpen: true, type: 'draft', tempName: journeyName === 'Untitled Journey' ? '' : journeyName });
  }

  function handleSaveTemplate() {
    setSaveModal({ isOpen: true, type: 'template', tempName: journeyName === 'Untitled Journey' ? '' : journeyName });
  }

  async function confirmSave() {
    const finalName = saveModal.tempName.trim() || 'Untitled Journey';
    setJourneyName(finalName);
    
    if (saveModal.type === 'draft') {
      try {
        const res = await fetch('http://localhost:5000/api/journeys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: finalName, nodes: nodes, type: 'dynamic' })
        });
        if (res.ok) {
          const data = await res.json();
          setJourneyId(data.id);
          setSaved(true);
          setLastSaved('Just now');
          setActiveTab('drafts');
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setSaved(true);
      setLastSaved('Template saved');

      const savedTemplates = JSON.parse(localStorage.getItem('journey_templates') || '[]');
      const newTemplate = {
        id: `template_${Date.now()}`,
        name: finalName,
        nodes: nodes,
        created_at: new Date().toISOString()
      };
      
      const existingIdx = savedTemplates.findIndex((t: any) => t.name === finalName);
      if (existingIdx > -1) {
        savedTemplates[existingIdx] = newTemplate;
      } else {
        savedTemplates.push(newTemplate);
      }
      localStorage.setItem('journey_templates', JSON.stringify(savedTemplates));
      setActiveTab('templates');
    }
    
    setSaveModal({ isOpen: false, type: null, tempName: '' });
  }

  async function confirmActivate() {
    const finalName = activateModal.tempName.trim() || 'Untitled Journey';
    setJourneyName(finalName);
    setActivateModal({ isOpen: false, tempName: '' });

    let activeId = journeyId;
    if (!activeId) {
      try {
        const res = await fetch('http://localhost:5000/api/journeys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: finalName, nodes: nodes, type: 'dynamic' })
        });
        if (res.ok) {
          const data = await res.json();
          activeId = data.id;
          setJourneyId(activeId);
        }
      } catch (e) {}
    }
    
    if (activeId) {
      try {
        await fetch(`http://localhost:5000/api/journeys/${activeId}/activate`, { method: 'POST' });
        
        setSaved(true); 
        setJourneyStatus('Active');
        setActiveTab('active' as any);
      } catch (e) {}
    }
  }

  async function deleteActiveJourney(id: string) {
    if (confirm('Are you sure you want to delete this active journey?')) {
      try {
        await fetch(`http://localhost:5000/api/journeys/${id}`, { method: 'DELETE' });
        fetchActiveJourneys();
      } catch (e) {
        console.error("Failed to delete journey");
      }
    }
  }

  // Analytics based on real backend stats
  const hasNodes = nodes.length > 0;
  const entered = nodes.find(n => n.type === 'trigger')?.config?.stats?.entered || 0;
  const completed = Math.floor(nodes.reduce((acc, n) => {
    if (n.type === 'action' && n.config?.stats?.clk) {
      return acc + (n.config.stats.sent * n.config.stats.clk / 100);
    }
    return acc;
  }, 0) / (nodes.filter(n => n.type === 'action').length || 1));

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes jb-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.9); } }
        @keyframes jb-fade-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .jb-root { animation: jb-fade-in 0.25s ease; }
      `}</style>

      <div className="jb-root" style={{ margin: '-24px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>

        {/* ── HEADER ── */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 14, height: 58, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GitBranch size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={journeyName}
              onChange={e => setJourneyName(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)', outline: 'none', fontFamily: 'inherit', width: '100%', maxWidth: 340 }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Journey Builder · EngageX</span>
              <span style={{ color: journeyStatus === 'Active' ? 'var(--accent-secondary)' : '#f59e0b', fontWeight: 600 }}>Status: {journeyStatus}</span>
              {lastSaved && <span>Last Saved: {lastSaved}</span>}
            </div>
          </div>

          {saved && (
            <div style={{ fontSize: 13, color: 'var(--accent-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={14} /> Saved
            </div>
          )}

          {journeyStatus !== 'Active' && (
            <>
              <button onClick={handleSave} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.11)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={13} /> Save Draft
              </button>
              <button onClick={handleSaveTemplate} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.11)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={13} /> Save as Template
              </button>
              <button onClick={() => { 
                setActivateModal({ isOpen: true, tempName: journeyName === 'Untitled Journey' ? '' : journeyName });
              }} style={{ padding: '7px 18px', background: 'linear-gradient(135deg,#22c55e,var(--accent-secondary))', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(16,185,129,0.4)' }}>
                <Play size={13} fill="white" /> Activate Journey
              </button>
            </>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ padding: '0 20px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 24, flexShrink: 0 }}>
          {['builder', 'drafts', 'templates', 'active'].map(t => (
            <div 
              key={t}
              onClick={() => setActiveTab(t as any)}
              style={{ padding: '12px 0', fontSize: 13, fontWeight: 600, color: activeTab === t ? 'var(--accent-primary)' : '#64748b', borderBottom: `2px solid ${activeTab === t ? 'var(--accent-primary)' : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}
            >
              {t === 'builder' ? 'Builder' : t === 'drafts' ? 'Drafts' : t === 'templates' ? 'Templates' : 'Active'}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeTab === 'builder' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px 20px', flexShrink: 0, display: journeyStatus === 'Active' ? 'none' : 'block' }}>
          {/* Prompt row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 11 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'linear-gradient(135deg,rgba(99,102,241,0.04),rgba(139,92,246,0.04))', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 10 }}>
              <Wand2 size={15} color="var(--accent-secondary)" style={{ flexShrink: 0 }} />
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                placeholder="Describe the journey you want… e.g. 'Recover customers inactive for 60 days'"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: 'var(--accent-primary)', outline: 'none', fontFamily: 'inherit' }}
              />
              {prompt && <button onClick={() => setPrompt('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 0 }}><X size={14} /></button>}
            </div>
            <button
              onClick={handleAIGenerate}
              disabled={!prompt.trim() || generating}
              style={{ padding: '9px 20px', background: !prompt.trim() || generating ? '#e2e8f0' : 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', border: 'none', borderRadius: 10, color: !prompt.trim() || generating ? '#94a3b8' : 'white', fontSize: 13, fontWeight: 600, cursor: !prompt.trim() || generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', boxShadow: !prompt.trim() || generating ? 'none' : '0 2px 10px rgba(30,58,44,0.4)', transition: 'all 0.2s' }}
            >
              {generating
                ? <><Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> Generating…</>
                : <><Sparkles size={14} /> AI Generate</>}
            </button>
          </div>

          {/* Templates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Templates:</span>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, minWidth: 0, paddingBottom: '4px' }}>
              {allTemplateNames.map(t => (
                <button
                  key={t}
                  onClick={() => loadTemplate(t)}
                  style={{ padding: '4px 14px', background: activeTemplate === t ? 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' : '#f1f5f9', color: activeTemplate === t ? 'white' : '#475569', border: activeTemplate === t ? 'none' : '1px solid rgba(0,0,0,0.07)', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── THREE-PANEL ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* LEFT: Palette */}
          {journeyStatus !== 'Active' && (
            <div style={{ width: 218, background: 'white', borderRight: '1px solid rgba(0,0,0,0.07)', overflowY: 'auto', flexShrink: 0, padding: '14px 10px' }}>
              {Object.entries(PALETTE).map(([section, { color, items }]) => (
                <PaletteSection key={section} title={section} items={items} color={color} onAdd={addNode} />
              ))}
            </div>
          )}

          {/* CENTER: Canvas */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', background: '#f8fafc', backgroundImage: 'radial-gradient(rgba(148,163,184,0.38) 1px, transparent 1px)', backgroundSize: '24px 24px', padding: '40px 40px 80px' }}>
            {generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
                <div style={{ width: 68, height: 68, borderRadius: 18, background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(36,138,88,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={34} color="var(--accent-secondary)" style={{ animation: 'jb-pulse 1.1s ease-in-out infinite' }} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#475569' }}>EngageX is building your journey…</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Analysing behaviour patterns and crafting the optimal flow</div>
              </div>
            ) : nodes.length === 0 ? (
              location.state?.segmentId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto', marginTop: 20 }}>
                  <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)', margin: '0 0 16px 0' }}>Journey Context</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Journey Name</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{location.state.segmentName} Automation</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Source Segment</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{location.state.segmentName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Audience Size</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{location.state.audienceSize?.toLocaleString()} Customers</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Potential Revenue</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-secondary)' }}>₹{((location.state.audienceSize || 0) * 1950).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))', borderRadius: 12, padding: 24, border: '1px solid rgba(36,138,88,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <Sparkles size={18} color="var(--accent-secondary)" />
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>AI Recommended Journey</h2>
                    </div>
                    <div style={{ background: 'white', borderRadius: 8, padding: 16, border: '1px solid rgba(0,0,0,0.05)', marginBottom: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#64748b' }}>1</div><span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>Trigger: Enters Segment</span></div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#64748b' }}>2</div><span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>Send WhatsApp Discount</span></div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#64748b' }}>3</div><span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>Wait 3 Days</span></div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#64748b' }}>4</div><span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>Check Purchase & Reminder (Email/SMS)</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Expected Recovery</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{Math.floor((location.state.audienceSize || 0) * 1950 * 0.18).toLocaleString()}</div>
                      </div>
                      <button onClick={handleAIGenerate} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(30,58,44,0.3)' }}>
                        <Sparkles size={16} /> Generate AI Journey
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 420, gap: 16 }}>
                  <div style={{ width: 84, height: 84, borderRadius: 22, background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(36,138,88,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitBranch size={42} color="var(--accent-secondary)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Start Building Your Journey</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 340, lineHeight: 1.65 }}>
                      Describe your journey using AI above, choose a template, or click items in the left panel to add steps manually.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <button onClick={() => loadTemplate('Win Back')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(30,58,44,0.4)' }}>
                      Load Win Back Template
                    </button>
                    <button onClick={() => setPrompt('Recover customers inactive for 60 days')} style={{ padding: '10px 22px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Try AI Generate
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 40 }}>
                {aiReasoning && (
                  <div style={{ alignSelf: 'stretch', margin: '0 40px 20px', padding: '16px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(36,138,88,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '14px' }}>
                      <Brain size={16} /> Why AI Built This Journey
                    </div>
                    <div style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
                      {aiReasoning}
                    </div>
                  </div>
                )}
                <JourneyFlow nodes={nodes} selected={selected} onSelect={id => setSelected(id === selected ? null : id)} isActive={journeyStatus === 'Active'} />
                {journeyStatus !== 'Active' && (
                  <div style={{ marginTop: 20 }}>
                    <button style={{ width: 230, padding: '11px 0', border: '2px dashed rgba(99,102,241,0.28)', borderRadius: 12, background: 'rgba(99,102,241,0.03)', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Plus size={15} /> Add Step
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Properties / placeholder */}
          {journeyStatus === 'Active' ? (
            <div style={{ width: 240, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', padding: 24, flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 16 }}>Journey Analytics</div>
              <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 12, border: '1px solid rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Entered</div>
                <div style={{ fontSize: 24, color: 'var(--accent-primary)', fontWeight: 800, marginTop: 4 }}>1,247</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(16,185,129,0.1)' }}>
                <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Goal</div>
                <div style={{ fontSize: 24, color: 'var(--accent-secondary)', fontWeight: 800, marginTop: 4 }}>823</div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 6 }}>66% Conversion</div>
              </div>
            </div>
          ) : selectedNode ? (
            <PropertiesPanel node={selectedNode} onClose={() => setSelected(null)} onDelete={() => deleteNode(selectedNode.id)} />
          ) : (
            <div style={{ width: 240, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={22} color="#cbd5e1" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Properties</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55 }}>Click any node in the canvas to view and edit its configuration</div>
              </div>
            </div>
          )}
        </div>
            </div>
          )}

          {activeTab === 'drafts' && (
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 24 }}>Draft Journeys</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {JSON.parse(localStorage.getItem('journey_drafts') || '[]').length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1', background: 'white', borderRadius: 12, border: '1px dashed rgba(0,0,0,0.1)' }}>No saved drafts.</div>
                ) : JSON.parse(localStorage.getItem('journey_drafts') || '[]').map((j: any) => (
                  <div key={j.id} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}>{j.name}</div>
                      <div style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>DRAFT</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{j.nodes.length} steps configured</div>
                    <button onClick={() => { setNodes(j.nodes); setJourneyName(j.name); setActiveTab('builder'); }} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--accent-primary)' }}>Continue Editing</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 24 }}>Template Library</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {allTemplateNames.map((tName) => {
                  const isCustom = customTemplates.find(c => c.name === tName);
                  const nodeCount = isCustom ? isCustom.nodes.length : TEMPLATES[tName]?.length || 0;
                  return (
                    <div key={tName} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}>{tName}</div>
                        {isCustom && <div style={{ padding: '4px 8px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>CUSTOM</div>}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{nodeCount} steps configured</div>
                      <button onClick={() => { loadTemplate(tName); setActiveTab('builder' as any); }} style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--accent-primary)' }}>Use Template</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 24 }}>Active Journeys</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {dbActiveJourneys.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1', background: 'white', borderRadius: 12, border: '1px dashed rgba(0,0,0,0.1)' }}>No active journeys.</div>
                ) : dbActiveJourneys.map((j: any) => (
                  <div key={j.id} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 2px 8px rgba(16,185,129,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}>{j.name}</div>
                      <div style={{ padding: '4px 8px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-secondary)', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>ACTIVE</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{j.nodes.length} steps configured</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => navigate('/journeys/analytics/' + j.id)} style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.1))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--accent-secondary)' }}>View Analytics</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteActiveJourney(j.id); }} style={{ padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Journey"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Template Picker Modal (on fresh attach) */}
        {showTemplateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 500, background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>Choose a Journey</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>How do you want to start this automation?</div>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div 
                  onClick={() => setShowTemplateModal(false)}
                  style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} color="#64748b" /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)' }}>Start Empty</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Build from scratch</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 8, marginBottom: 4 }}>Popular Templates</div>

                {Object.keys(TEMPLATES).slice(0, 3).map(tName => (
                  <div 
                    key={tName}
                    onClick={() => {
                      const templateNodes = TEMPLATES[tName] || [];
                      // If there is a trigger node already, replace the template's trigger node with it
                      if (nodes.length === 1 && nodes[0].type === 'trigger') {
                        setNodes([nodes[0], ...regenIds(templateNodes.slice(1))]);
                      } else {
                        setNodes(regenIds(templateNodes));
                      }
                      setJourneyName(tName);
                      setShowTemplateModal(false);
                    }}
                    style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GitBranch size={20} color="var(--accent-primary)" /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)' }}>{tName}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Pre-configured journey</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Name Modal */}
        {saveModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 400, background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {saveModal.type === 'template' ? 'Save as Template' : 'Save Draft'}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Enter a name for your {saveModal.type === 'template' ? 'template' : 'draft'}.
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <input
                  autoFocus
                  value={saveModal.tempName}
                  onChange={e => setSaveModal(prev => ({ ...prev, tempName: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') confirmSave(); }}
                  placeholder="e.g. VIP Win-back Journey"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', outline: 'none', fontSize: 14 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setSaveModal({ isOpen: false, type: null, tempName: '' })} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                    Cancel
                  </button>
                  <button onClick={confirmSave} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'white' }}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Activate Name Modal */}
        {activateModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 400, background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  Activate Journey
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Enter a name for your journey before activating.
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <input
                  autoFocus
                  value={activateModal.tempName}
                  onChange={e => setActivateModal(prev => ({ ...prev, tempName: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') confirmActivate(); }}
                  placeholder="e.g. VIP Win-back Journey"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', outline: 'none', fontSize: 14 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setActivateModal({ isOpen: false, tempName: '' })} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                    Cancel
                  </button>
                  <button onClick={confirmActivate} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#22c55e,var(--accent-secondary))', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Play size={13} fill="white" /> Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
