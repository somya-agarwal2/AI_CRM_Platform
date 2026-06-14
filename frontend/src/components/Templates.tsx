import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutTemplate, Plus, Zap, Copy, Trash, Eye, 
  Search, Filter, ArrowUpDown, Grid, List,
  TrendingUp, BarChart2, MousePointerClick, Activity,
  Download, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard State
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const categories = [
    'All', 'Win Back', 'Cart Recovery', 'VIP', 'Cross Sell', 
    'Product Launch', 'Newsletter', 'Birthday', 'Seasonal', 
    'Abandoned Cart', 'Loyalty', 'Promotional'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_URL}/templates`);
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  };

  const createBlankTemplate = async () => {
    try {
      const res = await axios.post(`${API_URL}/templates`, {
        name: 'Untitled Template',
        category: 'Promotional',
        json_content: JSON.stringify({ blocks: [] })
      });
      navigate(`/templates/editor/${res.data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/templates/ai-generate`, { prompt: aiPrompt });
      const newTemplate = res.data;
      const saveRes = await axios.post(`${API_URL}/templates`, newTemplate);
      setShowAIModal(false);
      setAiPrompt('');
      navigate(`/templates/editor/${saveRes.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate template.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await axios.delete(`${API_URL}/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateTemplate = async (t: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/templates`, {
        name: `${t.name} (Copy)`,
        category: t.category,
        html_content: t.html_content,
        json_content: t.json_content,
        thumbnail: t.thumbnail
      });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (activeCategory !== 'All' && t.category !== activeCategory) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const avgOpenRate = templates.length > 0 
    ? (templates.reduce((acc, t) => acc + (t.open_rate || 0), 0) / templates.length).toFixed(1) 
    : 0;
  const avgConv = templates.length > 0 
    ? (templates.reduce((acc, t) => acc + (t.conversion_rate || 0), 0) / templates.length).toFixed(1) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      
      {/* SECTION 1: Top Statistics & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Template Studio
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Manage, generate, and analyze your marketing templates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={createBlankTemplate} style={{ gap: '8px' }}>
            <Plus size={16} /> Create Blank
          </button>
          <button className="btn btn-primary" onClick={() => setShowAIModal(true)} style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', gap: '8px' }}>
            <Zap size={16} /> Generate with AI
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate size={20} color="var(--accent-secondary)" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Templates</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{templates.length}</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>AI Generated</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {templates.filter(t => t.name.includes('AI')).length}
          </div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Avg Open Rate</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{avgOpenRate}%</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#ec4899" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Avg Conversion</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{avgConv}%</div>
        </div>
      </div>

      {/* SECTION 2 & 3: Template Library & Categories */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', flex: 1, marginRight: '24px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                  borderColor: activeCategory === cat ? 'var(--accent-secondary)' : 'var(--border-subtle)',
                  background: activeCategory === cat ? 'rgba(36, 138, 88, 0.1)' : 'transparent',
                  color: activeCategory === cat ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search templates..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px 8px 36px', borderRadius: '8px', fontSize: '13px', width: '200px' }}
              />
            </div>
            <button className="btn btn-secondary" style={{ padding: '8px' }}><Filter size={16}/></button>
            <button className="btn btn-secondary" style={{ padding: '8px' }}><ArrowUpDown size={16}/></button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px', background: viewMode === 'grid' ? 'var(--bg-primary)' : 'transparent', border: 'none', color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}><Grid size={16}/></button>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px', background: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent', border: 'none', color: viewMode === 'list' ? 'white' : 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}><List size={16}/></button>
            </div>
          </div>
        </div>

        {/* Library Rendering */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LayoutTemplate size={48} color="var(--border-strong)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No templates found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Try adjusting your filters or generating a new one.</p>
            <button className="btn btn-primary" onClick={() => setShowAIModal(true)}>Generate Template</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredTemplates.map(t => (
              <div key={t.id} className="card card-hover" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* Thumbnail */}
                <div 
                  style={{ height: '180px', background: 'var(--bg-tertiary)', position: 'relative', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                  onClick={() => navigate(`/templates/editor/${t.id}`)}
                >
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={40} color="var(--border-strong)" />
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="template-hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0, transition: 'opacity 0.2s' }}>
                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/templates/editor/${t.id}`); }}>Edit</button>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); }}>Preview</button>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Updated {new Date(t.updated_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontSize: '11px', background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                      {t.category}
                    </div>
                  </div>

                  {/* Analytics Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Used</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.usage_count || 0}x</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Open</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(t.open_rate || 0).toFixed(1)}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(t.click_rate || 0).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', gap: '6px' }} onClick={(e) => duplicateTemplate(t, e)}>
                      <Copy size={14} /> Duplicate
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={(e) => deleteTemplate(t.id, e)}>
                      <Trash size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTemplates.map(t => (
              <div key={t.id} className="card card-hover" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer' }} onClick={() => navigate(`/templates/editor/${t.id}`)}>
                {/* Thumbnail */}
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} color="var(--border-strong)" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</h3>
                    <div style={{ fontSize: '11px', background: 'rgba(36, 138, 88, 0.1)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      {t.category}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Updated {new Date(t.updated_at).toLocaleDateString()}</div>
                </div>

                {/* Analytics */}
                <div style={{ display: 'flex', gap: '32px', paddingRight: '24px', borderRight: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Used</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.usage_count || 0}x</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Open</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(t.open_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(t.click_rate || 0).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', paddingLeft: '12px' }}>
                  <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={(e) => duplicateTemplate(t, e)} title="Duplicate">
                    <Copy size={16} />
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={(e) => deleteTemplate(t.id, e)} title="Delete">
                    <Trash size={16} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: AI Template Generation Modal */}
      {showAIModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '600px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(36, 138, 88, 0.1), transparent)' }}>
              <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap color="var(--accent-secondary)" /> Generate Template
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                Describe your campaign goal. Gemini will architect the layout, write the copy, and structure the design.
              </p>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Prompt</label>
                <textarea 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Create a luxury fashion email for VIP customers launching a new summer collection..."
                  style={{ width: '100%', height: '140px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Try these examples</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Create a luxury fashion VIP campaign', 'Create a cart recovery email', 'Create a festival discount campaign', 'Create a premium electronics upsell email'].map(ex => (
                    <button key={ex} onClick={() => setAiPrompt(ex)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '20px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='var(--text-secondary)'}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-secondary)' }}>
              <button className="btn btn-secondary" onClick={() => setShowAIModal(false)} disabled={generating}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAIGenerate} disabled={generating || !aiPrompt.trim()} style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none' }}>
                {generating ? 'Generating Magic...' : 'Generate Template'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .template-hover-overlay:hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
