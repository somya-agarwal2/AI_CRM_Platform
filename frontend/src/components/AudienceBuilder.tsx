import  { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Filter, Plus,  X, Sparkles, Database, ChevronRight, Check } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';

import API_URL from '../config';

export default function AudienceBuilder() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const sourceParam = searchParams.get('source'); // 'ai' or null
  const promptParam = searchParams.get('prompt');
  const titleParam = searchParams.get('title');
  const descParam = searchParams.get('desc');
  
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'manual' | 'ai' | 'import' | null>(sourceParam === 'ai' ? 'ai' : null);
  
  // Segment Data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Manual Build State
  const [filters, setFilters] = useState<any[]>([{ field: 'city', operator: 'equals', value: '' }]);
  
  // AI Build State
  const [aiPrompt, setAiPrompt] = useState(promptParam || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string[]>([]);
  
  // Preview State
  const [preview, setPreview] = useState<any[]>([]);
  const [audienceCount, setAudienceCount] = useState(0);
  const [potentialRevenue, setPotentialRevenue] = useState(0);

  // New state for Journey Generation at Save Step
  const [createJourney, setCreateJourney] = useState(false);
  const [journeyPrompt, setJourneyPrompt] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    const initializeAiSegment = async () => {
      if (sourceParam === 'ai' && promptParam) {
        setMethod('ai');
        setStep(2);
        generateAI(promptParam);
        
        if (titleParam) {
          try {
            const res = await axios.get(`${API_URL}/segments`);
            const existingNames = new Set(res.data.map((s: any) => s.name));
            let uniqueName = titleParam;
            let counter = 1;
            while (existingNames.has(uniqueName)) {
              uniqueName = `${titleParam} (${counter})`;
              counter++;
            }
            setName(uniqueName);
          } catch (e) {
            setName(titleParam); // fallback
          }
        }
        if (descParam) setDescription(descParam);
      }
    };

    if (editId) {
      loadSegmentForEdit(editId);
    } else {
      initializeAiSegment();
    }
  }, [editId, sourceParam, promptParam, titleParam, descParam]);

  const loadSegmentForEdit = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/segments/${id}`);
      setName(res.data.name);
      setDescription(res.data.description || '');
      if (res.data.filters && res.data.filters.length > 0) {
        setFilters(res.data.filters);
      }
      setMethod('manual');
      setStep(2);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: 'Failed to load segment for editing.' });
    }
  };

  const fetchPreview = async (currentFilters: any[]) => {
    if (currentFilters.length === 0 || (currentFilters.length === 1 && !currentFilters[0].value)) {
      setPreview([]);
      setAudienceCount(0);
      setPotentialRevenue(0);
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/segments/preview`, { filters: currentFilters });
      setPreview(res.data.preview);
      setAudienceCount(res.data.count);
      setPotentialRevenue(res.data.potential_revenue);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Manual Methods ---
  const addFilter = () => setFilters([...filters, { field: 'city', operator: 'equals', value: '' }]);
  const updateFilter = (index: number, key: string, value: any) => {
    const newFilters = [...filters];
    newFilters[index][key] = value;
    if (key === 'field') {
      if (value === 'city') newFilters[index].operator = 'equals';
      if (['total_spent', 'order_count', 'last_purchase_days', 'churn_score'].includes(value)) {
        newFilters[index].operator = 'greater_than';
      }
    }
    setFilters(newFilters);
  };
  const removeFilter = (index: number) => setFilters(filters.filter((_, i) => i !== index));

  // --- AI Methods ---
  const generateAI = async (promptToUse: string = aiPrompt) => {
    if (!promptToUse.trim()) return;
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/ai/segment/generate`, { prompt: promptToUse });
      if (res.data) {
        setFilters(res.data);
        
        // Mock Interpretation
        const interpretation = res.data.map((f: any, idx: number) => {
          let ruleStr = "";
          if (f.field === 'total_spent') ruleStr = `Total Spend ${f.operator === 'greater_than' ? '>' : '<'} $${f.value}`;
          else if (f.field === 'last_purchase_days') ruleStr = `Last Purchase > ${f.value} Days`;
          else if (f.field === 'churn_score') ruleStr = `High Risk (Churn > ${(f.value * 100).toFixed(0)}%)`;
          else ruleStr = `${f.field} ${f.operator} ${f.value}`;
          return `Rule ${idx + 1}: ${ruleStr}`;
        });
        setAiInterpretation(interpretation);
        
        // Auto preview
        await fetchPreview(res.data);
        setStep(3); // Jump to preview
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAudience = async () => {
    setStatus(null);
    if (!name) {
      setStatus({ type: 'error', message: "Please enter an audience name." });
      return;
    }
    
    setIsSaving(true);
    try {
      let createdId = editId;
      if (editId) {
        await axios.put(`${API_URL}/segments/${editId}`, { name, description, filters, count: audienceCount });
      } else {
        const res = await axios.post(`${API_URL}/segments`, { name, description, filters, count: audienceCount });
        createdId = res.data.id;
      }
      setStatus({ type: 'success', message: 'Segment saved successfully!' });
      
      setTimeout(() => {
        if (createJourney) {
          navigate('/journeys/build', { 
            state: { 
              segmentId: createdId,
              segmentName: name,
              audienceSize: audienceCount,
              initialPrompt: journeyPrompt || `Create an automation workflow for ${name}` 
            } 
          });
        } else {
          navigate(`/segments/${createdId}`);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: 'Error saving segment.' });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async () => {
    if (step === 1 && !method) return;
    if (step === 2 && method === 'manual') {
      await fetchPreview(filters);
    }
    setStep(step + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header & Breadcrumb */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', cursor: 'pointer' }}>
          <span onClick={() => navigate('/audiences')} style={{ textDecoration: 'underline' }}>Segments</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{editId ? 'Edit Segment' : 'Create Segment'}</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={24} color="var(--accent-secondary)" /> {editId ? 'Edit Segment' : 'Create Segment'}
        </h1>
      </div>

      {/* Wizard Progress */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['Choose Method', 'Define Audience', 'Preview', 'Save'].map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={i} style={{ flex: 1, height: '4px', background: isActive ? 'var(--accent-secondary)' : isDone ? 'var(--accent-secondary)' : 'var(--border-strong)', borderRadius: '2px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '12px', left: 0, fontSize: '11px', fontWeight: 600, color: isActive ? 'var(--accent-secondary)' : isDone ? 'var(--accent-secondary)' : 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <div style={{ height: '16px' }}></div> {/* spacer */}

      {status && (
        <div style={{ padding: '16px', borderRadius: '8px', background: status.type === 'success' ? 'rgba(36, 138, 88, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--accent-secondary)' : '#ef4444', border: `1px solid ${status.type === 'success' ? 'rgba(36, 138, 88, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
          {status.message}
        </div>
      )}

      {/* Step 1: Choose Method */}
      {step === 1 && (
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>How would you like to build this segment?</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Manual */}
            <div 
              onClick={() => setMethod('manual')}
              style={{ padding: '24px', border: `2px solid ${method === 'manual' ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`, borderRadius: '12px', cursor: 'pointer', background: method === 'manual' ? 'rgba(36, 138, 88, 0.05)' : 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Filter size={24} color="var(--accent-secondary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Manual Rules</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Build segments using precision filters and conditions.</p>
              </div>
            </div>

            {/* AI Generated */}
            <div 
              onClick={() => setMethod('ai')}
              style={{ padding: '24px', border: `2px solid ${method === 'ai' ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`, borderRadius: '12px', cursor: 'pointer', background: method === 'ai' ? 'rgba(36, 138, 88, 0.05)' : 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} color="var(--accent-secondary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>AI Generated</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Describe your audience in plain English and let AI build it.</p>
              </div>
            </div>

            {/* Import */}
            <div 
              onClick={() => setMethod('import')}
              style={{ padding: '24px', border: `2px solid ${method === 'import' ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`, borderRadius: '12px', cursor: 'pointer', background: method === 'import' ? 'rgba(36, 138, 88, 0.05)' : 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', opacity: 0.7 }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={24} color="var(--accent-secondary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Import Existing</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Upload a CSV file of customer IDs or emails.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Define Audience */}
      {step === 2 && method === 'manual' && (
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Define Rules</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filters.map((filter, index) => (
              <div key={index} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                {index > 0 && <div style={{ position: 'absolute', top: '-14px', left: '16px', fontSize: '10px', fontWeight: 700, color: 'var(--accent-secondary)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>AND</div>}
                <button 
                  onClick={() => removeFilter(index)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <select className="input-field" value={filter.field} onChange={(e) => updateFilter(index, 'field', e.target.value)} style={{ width: '200px' }}>
                    <option value="city">City</option>
                    <option value="total_spent">Total Spent ($)</option>
                    <option value="order_count">Total Orders</option>
                    <option value="last_purchase_days">Days Since Last Purchase</option>
                    <option value="churn_score">Churn Risk Score</option>
                  </select>

                  <select className="input-field" value={filter.operator} onChange={(e) => updateFilter(index, 'operator', e.target.value)} style={{ width: '150px' }}>
                    {filter.field === 'city' ? (
                      <>
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                      </>
                    ) : (
                      <>
                        <option value="greater_than">{'>'} Greater</option>
                        <option value="less_than">{'<'} Less</option>
                        <option value="equals">{'='} Equals</option>
                      </>
                    )}
                  </select>
                  
                  <input 
                    type={filter.field === 'city' ? 'text' : 'number'}
                    className="input-field" placeholder="Value" 
                    value={filter.value} onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            ))}
            
            <button className="btn btn-secondary" onClick={addFilter} style={{ width: '100%', borderStyle: 'dashed', marginTop: '8px' }}>
              <Plus size={16} /> Add Rule
            </button>
          </div>
        </div>
      )}

      {step === 2 && method === 'ai' && (
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(135deg, rgba(36, 138, 88, 0.05) 0%, rgba(0, 0, 0, 0) 100%)', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-secondary)" /> What audience do you want to build?
          </h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder='e.g., "Find VIP customers from New York who are likely to churn..."' 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{ flex: 1, padding: '16px 20px', fontSize: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(139, 92, 246, 0.4)' }}
              onKeyDown={(e) => e.key === 'Enter' && generateAI()}
            />
            <button className="btn btn-primary" onClick={() => generateAI()} disabled={isGenerating} style={{ padding: '0 32px', fontSize: '16px', borderRadius: '12px' }}>
              {isGenerating ? 'Analyzing...' : 'Generate Rules'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && method === 'import' && (
        <div className="card" style={{ padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', borderStyle: 'dashed' }}>
           <Database size={48} color="var(--text-tertiary)" />
           <div>
             <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Upload CSV</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Drag and drop a CSV file containing customer IDs or Emails.</p>
           </div>
           <button className="btn btn-secondary" style={{ marginTop: '16px' }}>Browse Files</button>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Interpretation (If AI method was used) */}
          {method === 'ai' && aiInterpretation.length > 0 && (
            <div className="card" style={{ padding: '24px', background: 'rgba(36, 138, 88, 0.05)', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-secondary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} /> AI Translated Rules
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiInterpretation.map((rule, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Check size={16} color="var(--accent-secondary)" />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{rule}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ marginTop: '16px', fontSize: '12px', padding: '4px 12px' }}>Edit Rules Manually</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Matching Customers</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>{audienceCount.toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: '24px', border: '1px solid rgba(36, 138, 88, 0.2)' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue Potential</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '8px' }}>${potentialRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg LTV</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>${audienceCount > 0 ? (potentialRevenue / audienceCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>Customer Sample</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>Name</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', textAlign: 'right' }}>LTV</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>Last Purchase</th>
                  <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', textAlign: 'right' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {preview.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No customers match these rules.</td></tr>
                ) : (
                  preview.map((row, i) => {
                    const daysSince = row.last_purchase_date ? differenceInDays(new Date(), new Date(row.last_purchase_date)) : 'N/A';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 24px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.first_name} {row.last_name}</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right', color: 'var(--accent-secondary)', fontWeight: 600 }}>${row.total_spent?.toLocaleString()}</td>
                        <td style={{ padding: '12px 24px', color: 'var(--text-secondary)' }}>{daysSince} days ago</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right', color: (row.churn_score || 0) > 0.7 ? '#ef4444' : 'var(--text-primary)' }}>{((row.churn_score || 0) * 100).toFixed(0)}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 4: Save */}
      {step === 4 && (
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(36, 138, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Check size={24} color="var(--accent-secondary)" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Ready to Save</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Your segment contains {audienceCount.toLocaleString()} customers.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Segment Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g., VIP Customers in London" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ fontSize: '14px', padding: '12px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Description (Optional)</label>
            <textarea 
              className="input-field" 
              placeholder="Describe the purpose of this segment..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ height: '80px', resize: 'vertical', fontSize: '14px', padding: '12px' }}
            />
          </div>

          <button className="btn btn-primary" onClick={saveAudience} disabled={isSaving} style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSaving ? 'Saving...' : 'Save Segment'}
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/audiences')}
          style={{ padding: '8px 24px' }}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        
        {step < 4 && (
          <button 
            className="btn btn-primary" 
            onClick={nextStep}
            disabled={(step === 1 && !method) || (step === 2 && method === 'manual' && filters.length === 0) || (step === 2 && method === 'ai' && filters.length === 0)}
            style={{ padding: '8px 24px' }}
          >
            Next Step
          </button>
        )}
      </div>

    </div>
  );
}
