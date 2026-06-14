import  { useState } from 'react';
import { 
  User, Users, Shield, Palette, MessageSquare, Zap, 
  Blocks, CreditCard, Lock, Activity
} from 'lucide-react';

import ProfileTab from './settings/ProfileTab';
import TeamMembersTab from './settings/TeamMembersTab';
import RolesTab from './settings/RolesTab';
import BrandTab from './settings/BrandTab';
import ChannelsTab from './settings/ChannelsTab';
import AIPrefsTab from './settings/AIPrefsTab';
import IntegrationsTab from './settings/IntegrationsTab';
import BillingTab from './settings/BillingTab';
import SecurityTab from './settings/SecurityTab';
import AuditTab from './settings/AuditTab';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'brand', label: 'Brand Settings', icon: Palette },
    { id: 'channels', label: 'Communication Channels', icon: MessageSquare },
    { id: 'ai', label: 'AI Preferences', icon: Zap },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
  ];

  const handleTabChange = (id: string) => {
    if (isProfileDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave without saving?")) {
        return;
      }
      setIsProfileDirty(false);
    }
    setActiveTab(id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab setDirty={setIsProfileDirty} />;
      case 'team': return <TeamMembersTab />;
      case 'roles': return <RolesTab />;
      case 'brand': return <BrandTab setDirty={setIsProfileDirty} />;
      case 'channels': return <ChannelsTab />;
      case 'ai': return <AIPrefsTab setDirty={setIsProfileDirty} />;
      case 'integrations': return <IntegrationsTab />;
      case 'billing': return <BillingTab />;
      case 'security': return <SecurityTab />;
      case 'audit': return <AuditTab />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Settings & Workspace</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
          Manage your account, team members, and integration settings.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Navigation Sidebar */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '14px', transition: '0.2s', width: '100%'
              }}
            >
              <tab.icon size={16} color={activeTab === tab.id ? '#00C27A' : 'var(--text-secondary)'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          {renderContent()}
        </div>
      </div>

    </div>
  );
}
