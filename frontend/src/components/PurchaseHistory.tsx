import  { useEffect, useState } from 'react';
import axios from 'axios';
import { Search,  ShoppingBag, Sparkles, TrendingUp, DollarSign, Activity, Repeat, PieChart,  Package, List, ArrowRight,  Download, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,   } from 'recharts';

const API_URL = 'http://localhost:5000/api';

export default function PurchaseHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  
  // New insights state
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [customerBehavior, setCustomerBehavior] = useState<any>({});
  const [repurchaseAnalysis, setRepurchaseAnalysis] = useState<any>({});
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  
  // Filters
  const [customerFilter, setCustomerFilter] = useState('');
  const [minValueFilter, setMinValueFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 25;

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchInsights();
  }, [customerFilter, minValueFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [customerFilter, minValueFilter]);

  const fetchOrders = async () => {
    try {
      let query = `${API_URL}/orders?page=1&limit=2000`;
      if (customerFilter) query += `&customer=${customerFilter}`;
      if (minValueFilter) query += `&min_value=${minValueFilter}`;
      
      const res = await axios.get(query);
      setOrders(res.data.orders || []);
      if (res.data.kpis) setKpis(res.data.kpis);
    } catch (e) {
      console.error(e);
    }
  };

  const [insightsLoading, setInsightsLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await axios.get(`${API_URL}/purchase-insights`);
      if (res.data) {
        setTopProducts(res.data.top_products || []);
        setTopCategories(res.data.top_categories || []);
        setRevenueTrends(res.data.revenue_trends || []);
        setCustomerBehavior(res.data.customer_behavior || {});
        setRepurchaseAnalysis(res.data.repurchase_analysis || {});
      }
      
      const aiRes = await axios.get(`${API_URL}/ai/workspace-insights`);
      if (aiRes.data) {
        setAiInsights(aiRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleInsightClick = (intent: string) => {
    navigate('/audiences/ai-build', { state: { intent } });
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    
    const headers = ['Order Number', 'Customer Name', 'Amount', 'Order Date', 'Products'];
    const csvContent = [
      headers.join(','),
      ...orders.map(o => [
        o.order_number,
        `"${o.customer_name}"`,
        o.amount,
        `"${o.order_date || ''}"`,
        `"${(o.items || []).join(' + ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe divisions
  const totalOrders = kpis.total_orders || 0;
  const repeatPurchaseRate = kpis.repeat_purchase_rate || 0;
  const repeatPurchases = Math.round(totalOrders * (repeatPurchaseRate / 100)) || 0;
  const loyalCustomers = Math.round(totalOrders * 0.15) || 0; // Heuristic based on orders

  const COLORS = ['var(--accent-secondary)', '#ec4899', 'var(--accent-secondary)', 'var(--accent-secondary)', '#f59e0b'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={24} color="var(--accent-secondary)" /> Purchase Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Analytics on transactions, products, and customer buying behavior.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <ShoppingBag size={16} /> Total Orders
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalOrders.toLocaleString()}
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <TrendingUp size={16} /> Revenue Generated
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${(kpis.revenue_generated || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600 }}>
            <DollarSign size={16} /> Average Order Value
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${(kpis.average_order_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
            <Repeat size={16} /> Repeat Purchase Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {repeatPurchaseRate.toFixed(1)}%
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(145deg, rgba(236, 72, 153, 0.05) 0%, rgba(36, 138, 88, 0.05) 100%)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontSize: '13px', fontWeight: 600 }}>
            <Activity size={16} /> Revenue Opportunity
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${(repurchaseAnalysis.due_for_repurchase * (kpis.average_order_value || 0) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* EngageX Insights Feed */}
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(90deg, rgba(36, 138, 88, 0.05) 0%, rgba(36, 138, 88, 0.05) 100%)', border: '1px solid rgba(36, 138, 88, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} /> EngageX Insights Feed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insightsLoading ? (
              <div style={{ display: 'flex', gap: '8px', color: 'var(--accent-secondary)' }}>
                <Loader2 className="spinner" size={16} /> <span>Analyzing latest CRM data...</span>
              </div>
            ) : aiInsights.length > 0 ? (
              aiInsights.slice(0, 3).map((insight, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleInsightClick(insight.action)}
                  style={{ 
                    padding: '16px', 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(36, 138, 88, 0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>
                      {insight.title}
                    </div>
                    <div style={{ color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 600, background: 'rgba(36, 138, 88, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      {insight.confidence}% Confidence
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {insight.insight}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                    {insight.action} <ArrowRight size={14} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>No AI insights available yet.</div>
            )}
          </div>
        </div>

        {/* Revenue Trends Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-secondary)" /> Revenue Trends
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            {revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                    itemStyle={{ color: 'white' }}
                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-secondary)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No order history available
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Product Performance */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#f59e0b" /> Product Performance
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Top Products</th>
                <th style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, textAlign: 'right' }}>Orders</th>
                <th style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'right' }}>{p.orders}</td>
                  <td style={{ padding: '12px 0', color: 'var(--accent-secondary)', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>${p.revenue?.toLocaleString()}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Category Performance */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <List size={18} color="#ec4899" /> Category Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topCategories.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>${c.revenue?.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.share}%`, height: '100%', background: COLORS[idx % COLORS.length], borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No categories found</div>
            )}
          </div>
        </div>
      </div>



      {/* Enhanced Order Table */}
      {(() => {
        const totalPages = Math.ceil(orders.length / PER_PAGE) || 1;
        const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        const startIndex = (safeCurrentPage - 1) * PER_PAGE + 1;
        const endIndex = Math.min(safeCurrentPage * PER_PAGE, orders.length);
        const currentOrders = orders.slice((safeCurrentPage - 1) * PER_PAGE, safeCurrentPage * PER_PAGE);

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

        return (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="#ec4899" /> Order Stream
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '16px' }}>
                  Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{orders.length > 0 ? startIndex : 0}-{endIndex}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{orders.length}</span>
                </div>
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', width: '200px' }}>
              <Search size={14} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '13px' }} 
              />
            </div>
            
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', width: '130px' }}>
              <DollarSign size={14} className="text-muted" />
              <input 
                type="number" 
                placeholder="Min Value" 
                value={minValueFilter}
                onChange={(e) => setMinValueFilter(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '13px' }} 
              />
            </div>

            <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', fontSize: '13px' }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
        
        <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Products Purchased</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((o, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.customer_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{o.order_number}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {o.items?.join(' + ') || 'Unknown Items'}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-secondary)' }}>${o.amount?.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {o.order_date ? formatDistanceToNow(new Date(o.order_date), { addSuffix: true }) : 'Unknown'}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: safeCurrentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, transition: 'var(--transition-fast)' }}
            >
              Previous
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {getPageNumbers().map((p, i) => (
                <button
                  key={i}
                  onClick={() => p !== '...' && setCurrentPage(p as number)}
                  disabled={p === '...'}
                  style={{ background: p === safeCurrentPage ? 'rgba(236,72,153,0.1)' : 'transparent', border: p === safeCurrentPage ? '1px solid #ec4899' : '1px solid transparent', color: p === safeCurrentPage ? '#ec4899' : p === '...' ? 'var(--text-tertiary)' : 'var(--text-secondary)', padding: '6px 10px', borderRadius: '6px', cursor: p === '...' ? 'default' : 'pointer', fontSize: '13px', fontWeight: p === safeCurrentPage ? 700 : 500 }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: safeCurrentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, transition: 'var(--transition-fast)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      );
    })()}
    </div>
  );
}
