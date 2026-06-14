import  { useState, useEffect, useRef } from 'react';
import { Settings, Play, Terminal, Database } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ChannelSimulator = () => {
  const [logs, setLogs] = useState<string[]>([
    "[System] Channel Simulator Dashboard Initialized.",
    "[System] Listening for incoming webhook events..."
  ]);
  const [channel, setChannel] = useState('WhatsApp');
  const [recipient, setRecipient] = useState('+1234567890');
  const [payloadStr, setPayloadStr] = useState(`{\n  "message": "Hello World"\n}`);
  const [loading, setLoading] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when logs update
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    // Connect to SSE stream
    const sse = new EventSource(`${API_URL}/webhooks/stream`);
    
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const time = new Date().toLocaleTimeString();
        let logMsg = `[${time}] Webhook Received: Message ${data.message_id} -> ${data.status.toUpperCase()}`;
        if (data.error) {
          logMsg += ` (Error: ${data.error})`;
        }
        setLogs(prev => [...prev, logMsg]);
      } catch (err) {
        console.error("Failed to parse SSE", err);
      }
    };

    sse.onerror = () => {
      setLogs(prev => [...prev, `[System] Lost connection to webhook stream. Reconnecting...`]);
    };

    return () => {
      sse.close();
    };
  }, []);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payloadStr);
      } catch (e) {
        setLogs(prev => [...prev, `[Error] Invalid JSON payload`]);
        setLoading(false);
        return;
      }

      const finalPayload = {
        ...parsedPayload,
        channel: channel.toLowerCase(),
        recipient: recipient
      };

      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Dispatching payload to channel service...`]);
      
      const res = await axios.post(`${API_URL}/channel/send_test`, finalPayload);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully dispatched. Tracking Message ID: ${res.data.message_id}`]);
      
    } catch (e: any) {
      setLogs(prev => [...prev, `[Error] Failed to send: ${e.response?.data?.error || e.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={24} color="#64748b" /> Channel Simulator
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Test campaign delivery and webhook events safely.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
        
        {/* Payload Configuration */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} /> Simulate Payload
          </h3>
          
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Channel</label>
            <select className="input-field" value={channel} onChange={e => setChannel(e.target.value)}>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>SMS</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Recipient</label>
            <input type="text" className="input-field" value={recipient} onChange={e => setRecipient(e.target.value)} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>JSON Payload</label>
            <textarea className="input-field" style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', resize: 'none' }} value={payloadStr} onChange={e => setPayloadStr(e.target.value)} />
          </div>

          <button className="btn btn-primary" onClick={handleSimulate} disabled={loading} style={{ width: '100%', marginTop: 'auto', opacity: loading ? 0.7 : 1 }}>
            <Play size={16} /> {loading ? 'Sending...' : 'Send Test Request'}
          </button>
        </div>

        {/* Terminal / Logs */}
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', background: 'var(--accent-primary)', border: '1px solid #1e293b' }}>
          <div style={{ padding: '12px 16px', background: 'var(--accent-primary)', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="#94a3b8" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '1px' }}>DELIVERY LOGS</span>
          </div>
          <div style={{ padding: '16px', flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: log.includes('[Error]') ? '#ef4444' : log.includes('Webhook Received') ? '#38bdf8' : 'var(--accent-secondary)' }}>{log}</div>
            ))}
            <div style={{ color: '#64748b' }}>_</div>
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChannelSimulator;
