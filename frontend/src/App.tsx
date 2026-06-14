import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home,  Users, Target, Megaphone, GitMerge,   Wand2, ChevronDown, ChevronRight, Search, Calendar, Bell, CreditCard, LayoutTemplate } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Copilot from './components/Copilot';
import Journeys from './components/Journeys';
import AIStrategistOverview from './components/AIStrategistOverview';
import AudienceBuilder from './components/AudienceBuilder';
import SegmentDetail from './components/SegmentDetail';
import MessageGenerator from './components/MessageGenerator';
import Templates from './components/Templates';
import TemplateEditor from './components/TemplateEditor';
import ABTesting from './components/ABTesting';
import JourneyBuilder from './components/JourneyBuilder';
import AIOpportunities from './components/AIOpportunities';
import CustomerIntelligence from './components/CustomerIntelligence';
import CustomerProfile from './components/CustomerProfile';
import PurchaseHistory from './components/PurchaseHistory';
import RetentionIntelligence from './components/RetentionIntelligence';
import ValueIntelligence from './components/ValueIntelligence';
import AudiencesHub from './components/AudiencesHub';
import CampaignStudio from './components/CampaignStudio';
import ChannelSimulator from './components/ChannelSimulator';
import AICommandCenter from './components/AICommandCenter';
import SettingsPage from './components/Settings';
import JourneyAnalytics from './components/JourneyAnalytics';

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

const Sidebar = () => {
  const location = useLocation();
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('crm_profileData');
    return saved ? JSON.parse(saved) : { firstName: 'Sarah', lastName: 'Johnson', department: 'Marketing Manager', avatarUrl: null };
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('crm_profileData');
      if (saved) setProfile(JSON.parse(saved));
    };
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  const NavGroup = ({ icon: Icon, title, items, badge, iconColor, defaultOpen = true }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div style={{ marginBottom: '8px' }}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: 'var(--sidebar-text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'var(--transition-fast)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sidebar-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sidebar-text-muted)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon size={16} style={{ color: iconColor || 'var(--sidebar-text-muted)', fill: iconColor === '#f59e0b' ? '#f59e0b' : 'none' }} />
            {title}
          </div>
          {badge ? (
            <span style={{ background: '#1f8f5d', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>{badge}</span>
          ) : items && items.length > 0 ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </div>
        
        {isOpen && items && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '28px', position: 'relative', marginTop: '4px' }}>
            <div style={{ position: 'absolute', left: '19px', top: '0', bottom: '12px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            
            {items.map((item: any, idx: number) => {
              const isActive = location.pathname === item.path || (item.path !== '#' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={idx}
                  to={item.path || '#'}
                  style={{
                    padding: '6px 12px',
                    color: isActive ? 'white' : 'var(--sidebar-text-muted)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    transition: '0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? 'white' : 'var(--sidebar-text-muted)')}
                >
                  <div style={{ position: 'absolute', left: '-10px', top: '50%', width: '8px', height: '1px', background: isActive ? '#1f8f5d' : 'rgba(255,255,255,0.1)' }}></div>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar">
      {/* Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <path d="M20 20 L80 80" stroke="#a7f3d0" strokeWidth="20" strokeLinecap="round" />
            <path d="M80 20 L20 80" stroke="#1f8f5d" strokeWidth="20" strokeLinecap="round" style={{ opacity: 0.9 }} />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px', lineHeight: '1.2' }}>ENGAGEX<span style={{fontWeight: 400}}>AI</span></span>
          <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, letterSpacing: '1px' }}>MARKETING OS</span>
        </div>
      </div>

      {/* Main Dashboard Button */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div style={{ background: '#248a58', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: 600, marginBottom: '16px', fontSize: '14px', border: '1px solid #2e8b5c' }}>
          <Home size={16} />
          Dashboard
        </div>
      </Link>

      {/* Navigation Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

        <Link to="/customer-intelligence" style={{ textDecoration: 'none' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: location.pathname.startsWith('/customer-intelligence') ? 'white' : 'var(--sidebar-text-muted)', background: location.pathname.startsWith('/customer-intelligence') ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', marginBottom: '4px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = location.pathname.startsWith('/customer-intelligence') ? 'white' : 'var(--sidebar-text-muted)'; e.currentTarget.style.background = location.pathname.startsWith('/customer-intelligence') ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={16} style={{ color: location.pathname.startsWith('/customer-intelligence') ? 'white' : 'var(--sidebar-text-muted)' }} />
              Customer Profiles
            </div>
          </div>
        </Link>
        <Link to="/purchase-history" style={{ textDecoration: 'none' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: location.pathname.startsWith('/purchase-history') ? 'white' : 'var(--sidebar-text-muted)', background: location.pathname.startsWith('/purchase-history') ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', marginBottom: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = location.pathname.startsWith('/purchase-history') ? 'white' : 'var(--sidebar-text-muted)'; e.currentTarget.style.background = location.pathname.startsWith('/purchase-history') ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={16} style={{ color: location.pathname.startsWith('/purchase-history') ? 'white' : 'var(--sidebar-text-muted)' }} />
              Purchase History
            </div>
          </div>
        </Link>
        <Link to="/audiences" style={{ textDecoration: 'none' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: location.pathname.startsWith('/audiences') ? 'white' : 'var(--sidebar-text-muted)', background: location.pathname.startsWith('/audiences') ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', marginBottom: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = location.pathname.startsWith('/audiences') ? 'white' : 'var(--sidebar-text-muted)'; e.currentTarget.style.background = location.pathname.startsWith('/audiences') ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={16} style={{ color: location.pathname.startsWith('/audiences') ? 'white' : 'var(--sidebar-text-muted)' }} />
              Segments
            </div>
          </div>
        </Link>
        <Link to="/campaigns" style={{ textDecoration: 'none' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: location.pathname.startsWith('/campaigns') ? 'white' : 'var(--sidebar-text-muted)', background: location.pathname.startsWith('/campaigns') ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', marginBottom: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = location.pathname.startsWith('/campaigns') ? 'white' : 'var(--sidebar-text-muted)'; e.currentTarget.style.background = location.pathname.startsWith('/campaigns') ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Megaphone size={16} style={{ color: location.pathname.startsWith('/campaigns') ? 'white' : 'var(--sidebar-text-muted)' }} />
              Campaigns
            </div>
          </div>
        </Link>

        <Link to="/journeys/build" style={{ textDecoration: 'none' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: location.pathname.startsWith('/journeys') ? 'white' : 'var(--sidebar-text-muted)', background: location.pathname.startsWith('/journeys') ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', marginBottom: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = location.pathname.startsWith('/journeys') ? 'white' : 'var(--sidebar-text-muted)'; e.currentTarget.style.background = location.pathname.startsWith('/journeys') ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitMerge size={16} style={{ color: location.pathname.startsWith('/journeys') ? 'white' : 'var(--sidebar-text-muted)' }} />
              Journey Builder
            </div>
          </div>
        </Link>

        <div style={{ marginTop: '16px' }}>
          <Link to="/command-center" style={{ textDecoration: 'none' }}>
            <NavGroup 
              icon={Wand2} title="AI Command Center" 
              badge="New"
            />
          </Link>
        </div>
        
        <Link to="/templates" style={{ textDecoration: 'none', display: 'block', marginTop: '8px' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', color: location.pathname.startsWith('/templates') ? 'white' : 'var(--sidebar-text-muted)', background: location.pathname.startsWith('/templates') ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = location.pathname.startsWith('/templates') ? 'white' : 'var(--sidebar-text-muted)'; e.currentTarget.style.background = location.pathname.startsWith('/templates') ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutTemplate size={16} style={{ color: location.pathname.startsWith('/templates') ? 'white' : 'var(--sidebar-text-muted)' }} />
              Templates
            </div>
          </div>
        </Link>
      </div>

      {/* Sidebar Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>


        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="User Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#00C27A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#031B34', fontWeight: 700, fontSize: '12px' }}>
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{profile.firstName} {profile.lastName}</span>
                <span style={{ fontSize: '10px', color: 'var(--sidebar-text-muted)' }}>{profile.department || 'Marketing Manager'}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>Workspace Settings &gt;</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* AI Drawer Overlay */}
      {isAIDrawerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setIsAIDrawerOpen(false)}>
          <div style={{ width: '400px', background: '#0f172a', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={16} color="#031B34" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 600 }}>EngageX Assistant</h3>
                  <div style={{ fontSize: '12px', color: '#10b981' }}>Always active</div>
                </div>
              </div>
              <button onClick={() => setIsAIDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5' }}>
                Hello Sarah! How can I help you optimize your marketing operations today? Here are some things I can do for you:
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  "Create a churn segment",
                  "Generate a VIP campaign",
                  "Show customers likely to buy again",
                  "Why did revenue drop this week?",
                  "Build a WhatsApp recovery journey"
                ].map((action, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: 'white', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.05)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                    {action}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
                <input type="text" placeholder="Ask EngageX..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '14px' }} />
                <div style={{ background: '#10b981', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#031B34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PAGE_TITLES: Record<string, string> = {
  '/': 'Mission Control',
  '/ai-strategist': 'AI Strategist',
  '/copilot': 'AI Copilot',
  '/campaigns': 'Campaign Studio',
  '/audiences': 'Audiences Hub',
  '/audiences/create': 'Audience Builder',
  '/simulator': 'Channel Simulator',
  '/journeys': 'Journey Builder',
  '/journeys/build': 'Journey Builder',
  '/templates': 'Templates',
  '/ab-testing': 'A/B Testing',
  '/purchase-history': 'Purchase History',
  '/retention': 'Retention Intelligence',
  '/value-intelligence': 'Value Intelligence',
  '/customer-intelligence': 'Customer Intelligence',
  '/command-center': 'AI Command Center',
  '/ai-opportunities': 'AI Opportunities',
  '/settings': 'Settings & Workspace',
};

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 14 days', value: '14d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'This year', value: 'year' },
];

const NOTIFICATIONS = [
  { id: 1, type: 'campaign', icon: '🚀', title: 'Campaign Launched', desc: 'Win-Back WhatsApp campaign sent to 124 customers', time: '2m ago', unread: true },
  { id: 2, type: 'alert', icon: '⚠️', title: 'Churn Risk Alert', desc: '47 high-value customers showing churn signals', time: '15m ago', unread: true },
  { id: 3, type: 'success', icon: '✅', title: 'Segment Refreshed', desc: 'VIP Buyers segment updated — 312 customers', time: '1h ago', unread: true },
  { id: 4, type: 'info', icon: '📊', title: 'Analytics Ready', desc: 'Weekly performance report is ready to view', time: '3h ago', unread: false },
  { id: 5, type: 'info', icon: '💡', title: 'AI Insight', desc: 'New upsell opportunity detected for Shoe Buyers', time: '5h ago', unread: false },
];

const QUICK_LINKS = [
  { label: 'Create Campaign', path: '/campaigns', icon: '🚀' },
  { label: 'Customer Intelligence', path: '/customer-intelligence', icon: '🧠' },
  { label: 'Build Audience', path: '/audiences/create', icon: '👥' },
  { label: 'Channel Simulator', path: '/simulator', icon: '📡' },
  { label: 'AI Strategist', path: '/ai-strategist', icon: '✨' },
];

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate ? useNavigate() : null;
  const isAIStrategist = location.pathname === '/ai-strategist';

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    path === location.pathname || (path !== '/' && location.pathname.startsWith(path))
  )?.[1] || 'Dashboard';

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('Last 7 days');
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('crm_profileData');
    return saved ? JSON.parse(saved) : { firstName: 'Sarah', lastName: 'Johnson', department: 'Marketing Manager', avatarUrl: null };
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('crm_profileData');
      if (saved) setProfile(JSON.parse(saved));
    };
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;
  const searchRef = React.useRef<HTMLInputElement>(null);

  // ⌘K shortcut
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowDatePicker(false);
        setShowNotifications(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close all panels on outside click
  React.useEffect(() => {
    const handler = () => {
      setShowDatePicker(false);
      setShowNotifications(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  const filteredLinks = searchQuery
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : QUICK_LINKS;

  return (
    <>
      {/* AI Command Palette Overlay */}
      {showSearch && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '120px' }}
          onClick={() => { setShowSearch(false); setSearchQuery(''); }}
        >
          <div
            style={{ width: '560px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={18} style={{ color: '#64748b', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Ask EngageX anything or search pages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: 'white' }}
              />
              <span style={{ fontSize: '11px', color: '#475569', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => { setShowSearch(false); setSearchQuery(''); }}>ESC</span>
            </div>
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Navigation</div>
              {filteredLinks.map((link, i) => (
                <div
                  key={i}
                  onClick={() => { setShowSearch(false); setSearchQuery(''); navigate && navigate(link.path); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{link.icon}</span>
                  <span style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>{link.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#475569' }}>→ Navigate</span>
                </div>
              ))}
              {filteredLinks.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>No results for "{searchQuery}"</div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '11px', color: '#475569' }}>↑↓ Navigate</span>
              <span style={{ fontSize: '11px', color: '#475569' }}>↵ Select</span>
              <span style={{ fontSize: '11px', color: '#475569' }}>ESC Close</span>
            </div>
          </div>
        </div>
      )}

      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {!isAIStrategist && (
            <>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{pageTitle}</h2>

              <div
                onClick={(e) => { e.stopPropagation(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
                style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', width: '300px', cursor: 'text' }}
              >
                <Search size={16} style={{ color: 'var(--text-tertiary)', marginRight: '8px', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-tertiary)' }}>Ask EngageX anything...</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-tertiary)', fontSize: '12px', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px' }}>⌘</span>K
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Date Range Picker */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div
              onClick={() => { setShowDatePicker(!showDatePicker); setShowNotifications(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', background: showDatePicker ? 'var(--bg-tertiary)' : 'transparent', transition: 'background 0.2s' }}
            >
              <Calendar size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedDate}</span>
              <ChevronDown size={13} style={{ color: 'var(--text-secondary)', transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {showDatePicker && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 1000, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', minWidth: '180px' }}>
                {DATE_PRESETS.map(preset => (
                  <div
                    key={preset.value}
                    onClick={() => { setSelectedDate(preset.label); setShowDatePicker(false); }}
                    style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: selectedDate === preset.label ? 700 : 500, color: selectedDate === preset.label ? '#10b981' : 'white', background: selectedDate === preset.label ? 'rgba(16,185,129,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                    onMouseEnter={e => { if (selectedDate !== preset.label) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (selectedDate !== preset.label) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {preset.label}
                    {selectedDate === preset.label && <span style={{ fontSize: '12px' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div
              onClick={() => { setShowNotifications(!showNotifications); setShowDatePicker(false); }}
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-subtle)', background: showNotifications ? 'var(--bg-tertiary)' : 'transparent', transition: 'background 0.2s' }}
            >
              <Bell size={17} style={{ color: 'var(--text-primary)' }} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: '-3px', right: '-3px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, minWidth: '16px', height: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-secondary)', padding: '0 3px' }}>
                  {unreadCount}
                </div>
              )}
            </div>
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', zIndex: 1000, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', width: '360px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Notifications</span>
                  <button onClick={markAllRead} style={{ fontSize: '12px', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {notifications.map(notif => (
                    <div key={notif.id} style={{ display: 'flex', gap: '12px', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: notif.unread ? 'rgba(16,185,129,0.04)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = notif.unread ? 'rgba(16,185,129,0.04)' : 'transparent')}
                    >
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{notif.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{notif.title}</span>
                          <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0 }}>{notif.time}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{notif.desc}</div>
                      </div>
                      {notif.unread && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: '4px' }} />}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#10b981', cursor: 'pointer', fontWeight: 600 }}>View all notifications →</span>
                </div>
              </div>
            )}
          </div>

          {/* Static Profile Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px' }}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="User Profile" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.4)' }} />
            ) : (
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#00C27A', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#031B34', fontWeight: 700, fontSize: '14px' }}>
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{profile.firstName} {profile.lastName}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{profile.department || 'Marketing Manager'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <TopBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ai-strategist" element={<AIStrategistOverview />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/audiences/create" element={<AudienceBuilder />} />
              <Route path="/segments/:id" element={<SegmentDetail />} />
              <Route path="/messages/generate" element={<MessageGenerator />} />
              <Route path="/ai-opportunities" element={<AIOpportunities />} />
              <Route path="/customer-intelligence" element={<CustomerIntelligence />} />
              <Route path="/customers/:id" element={<CustomerProfile />} />
              <Route path="/purchase-history" element={<PurchaseHistory />} />
              <Route path="/retention" element={<RetentionIntelligence />} />
              <Route path="/value-intelligence" element={<ValueIntelligence />} />
              <Route path="/audiences" element={<ErrorBoundary><AudiencesHub /></ErrorBoundary>} />
              <Route path="/campaigns" element={<CampaignStudio />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/editor/:id" element={<TemplateEditor />} />
              <Route path="/ab-testing" element={<ABTesting />} />
              <Route path="/journeys" element={<Journeys />} />
              <Route path="/journeys/build" element={<JourneyBuilder />} />
              <Route path="/journeys/analytics/:id" element={<JourneyAnalytics />} />
              <Route path="/simulator" element={<ChannelSimulator />} />
              <Route path="/command-center" element={<AICommandCenter />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
