import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { 
  ArrowLeft, Save, LayoutTemplate, Type, Image as ImageIcon, Square, Minus, 
  Settings2, Monitor, Tablet, Smartphone, Sparkles, Trash2, CheckCircle2,
  Ticket, Grid, ShoppingBag, Link as LinkIcon, Heading, PanelBottom, Video, Timer,
  GripVertical, Copy
} from 'lucide-react';

const BLOCK_TYPES = [
  { type: 'Text', icon: <Type size={16} /> },
  { type: 'Image', icon: <ImageIcon size={16} /> },
  { type: 'Button', icon: <Square size={16} /> },
  { type: 'Divider', icon: <Minus size={16} /> },
  { type: 'Spacer', icon: <Minus size={16} style={{ opacity: 0.5 }} /> },
  { type: 'Coupon', icon: <Ticket size={16} /> },
  { type: 'Product Grid', icon: <Grid size={16} /> },
  { type: 'Recommendations', icon: <ShoppingBag size={16} /> },
  { type: 'Social Links', icon: <LinkIcon size={16} /> },
  { type: 'Header', icon: <Heading size={16} /> },
  { type: 'Footer', icon: <PanelBottom size={16} /> },
  { type: 'Video', icon: <Video size={16} /> },
  { type: 'Countdown Timer', icon: <Timer size={16} /> }
];

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  
  // Drag and drop state
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  
  // AI Image Prompt State
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptText, setAiPromptText] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await axios.get(`${API_URL}/templates`);
      const t = res.data.find((x: any) => x.id === id);
      if (t) {
        setTemplate(t);
        try {
          const parsed = JSON.parse(t.json_content);
          setBlocks(parsed.blocks || []);
        } catch(e) {
          setBlocks([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    
    // Auto-update thumbnail based on first Image block
    const firstImageBlock = blocks.find(b => b.type === 'Image' && b.url);
    const newThumbnail = firstImageBlock ? firstImageBlock.url : template.thumbnail;

    try {
      await axios.put(`${API_URL}/templates/${id}`, {
        name: template.name,
        category: template.category,
        thumbnail: newThumbnail,
        json_content: JSON.stringify({ blocks })
      });
      
      // Update local state to reflect the new thumbnail if it changed
      setTemplate({ ...template, thumbnail: newThumbnail });
      
      setTimeout(() => setSaving(false), 800);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const addBlock = (type: string) => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getPlaceholderContent(type),
      styles: getDefaultStyles(type)
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const getPlaceholderContent = (type: string) => {
    switch (type) {
      case 'Header': return 'NEW COLLECTION ARRIVED';
      case 'Text': return 'Hi {{first_name}},\n\nWelcome to our exclusive list. We have selected some {{favorite_category}} items just for you.';
      case 'Button': return 'Shop Now';
      case 'Coupon': return 'SAVE20';
      case 'Countdown Timer': return 'Ends in: 24:00:00';
      default: return '';
    }
  };

  const getDefaultStyles = (type: string) => {
    const base = { padding: '16px', margin: '0px', textAlign: 'left', color: '#ffffff', backgroundColor: 'transparent' };
    if (type === 'Header') return { ...base, fontSize: '28px', fontWeight: 'bold', textAlign: 'center' };
    if (type === 'Button') return { ...base, backgroundColor: 'var(--accent-secondary)', textAlign: 'center', borderRadius: '4px', display: 'inline-block', padding: '12px 24px' };
    if (type === 'Coupon') return { ...base, border: '2px dashed var(--accent-secondary)', textAlign: 'center', fontSize: '24px', letterSpacing: '2px', backgroundColor: 'rgba(36, 138, 88, 0.1)' };
    if (type === 'Spacer') return { height: '32px' };
    if (type === 'Divider') return { height: '1px', backgroundColor: 'var(--border-subtle)', margin: '16px 0' };
    return base;
  };

  const updateSelectedBlock = (field: string, value: any, isStyle = false) => {
    setBlocks(blocks.map(b => {
      if (b.id === selectedBlockId) {
        if (isStyle) return { ...b, styles: { ...b.styles, [field]: value } };
        return { ...b, [field]: value };
      }
      return b;
    }));
  };

  const deleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (block: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
    const index = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const [rewriteStatus, setRewriteStatus] = useState<string>('');

  const handleAIRewrite = async (instruction: string) => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return;
    setRewriting(true);
    setRewriteStatus('Rewriting with AI...');
    try {
      const res = await axios.post(`${API_URL}/templates/ai-rewrite`, { block_json: block, instruction }, { timeout: 30000 });
      // Merge new content back while keeping the same block id and type
      setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, content: res.data.content ?? res.data } : b));
      setRewriteStatus('✓ Done!');
      setTimeout(() => setRewriteStatus(''), 2000);
    } catch (err: any) {
      console.error('AI Rewrite failed:', err);
      setRewriteStatus('⚠ Failed. Check connection.');
      setTimeout(() => setRewriteStatus(''), 3000);
    } finally {
      setRewriting(false);
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (index: number) => {
    setDraggedBlockIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === index) return;
    
    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedBlockIndex];
    newBlocks.splice(draggedBlockIndex, 1);
    newBlocks.splice(index, 0, draggedBlock);
    
    setDraggedBlockIndex(index);
    setBlocks(newBlocks);
  };

  const handleDrop = () => {
    setDraggedBlockIndex(null);
  };

  if (!template) return <div style={{ padding: '40px', color: 'var(--text-primary)' }}>Loading Editor...</div>;

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const getCanvasWidth = () => viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '800px';

  // AI Personalization Renderer
  const renderContent = (content: string) => {
    if (!content) return null;
    let html = content;
    html = html.replace(/{{first_name}}/g, '<span style="color:var(--accent-secondary)">John</span>');
    html = html.replace(/{{last_purchase}}/g, '<span style="color:var(--accent-secondary)">Premium Watch</span>');
    html = html.replace(/{{favorite_category}}/g, '<span style="color:var(--accent-secondary)">Accessories</span>');
    html = html.replace(/{{loyalty_points}}/g, '<span style="color:var(--accent-secondary)">1,250</span>');
    return <div dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, '<br/>') }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', margin: '-24px', background: 'var(--bg-primary)' }}>
      {/* SECTION: Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn" style={{ padding: '8px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} onClick={() => navigate('/templates')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <input 
              value={template.name}
              onChange={e => setTemplate({...template, name: e.target.value})}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, outline: 'none', width: '300px' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{template.category}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setViewMode('desktop')} style={{ padding: '6px', background: viewMode === 'desktop' ? 'var(--bg-primary)' : 'transparent', border: 'none', color: viewMode === 'desktop' ? 'var(--text-primary)' : 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}><Monitor size={16} /></button>
          <button onClick={() => setViewMode('tablet')} style={{ padding: '6px', background: viewMode === 'tablet' ? 'var(--bg-primary)' : 'transparent', border: 'none', color: viewMode === 'tablet' ? 'var(--text-primary)' : 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}><Tablet size={16} /></button>
          <button onClick={() => setViewMode('mobile')} style={{ padding: '6px', background: viewMode === 'mobile' ? 'var(--bg-primary)' : 'transparent', border: 'none', color: viewMode === 'mobile' ? 'var(--text-primary)' : 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}><Smartphone size={16} /></button>
        </div>

        <button className="btn btn-primary" onClick={handleSave} style={{ padding: '8px 24px', gap: '8px', background: saving ? '#10b981' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none' }}>
          {saving ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving ? 'Saved' : 'Save Template'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SECTION: Left Panel - 13 Blocks */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>Content Blocks</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {BLOCK_TYPES.map(b => (
              <div 
                key={b.type}
                onClick={() => addBlock(b.type)}
                style={{ padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ color: 'var(--accent-secondary)' }}>{b.icon}</div>
                <span style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>{b.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: Center Canvas - Real-time Render & Drag/Drop */}
        <div style={{ flex: 1, background: '#0f172a', overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ 
            width: getCanvasWidth(), 
            background: 'var(--bg-primary)', 
            minHeight: '800px', 
            borderRadius: viewMode === 'desktop' ? '0px' : '36px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            border: viewMode === 'desktop' ? '1px dashed var(--border-subtle)' : '12px solid #1e293b',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}>
            {blocks.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column', gap: '20px' }}>
                <LayoutTemplate size={64} opacity={0.2} />
                <span style={{ fontSize: '16px', fontWeight: 600 }}>Drag or click blocks from the left panel to begin.</span>
              </div>
            ) : (
              <div style={{ padding: viewMode === 'desktop' ? '40px' : '20px', display: 'flex', flexDirection: 'column' }}>
                {blocks.map((block, index) => (
                  <div 
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    onClick={() => setSelectedBlockId(block.id)}
                    style={{
                      position: 'relative',
                      cursor: 'grab',
                      border: selectedBlockId === block.id ? '2px solid var(--accent-secondary)' : '2px solid transparent',
                      opacity: draggedBlockIndex === index ? 0.5 : 1,
                      transition: 'border 0.2s, opacity 0.2s',
                      marginBottom: '8px',
                      ...block.styles,
                    }}
                  >
                    {/* Hover Controls */}
                    {selectedBlockId === block.id && (
                      <div style={{ position: 'absolute', top: '-14px', right: '-14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '2px', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '6px', cursor: 'grab', color: 'var(--text-secondary)' }}><GripVertical size={14}/></div>
                        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }}/>
                        <button onClick={(e) => duplicateBlock(block, e)} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}><Copy size={14}/></button>
                        <button onClick={(e) => deleteBlock(block.id, e)} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14}/></button>
                      </div>
                    )}

                    {/* Block Content Rendering */}
                    {block.type === 'Spacer' && <div style={{ height: block.styles?.height || '32px' }} />}
                    {block.type === 'Divider' && <hr style={{ borderTop: `1px solid ${block.styles?.color || '#333'}` }} />}
                    {block.type === 'Image' && (
                      block.url === '__generating__' ? (
                        <div style={{ height: '200px', background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '13px' }}>
                          <Sparkles size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating AI image...
                        </div>
                      ) : block.url ? (
                        <img src={block.url} alt="Template Image" style={{ width: '100%', display: 'block', ...block.styles }} />
                      ) : (
                        <div style={{ height: '200px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-strong)' }}><ImageIcon size={48} /></div>
                      )
                    )}
                    {block.type === 'Video' && <div style={{ height: '200px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}><Video size={48} /></div>}
                    {block.type === 'Product Grid' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[1, 2].map(i => (
                          <div key={i} style={{ background: 'var(--bg-tertiary)', padding: '16px', textAlign: 'center' }}>
                            <div style={{ height: '120px', background: 'var(--bg-primary)', marginBottom: '12px' }}></div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>Product Name</div>
                            <div style={{ color: 'var(--accent-secondary)', fontSize: '13px', marginTop: '4px' }}>$99.00</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(block.type === 'Text' || block.type === 'Header' || block.type === 'Button' || block.type === 'Coupon' || block.type === 'Countdown Timer' || block.type === 'Footer') && (
                      <div>{renderContent(block.content)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION: Right Panel - Properties & AI Rewriter */}
        <div style={{ width: '320px', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} /> Block Properties
          </h3>
          
          {!selectedBlock ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '60px' }}>
              Select a block on the canvas to configure styling and AI content.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Content & AI Section */}
              {(selectedBlock.type === 'Text' || selectedBlock.type === 'Header' || selectedBlock.type === 'Button' || selectedBlock.type === 'Coupon') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Content</label>
                  <textarea 
                    value={selectedBlock.content}
                    onChange={(e) => updateSelectedBlock('content', e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', minHeight: '120px', resize: 'vertical', fontSize: '13px', lineHeight: '1.5', fontFamily: 'inherit' }}
                  />
                  
                  {/* Variables Hint */}
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Supports variables: {"{{first_name}}"}, {"{{loyalty_points}}"}
                  </div>
                  
                  {/* SECTION 8: AI Block Rewriter */}
                  <div style={{ marginTop: '16px', padding: '16px', background: 'linear-gradient(135deg, rgba(36, 138, 88, 0.1), transparent)', border: '1px solid rgba(36, 138, 88, 0.3)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} style={{ animation: rewriting ? 'spin 1s linear infinite' : 'none' }} /> AI Rewriter
                      </span>
                      {rewriteStatus && (
                        <span style={{
                          fontSize: '11px',
                          color: rewriteStatus.includes('✓') ? '#10b981' : rewriteStatus.includes('⚠') ? '#ef4444' : 'var(--accent-secondary)',
                          fontWeight: 600,
                          animation: 'fadeIn 0.2s ease-out'
                        }}>
                          {rewriteStatus}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Professional', instruction: 'Make it professional and elegant' },
                        { label: 'Punchy', instruction: 'Make it punchy and conversion-focused' },
                      ].map(({ label, instruction }) => (
                        <button
                          key={label}
                          onClick={() => handleAIRewrite(instruction)}
                          disabled={rewriting}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '11px', padding: '8px 6px',
                            background: rewriting ? 'rgba(36,138,88,0.08)' : 'var(--bg-primary)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            cursor: rewriting ? 'not-allowed' : 'pointer',
                            opacity: rewriting ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Sparkles size={10} style={{ animation: rewriting ? 'spin 1s linear infinite' : 'none', opacity: rewriting ? 1 : 0.6 }} />
                          {label}
                        </button>
                      ))}
                      <button
                        onClick={() => handleAIRewrite('Make it create a sense of urgency')}
                        disabled={rewriting}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '11px', padding: '8px 6px', gridColumn: 'span 2',
                          background: rewriting ? 'rgba(36,138,88,0.08)' : 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          cursor: rewriting ? 'not-allowed' : 'pointer',
                          opacity: rewriting ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <Sparkles size={10} style={{ animation: rewriting ? 'spin 1s linear infinite' : 'none', opacity: rewriting ? 1 : 0.6 }} />
                        Add Urgency
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Section */}
              {selectedBlock.type === 'Image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Image Source URL</label>
                  <input 
                    type="text"
                    value={selectedBlock.url || ''}
                    onChange={(e) => updateSelectedBlock('url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '8px', background: aiPromptOpen ? 'rgba(36, 138, 88, 0.2)' : 'var(--bg-primary)', color: aiPromptOpen ? 'var(--accent-secondary)' : 'var(--text-primary)', border: aiPromptOpen ? '1px solid var(--accent-secondary)' : '1px solid var(--border-subtle)' }} onClick={() => setAiPromptOpen(!aiPromptOpen)}>
                      <Sparkles size={12} style={{ marginRight: '4px' }}/> Generate AI
                    </button>
                    
                    <label className="btn btn-secondary" style={{ fontSize: '11px', padding: '8px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                      Import Computer
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                updateSelectedBlock('url', event.target.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {aiPromptOpen && (
                    <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--accent-secondary)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={11} style={{ color: 'var(--accent-secondary)' }} />
                        Describe the image you want (AI-powered)
                      </label>
                      <textarea 
                        value={aiPromptText}
                        onChange={e => setAiPromptText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.currentTarget.closest('div')?.querySelector<HTMLButtonElement>('.generate-btn')?.click();
                          }
                        }}
                        placeholder="e.g. A luxurious product display with golden accents on dark background"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', fontSize: '12px', resize: 'vertical', minHeight: '72px', outline: 'none' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['Product showcase', 'Hero banner', 'Lifestyle photo', 'Abstract art', 'Sale banner'].map(preset => (
                          <button key={preset} onClick={() => setAiPromptText(preset)} style={{ fontSize: '10px', padding: '3px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}>{preset}</button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Ctrl+Enter to generate</span>
                        <button 
                          className="btn btn-primary generate-btn" 
                          style={{ fontSize: '11px', padding: '7px 14px', background: generatingImage ? 'rgba(36,138,88,0.6)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: generatingImage ? 'not-allowed' : 'pointer' }}
                          disabled={generatingImage || !aiPromptText.trim()}
                          onClick={async () => {
                            if (!aiPromptText.trim()) return;
                            setGeneratingImage(true);
                            // Set a loading placeholder so user sees feedback in canvas
                            updateSelectedBlock('url', '__generating__');
                            
                            try {
                              const encoded = encodeURIComponent(aiPromptText);
                              const seed = Math.floor(Math.random() * 999999);
                              const aiUrl = `https://image.pollinations.ai/prompt/${encoded}?width=600&height=400&seed=${seed}&nologo=true&enhance=true`;
                              // Pre-load image before swapping into canvas
                              await new Promise<void>((resolve, reject) => {
                                const img = new Image();
                                img.onload = () => resolve();
                                img.onerror = () => reject(new Error('Image load failed'));
                                img.src = aiUrl;
                                // Timeout after 20s
                                setTimeout(() => reject(new Error('timeout')), 20000);
                              });
                              updateSelectedBlock('url', aiUrl);
                              setAiPromptOpen(false);
                              setAiPromptText("");
                            } catch (err) {
                              // fallback to loremflickr on error
                              const words = aiPromptText.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
                              updateSelectedBlock('url', `https://loremflickr.com/600/400/${words.slice(0,3).join(',') || 'product'}?random=${Math.random()}`);
                              setAiPromptOpen(false);
                              setAiPromptText("");
                            } finally {
                              setGeneratingImage(false);
                            }
                          }}
                        >
                          {generatingImage 
                            ? <><Sparkles size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                            : <><Sparkles size={12} /> Generate Image</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Design Section */}
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }}/>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Design Settings</div>

              {/* Typography */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Text Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={selectedBlock.styles.color || '#ffffff'} onChange={(e) => updateSelectedBlock('color', e.target.value, true)} style={{ width: '32px', height: '32px', padding: 0, border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer' }} />
                    <input type="text" value={selectedBlock.styles.color || '#ffffff'} onChange={(e) => updateSelectedBlock('color', e.target.value, true)} style={{ flex: 1, width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0 8px', borderRadius: '6px', fontSize: '12px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bg Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={selectedBlock.styles.backgroundColor || '#000000'} onChange={(e) => updateSelectedBlock('backgroundColor', e.target.value, true)} style={{ width: '32px', height: '32px', padding: 0, border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer' }} />
                    <input type="text" value={selectedBlock.styles.backgroundColor || 'transparent'} onChange={(e) => updateSelectedBlock('backgroundColor', e.target.value, true)} style={{ flex: 1, width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0 8px', borderRadius: '6px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              {/* Spacing & Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Font Size</label>
                  <input type="text" value={selectedBlock.styles.fontSize || ''} onChange={(e) => updateSelectedBlock('fontSize', e.target.value, true)} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', fontSize: '12px' }} placeholder="e.g. 16px" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Alignment</label>
                  <select 
                    value={selectedBlock.styles.textAlign || 'left'} 
                    onChange={(e) => updateSelectedBlock('textAlign', e.target.value, true)}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', outline: 'none', fontSize: '12px' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Padding</label>
                <input type="text" value={selectedBlock.styles.padding || '0px'} onChange={(e) => updateSelectedBlock('padding', e.target.value, true)} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', fontSize: '12px' }} placeholder="e.g. 16px 24px" />
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
