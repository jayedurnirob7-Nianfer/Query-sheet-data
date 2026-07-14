'use client';
import { useState, useEffect } from 'react';
import KPICard         from '@/components/KPICard';
import SalesTable      from '@/components/SalesTable';
import QueryBarChart   from '@/components/QueryBarChart';
import ConversionChart from '@/components/ConversionChart';
import DailyChart      from '@/components/DailyChart';
import SettingsModal   from '@/components/SettingsModal';

// ── Demo data — always visible until real data loads ────────────
const DEMO_ROWS = [
  { name:'Liyon',  query:23, spam:1,  brief:5,  pass:4,  quoteSent:21, customOffer:10, converted:8,  totalOpp:32, quoteVsConv:38.10, queryVsConv:34.78, totalVsConv:25.00 },
  { name:'Omi',    query:46, spam:1,  brief:21, pass:4,  quoteSent:30, customOffer:2,  converted:12, totalOpp:71, quoteVsConv:40.00, queryVsConv:26.09, totalVsConv:16.90 },
  { name:'Tamim',  query:34, spam:5,  brief:24, pass:3,  quoteSent:22, customOffer:6,  converted:9,  totalOpp:61, quoteVsConv:40.91, queryVsConv:26.47, totalVsConv:14.75 },
  { name:'Nahid',  query:13, spam:3,  brief:20, pass:10, quoteSent:9,  customOffer:0,  converted:5,  totalOpp:43, quoteVsConv:55.56, queryVsConv:38.46, totalVsConv:11.63 },
  { name:'Nirob',  query:31, spam:1,  brief:23, pass:12, quoteSent:17, customOffer:9,  converted:11, totalOpp:66, quoteVsConv:64.71, queryVsConv:35.48, totalVsConv:16.67 },
  { name:'Sabbir', query:22, spam:2,  brief:27, pass:2,  quoteSent:18, customOffer:3,  converted:4,  totalOpp:20, quoteVsConv:22.22, queryVsConv:18.18, totalVsConv:20.00 },
  { name:'Robiul', query:34, spam:3,  brief:34, pass:6,  quoteSent:17, customOffer:6,  converted:7,  totalOpp:74, quoteVsConv:41.18, queryVsConv:20.59, totalVsConv:9.46  },
  { name:'Dipu',   query:9,  spam:0,  brief:14, pass:0,  quoteSent:8,  customOffer:3,  converted:3,  totalOpp:23, quoteVsConv:37.50, queryVsConv:33.33, totalVsConv:13.04 },
  { name:'Sagor',  query:20, spam:0,  brief:39, pass:4,  quoteSent:14, customOffer:1,  converted:4,  totalOpp:63, quoteVsConv:28.57, queryVsConv:20.00, totalVsConv:6.35  },
  { name:'Ruba',   query:2,  spam:1,  brief:7,  pass:0,  quoteSent:0,  customOffer:0,  converted:0,  totalOpp:9,  quoteVsConv:0.00,  queryVsConv:0.00,  totalVsConv:0.00  },
  { name:'Tanvir', query:9,  spam:1,  brief:26, pass:2,  quoteSent:4,  customOffer:1,  converted:1,  totalOpp:37, quoteVsConv:25.00, queryVsConv:11.11, totalVsConv:2.70  },
];

const DEMO_TOTALS = {
  name:'Total', query:243, spam:18, brief:240, pass:47,
  quoteSent:160, customOffer:41, converted:64, totalOpp:499,
  quoteVsConv:35.79, queryVsConv:24.05, totalVsConv:12.41,
};

// ── Parse a sheet row (array) into our internal object ──────────
function parseSheetRow(headers, row) {
  const get = (key) => {
    const idx = headers.findIndex(h =>
      h.toLowerCase().replace(/\s+/g,'').includes(key.toLowerCase().replace(/\s+/g,''))
    );
    return idx >= 0 ? row[idx] : '';
  };
  const pct = (v) => {
    if (typeof v === 'number') return parseFloat(v.toFixed(2));
    return parseFloat(String(v).replace('%','').trim()) || 0;
  };
  const num = (v) => parseInt(v) || 0;

  return {
    name:        String(get('salesperson') || get('sales') || row[0] || '').trim(),
    totalQuery:  num(get('total query') || get('query')),
    freshQuery:  num(get('fresh query')),
    totalBrief:  num(get('total brief') || get('brief')),
    freshBrief:  num(get('fresh brief')),
    passSpam:    num(get('pass/spam') || get('spam') || get('pass')),
    quoteSent:   num(get('quotesent') || get('qoute') || get('quote')),
    converted:   num(get('converted')),
    quoteVsConv: pct(get('quotevs')),
    queryVsConv: pct(get('queryvs')),
    briefVsConv: pct(get('briefvs')),
  };
}

const REFRESH_MS = 60 * 60 * 1000; // 1 hour

// Paste your Google Apps Script URL here to make it load automatically on all devices
const INBUILT_SCRIPT_URL = '';

export default function Dashboard() {
  const [tabsData,    setTabsData]    = useState([]);
  const [activeTab,   setActiveTab]   = useState(0);
  const [fetching,    setFetching]    = useState(true); // Start fetching = true so it shows loading immediately
  const [fetchError, setFetchError] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [lastSync,    setLastSync]    = useState('');
  const [showSettings,setShowSettings]= useState(false);
  const [sortKey,     setSortKey]     = useState('query');
  const [sortDir,     setSortDir]     = useState('desc');
  const [showDebug,   setShowDebug]   = useState(false);
  const [minsLeft,    setMinsLeft]    = useState(60);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [selectedDrilldown, setSelectedDrilldown] = useState(null);

  // ── Auto-fetch on mount if URL is saved ──────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('mein_dashboard_cache');
      const cachedTime = localStorage.getItem('mein_dashboard_cache_time');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setTabsData(parsed);
            if (cachedTime) {
              const diffMins = Math.floor((Date.now() - parseInt(cachedTime)) / 60000);
              setMinsLeft(Math.max(0, 60 - diffMins));
            }
          }
        } catch(e) { console.error('Failed to parse cache', e); }
      }

      fetchFromScript();

      const tick = setInterval(() => setMinsLeft(m => m > 0 ? m - 1 : 60), 60000);
      const refresh = setInterval(() => {
        fetchFromScript();
      }, REFRESH_MS);

      return () => { clearInterval(tick); clearInterval(refresh); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch from MongoDB Backend ────────────────────────────────
  async function fetchFromScript() {
    setFetching(true);
    setFetchError('');
    try {
      const res  = await fetch('/api/dashboard');
      const json = await res.json();

      if (!json.success) throw new Error(json.error || 'API returned an error');

      setTabsData(json.tabsData);
      setLastSync(new Date().toLocaleTimeString());
      setMinsLeft(60);
      try {
        const cacheData = json.tabsData.map(tab => {
          const { drilldown, ...rest } = tab;
          return rest;
        });
        localStorage.setItem('mein_dashboard_cache', JSON.stringify(cacheData));
        localStorage.setItem('mein_dashboard_cache_time', Date.now().toString());
      } catch (e) { /* Ignore cache errors silently */ }
      
      // Keep active tab index valid
      setActiveTab(prev => (prev < json.tabsData.length ? prev : 0));
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError(`Error: ${err.message}`);
    } finally {
      setFetching(false);
    }
  }

  function computeTotals(rs) {
    const totalQuery = rs.reduce((s,r) => s + (r.totalQuery || 0), 0);
    const freshQuery = rs.reduce((s,r) => s + (r.freshQuery || 0), 0);
    const totalBrief = rs.reduce((s,r) => s + (r.totalBrief || 0), 0);
    const freshBrief = rs.reduce((s,r) => s + (r.freshBrief || 0), 0);
    const quoteSent  = rs.reduce((s,r) => s + (r.quoteSent || 0), 0);
    const converted  = rs.reduce((s,r) => s + (r.converted || 0), 0);
    const briefConverted = rs.reduce((s,r) => s + (r.briefConverted || 0), 0);
    const queryConverted = rs.reduce((s,r) => s + (r.queryConverted || 0), 0);
    const passSpam   = rs.reduce((s,r) => s + (r.passSpam || 0), 0);
    const directOrder = rs.reduce((s,r) => s + (r.directOrder || 0), 0);

    return {
      name: 'Total',
      totalQuery,
      freshQuery,
      totalBrief,
      freshBrief,
      passSpam,
      quoteSent,
      converted,
      briefConverted,
      queryConverted,
      directOrder,
      quoteVsConv: quoteSent > 0 ? parseFloat(((converted / quoteSent) * 100).toFixed(2)) : 0,
      queryVsConv: freshQuery > 0 ? parseFloat(((queryConverted / freshQuery) * 100).toFixed(2)) : 0,
      briefVsConv: freshBrief > 0 ? parseFloat(((briefConverted / freshBrief) * 100).toFixed(2)) : 0,
    };
  }

  function avg(rs, key) {
    const vals = rs.map(r => r[key]).filter(v => typeof v === 'number' && !isNaN(v));
    return vals.length ? parseFloat((vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2)) : 0;
  }

  const handleSaveSettings = (url) => {
    localStorage.setItem('mein_script_url', url);
    setShowSettings(false);
    fetchFromScript(url);
  };

  const handleRefresh = () => {
    fetchFromScript();
  };

  // If there's no data yet, show the header and a loading state
  if (tabsData.length === 0) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
        <header style={{
          position:'sticky', top:0, zIndex:100,
          background:'rgba(10,15,30,0.9)',
          backdropFilter:'blur(20px)',
          borderBottom:'1px solid var(--border)',
          padding:'0 2rem',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          height:'64px',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{
              width:36, height:36, borderRadius:'10px',
              background:'linear-gradient(135deg,#4f7cff,#a78bfa)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'18px', boxShadow:'0 0 20px rgba(79,124,255,0.4)',
            }}>📊</div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1.05rem', letterSpacing:'-0.02em' }}>Mein Query Dashboard</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Sales Performance Overview</div>
            </div>
          </div>
          
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding:'7px 16px', borderRadius:'8px',
                border:'1px solid var(--border)',
                background:'var(--bg-card)', color:'var(--text-primary)',
                fontSize:'0.82rem', fontWeight:500, cursor:'pointer',
                display:'flex', alignItems:'center', gap:'6px',
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        </header>

        {fetchError && (
          <div style={{ background:'var(--red-bg)', color:'var(--red)', padding:'12px', borderRadius:'8px', marginBottom:'20px', fontWeight:600 }}>
            {fetchError}
          </div>
        )}

        {debugData && (
          <div style={{ background:'#1e1e1e', color:'#00ff00', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'11px', overflowX:'auto', whiteSpace:'pre-wrap' }}>
            <b>Diagnostic Data:</b><br/>
            {JSON.stringify(debugData, null, 2)}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'70vh', color:'var(--text-muted)' }}>
          {fetching ? 'Connecting to Database...' : 'Please enter your Apps Script URL in Settings to load data.'}
        </div>

        {showSettings && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:999,
          }}>
            <div style={{ background:'var(--bg-card)', padding:'2rem', borderRadius:'16px', width:'90%', maxWidth:500, border:'1px solid var(--border)', boxShadow:'0 20px 40px rgba(0,0,0,0.4)' }}>
              <h2 style={{ margin:'0 0 1rem 0' }}>⚙️ Settings</h2>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'8px' }}>Google Apps Script URL:</label>
                <input 
                  id="scriptUrlInput"
                  type="text" 
                  defaultValue={typeof window !== 'undefined' ? localStorage.getItem('mein_script_url') || '' : ''}
                  style={{ width:'100%', padding:'12px', borderRadius:'8px', background:'var(--bg-primary)', border:'1px solid var(--border)', color:'white', fontSize:'0.9rem', outline:'none' }}
                  placeholder="https://script.google.com/macros/s/..."
                />
              </div>
              <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
                <button 
                  onClick={() => setShowSettings(false)}
                  style={{ padding:'10px 16px', borderRadius:'8px', background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer' }}
                >Cancel</button>
                <button 
                  onClick={() => handleSaveSettings(document.getElementById('scriptUrlInput').value)}
                  style={{ padding:'10px 24px', borderRadius:'8px', background:'var(--accent)', border:'none', color:'white', fontWeight:600, cursor:'pointer' }}
                >Save & Reload</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentTab = tabsData[activeTab] || tabsData[0];
  const { rows, sellerRows, dailyRows, totals } = currentTab;

  const handleTableDrilldown = (metric, rowName, tableType, contextName) => {
    const d = currentTab.drilldown;
    if (!d || !d[metric] || !d[metric].length) return;
    
    let filtered = d[metric];
    
    if (rowName !== 'TOTAL') {
      if (tableType === 'PROFILE') filtered = filtered.filter(r => r.profileName === rowName);
      else if (tableType === 'SELLER') filtered = filtered.filter(r => r.sellerName === rowName);
      else if (tableType.startsWith('DATE')) filtered = filtered.filter(r => r.date === rowName);
    }
    
    if (contextName) {
      if (tableType === 'DATE_PROFILE') filtered = filtered.filter(r => r.profileName === contextName);
      else if (tableType === 'DATE_SELLER') filtered = filtered.filter(r => r.sellerName === contextName);
    }

    const titles = {
      totalQuery: 'Total Queries', freshQuery: 'Fresh Queries', 
      totalBrief: 'Total Briefs', freshBrief: 'Fresh Briefs',
      quoteSent: 'Quotes Sent', passSpam: 'Pass / Spam',
      converted: 'Total Converted', queryConverted: 'Query Converted', briefConverted: 'Brief Converted'
    };

    let titleSuffix = rowName === 'TOTAL' ? 'All' : rowName;
    if (contextName && rowName !== 'TOTAL') titleSuffix = `${contextName} on ${rowName}`;

    setSelectedDrilldown({ title: `${titles[metric] || metric} - ${titleSuffix}`, rows: filtered });
  };

  // ── Grouped KPI Cards ─────────────────────────────────────────
  const d = currentTab.drilldown;
  const volumeKpis = [
    { label:'Total Queries',       value: totals.totalQuery,  icon:'📋', color:'accent', tooltip: 'Rows with "Conversation Running" or "Custom Offer", plus rows with negative tags (Pass, Spam, Indian, etc). Excludes any row containing "Brief".', onClick: d ? () => setSelectedDrilldown({ title: 'Total Queries', rows: d.totalQuery }) : null },
    { label:'Fresh Queries',       value: totals.freshQuery,  icon:'🌱', color:'green',  tooltip: 'Total Queries that do NOT contain any negative tags, and also excludes Direct Orders.', onClick: d ? () => setSelectedDrilldown({ title: 'Fresh Queries', rows: d.freshQuery }) : null },
    { label:'Total Briefs',        value: totals.totalBrief,  icon:'📝', color:'accent', tooltip: 'Any row containing the "Brief" tag.', onClick: d ? () => setSelectedDrilldown({ title: 'Total Briefs', rows: d.totalBrief }) : null },
    { label:'Fresh Briefs',        value: totals.freshBrief,  icon:'✨', color:'yellow', tooltip: 'Briefs that do NOT contain any negative tags (Pass, Spam, Gone, Indian/Pakistani, Seller Message).', onClick: d ? () => setSelectedDrilldown({ title: 'Fresh Briefs', rows: d.freshBrief }) : null },
    { label:'Quotes Sent',         value: totals.quoteSent,   icon:'📨', color:'accent', tooltip: 'Rows with Quote tags, excluding any rows that contain negative tags.', onClick: d ? () => setSelectedDrilldown({ title: 'Quotes Sent', rows: d.quoteSent }) : null },
    { label:'Pass / Spam',         value: totals.passSpam,    icon:'🚫', color:'red',    tooltip: 'Rows containing "Pass", "Spam", "Gone", "Seller Message", or "Indian/Pakistani".', onClick: d ? () => setSelectedDrilldown({ title: 'Pass / Spam', rows: d.passSpam }) : null },
  ];

  const conversionKpis = [
    { label:'Total Converted',     value: totals.converted,      icon:'🏆', color:'green',  tooltip: 'Rows containing "Converted" or "Direct Order" tags.', onClick: d ? () => setSelectedDrilldown({ title: 'Total Converted', rows: d.converted }) : null },
    { label:'Query Converted',     value: totals.queryConverted, icon:'✅', color:'green',  tooltip: 'Rows containing "Converted" that also qualified as a Total Query.', onClick: d ? () => setSelectedDrilldown({ title: 'Query Converted', rows: d.queryConverted }) : null },
    { label:'Brief Converted',     value: totals.briefConverted, icon:'✅', color:'green',  tooltip: 'Rows containing "Converted" that also contained "Brief".', onClick: d ? () => setSelectedDrilldown({ title: 'Brief Converted', rows: d.briefConverted }) : null },
    { label:'Direct Orders',       value: totals.directOrder,    icon:'⚡', color:'accent', tooltip: 'Rows containing "Direct Order" tag.', onClick: d ? () => setSelectedDrilldown({ title: 'Direct Orders', rows: d.directOrder }) : null },
  ];

  const rateKpis = [
    { label:'Quote VS Converted',  value: `${totals.quoteVsConv}%`, icon:'📊', color:'yellow', isPct:true, tooltip: 'Calculated using the entire month\'s totals: (Total Converted ÷ Total Quotes Sent)' },
    { label:'Query VS Converted',  value: `${totals.queryVsConv}%`, icon:'📈', color:'green',  isPct:true, tooltip: 'Calculated using the entire month\'s totals: (Total Converted ÷ Fresh Queries)' },
    { label:'Brief VS Converted',  value: `${totals.briefVsConv}%`, icon:'✨', color:'accent', isPct:true, tooltip: 'Calculated using the entire month\'s totals: (Briefs that Converted ÷ Fresh Briefs)' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(10,15,30,0.9)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--border)',
        padding:'0 2rem',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:'64px',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{
            width:36, height:36, borderRadius:'10px',
            background:'linear-gradient(135deg,#4f7cff,#a78bfa)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'18px', boxShadow:'0 0 20px rgba(79,124,255,0.4)',
          }}>📊</div>
          <div>
            <div style={{ fontWeight:700, fontSize:'1.05rem', letterSpacing:'-0.02em' }}>Mein Query Dashboard</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Sales Performance Overview</div>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>

          {/* Status pill */}
          <div style={{
            display:'flex', alignItems:'center', gap:'6px',
            padding:'4px 12px', borderRadius:'999px',
            background: fetching ? 'var(--yellow-bg)' : 'var(--green-bg)',
            border: `1px solid ${fetching ? 'var(--yellow)' : 'var(--green)'}`,
            fontSize:'0.73rem', fontWeight:500,
            color: fetching ? 'var(--yellow)' : 'var(--green)',
            transition: 'all 0.3s'
          }}>
            <span style={{
              width:7, height:7, borderRadius:'50%',
              background: fetching ? 'var(--yellow)' : 'var(--green)',
              animation: 'pulse 2s infinite',
              display:'inline-block',
            }}/>
            {fetching ? 'Syncing...' : `Live · Next sync in ${minsLeft}m`}
          </div>

          {/* Last sync time */}
          {lastSync && !fetching && (
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
              Synced {lastSync}
            </span>
          )}

          {/* Refresh button */}
          <button
            id="btn-refresh"
            onClick={handleRefresh}
            disabled={fetching}
            style={{
              padding:'7px 16px', borderRadius:'8px',
              border:'1px solid var(--accent)',
              background:'rgba(79,124,255,0.1)', color:'var(--accent)',
              fontSize:'0.82rem', fontWeight:600,
              cursor: fetching ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', gap:'6px',
              opacity: fetching ? 0.6 : 1,
              transition:'all 0.2s',
            }}
            onMouseEnter={e => { if (!fetching) { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.color='#fff'; }}}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(79,124,255,0.1)'; e.currentTarget.style.color='var(--accent)'; }}
          >
            <span style={{ display:'inline-block', animation: fetching ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            {fetching ? 'Syncing' : 'Refresh'}
          </button>

          {/* Settings button */}
          {!INBUILT_SCRIPT_URL && (
            <button
              id="btn-settings"
              onClick={() => setShowPasswordPrompt(true)}
              style={{
                padding:'7px 16px', borderRadius:'8px',
                border:'1px solid var(--border)',
                background:'var(--bg-card)', color:'var(--text-primary)',
                fontSize:'0.82rem', fontWeight:500, cursor:'pointer',
                display:'flex', alignItems:'center', gap:'6px',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-primary)'; }}
            >
              ⚙️ Settings
            </button>
          )}
        </div>
      </header>

      {/* ── Error / No-URL banner ────────────────────────────── */}
      {fetchError && (
        <div style={{
          background:'var(--red-bg)', borderBottom:'1px solid var(--red)',
          color:'var(--red)', padding:'10px 2rem',
          fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'8px',
        }}>
          ⚠️ {fetchError}
          <button onClick={() => setShowSettings(true)}
            style={{ marginLeft:8, textDecoration:'underline', background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'0.82rem' }}>
            Configure script URL →
          </button>
        </div>
      )}



      {/* ── Dashboard Content ──────── */}
      <div style={{ width: '100%' }}>
        {/* ── Tab Selector ───────────────────────────────────────── */}
        <div style={{ padding: '1rem 2rem 0', maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
          {tabsData.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: activeTab === idx ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeTab === idx ? 'rgba(79,124,255,0.1)' : 'var(--bg-card)',
                color: activeTab === idx ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === idx ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.tabName}
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding:'1rem 2rem 2rem', maxWidth:'100%' }}>

          {/* ── Financial Hero Banner ───────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(79,124,255,0.05) 0%, rgba(167,139,250,0.02) 100%)',
            border: '1px solid rgba(79,124,255,0.2)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            marginBottom: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.03)',
            maxWidth: '800px',
            margin: '0 auto 3rem auto'
          }}>
            <div style={{
               position:'absolute', top:'-50%', left:'50%', transform:'translateX(-50%)',
               width:'400px', height:'400px', background:'var(--green)', filter:'blur(120px)', opacity:0.12, pointerEvents:'none'
            }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Total Achieved Sales
            </div>
            <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--green)', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(0, 255, 0, 0.15)' }}>
              ${(totals.achieved || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* ── KPI Sections ────────────────────────────────────────── */}
          <div style={{ marginBottom: '4rem' }}>
            
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>🌊</span> Funnel Volume
            </h2>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'1rem', marginBottom:'3rem' }}>
              {volumeKpis.map((k, i) => <div key={i} style={{ width: '220px' }}><KPICard {...k} /></div>)}
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>🎯</span> Actions & Outcomes
            </h2>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'1rem', marginBottom:'3rem' }}>
              {conversionKpis.map((k, i) => <div key={i} style={{ width: '220px' }}><KPICard {...k} /></div>)}
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>📈</span> Conversion Rates
            </h2>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'1rem' }}>
              {rateKpis.map((k, i) => <div key={i} style={{ width: '220px' }}><KPICard {...k} /></div>)}
            </div>

          </div>

        {/* ── Seller Section (Only show if seller rows exist) ──────────────────────── */}
        {sellerRows && sellerRows.length > 0 && (
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Detailed Seller Performance
            </h2>



            {/* ── Seller Table ────────────────────────────────────────────── */}
            <ChartCard title={`📋 Detailed Seller Performance - ${currentTab.tabName}`} noPad>
              <SalesTable
                type="SELLER"
                rows={sellerRows}
                totals={totals}
                sortKey={sortKey}
                sortDir={sortDir}
                onRowClick={(sellerName) => setSelectedSeller(sellerName)}
                onCellClick={(metric, rowName) => handleTableDrilldown(metric, rowName, 'SELLER')}
                onSort={(k) => {
                  if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                  else { setSortKey(k); setSortDir('desc'); }
                }}
              />
            </ChartCard>
          </div>
        )}



        {/* ── Profile Section ───────────────────────────────────────── */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Detailed Profile Performance
          </h2>



          {/* ── Table ────────────────────────────────────────────── */}
          <ChartCard title={`📋 Detailed Profile Performance - ${currentTab.tabName}`} noPad>
            <SalesTable
              type="PROFILE"
              rows={rows}
              totals={totals}
              sortKey={sortKey}
              sortDir={sortDir}
              onRowClick={(p) => setSelectedProfile(p)}
              onCellClick={(metric, rowName) => handleTableDrilldown(metric, rowName, 'PROFILE')}
              onSort={(k) => {
                if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                else { setSortKey(k); setSortDir('desc'); }
              }}
            />
          </ChartCard>
        </div>

      </main>

      {selectedSeller && (
        <Modal title={`📅 Daily Performance: ${selectedSeller}`} onClose={() => setSelectedSeller(null)}>
          <SalesTable
            type="DATE"
            rows={currentTab.sellerDailyRows?.[selectedSeller] || []}
            totals={computeTotals(currentTab.sellerDailyRows?.[selectedSeller] || [])}
            sortKey={sortKey}
            sortDir={sortDir}
            onCellClick={(metric, rowName) => handleTableDrilldown(metric, rowName, 'DATE_SELLER', selectedSeller)}
            onSort={(k) => {
              if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSortKey(k); setSortDir('desc'); }
            }}
          />
        </Modal>
      )}

      {selectedProfile && (
        <Modal title={`📅 Daily Performance: ${selectedProfile}`} onClose={() => setSelectedProfile(null)}>
          <SalesTable
            type="DATE"
            rows={currentTab.profileDailyRows?.[selectedProfile] || []}
            totals={computeTotals(currentTab.profileDailyRows?.[selectedProfile] || [])}
            sortKey={sortKey}
            sortDir={sortDir}
            onCellClick={(metric, rowName) => handleTableDrilldown(metric, rowName, 'DATE_PROFILE', selectedProfile)}
            onSort={(k) => {
              if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSortKey(k); setSortDir('desc'); }
            }}
          />
        </Modal>
      )}

      {showPasswordPrompt && (
        <Modal title="🔒 Admin Authentication" maxWidth={400} onClose={() => { setShowPasswordPrompt(false); setPasswordError(''); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Please enter the admin password to access settings.
            </p>
            <input 
              type="password" 
              autoFocus
              placeholder="Enter password..."
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', padding: '12px 14px', borderRadius: '8px',
                outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s',
                borderColor: passwordError ? 'var(--red)' : 'var(--border)'
              }}
              onFocus={(e) => {
                 if (!passwordError) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                 if (!passwordError) e.target.style.borderColor = 'var(--border)';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.target.value === '1234') {
                    setShowPasswordPrompt(false);
                    setPasswordError('');
                    setShowSettings(true);
                  } else {
                    setPasswordError('Incorrect password');
                  }
                }
              }}
            />
            {passwordError && <span style={{ color: 'var(--red)', fontSize: '0.85rem', fontWeight: 600 }}>{passwordError}</span>}
            
            <button 
              onClick={(e) => {
                const val = e.currentTarget.parentElement.querySelector('input').value;
                if (val === '1234') {
                  setShowPasswordPrompt(false);
                  setPasswordError('');
                  setShowSettings(true);
                } else {
                  setPasswordError('Incorrect password');
                }
              }}
              style={{
                marginTop: '0.5rem', padding: '10px 16px', background: 'var(--accent)', 
                color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, 
                cursor: 'pointer', transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
              onMouseLeave={e => e.currentTarget.style.opacity = 1}
            >
              Verify Password
            </button>
          </div>
        </Modal>
      )}

      {selectedDrilldown && (
        <Modal title={`🔍 ${selectedDrilldown.title} Data`} maxWidth={1800} onClose={() => setSelectedDrilldown(null)}>
          <DrilldownTable rows={selectedDrilldown.rows} />
        </Modal>
      )}

      {showSettings && (
        <SettingsModal
          currentUrl={localStorage.getItem('mein_script_url') || ''}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      </div>
    </div>
  );
}

function ChartCard({ title, children, noPad }) {
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-lg)', overflow:'hidden',
    }}>
      <div style={{
        padding:'1rem 1.5rem', borderBottom:'1px solid var(--border)',
        fontWeight:600, fontSize:'0.92rem',
      }}>{title}</div>
      <div style={noPad ? {} : { padding:'1rem 1.5rem' }}>{children}</div>
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth = 1800 }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div 
      onClick={onClose}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center', zIndex:999,
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          background:'var(--bg-primary)', padding:'2rem', borderRadius:'16px', 
          width:'95%', maxWidth: maxWidth, maxHeight: '90vh', overflowY: 'auto',
          border:'1px solid var(--border)', boxShadow:'0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
           <h2 style={{ margin:0, fontSize: '1.5rem' }}>{title}</h2>
           <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusPills({ statusString }) {
  if (!statusString || statusString === '-') return <span>-</span>;
  
  const tags = statusString.split(',').map(s => s.trim()).filter(Boolean);
  
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      {tags.map((tag, i) => {
        const lower = tag.toLowerCase();
        let bg = 'var(--bg-secondary)';
        let color = 'var(--text-primary)';
        let border = '1px solid var(--border)';

        if (lower === 'conversation running') {
          bg = '#cce5ff'; color = '#0056b3'; border = '1px solid #b8daff';
        } else if (lower === 'seller message') {
          bg = '#f8f9fa'; color = '#212529'; border = '1px solid #ced4da';
        } else if (lower === 'pass') {
          bg = '#a90000'; color = '#ffffff'; border = '1px solid #800000';
        } else if (lower === 'gone') {
          bg = '#ff0000'; color = '#ffffff'; border = '1px solid #cc0000';
        } else if (lower === 'quoted' || lower === 'qoute') {
          bg = '#8b4513'; color = '#ffffff'; border = '1px solid #6b3410';
        } else if (lower === 'converted' || lower === 'direct order') {
          bg = '#d4edda'; color = '#155724'; border = '1px solid #c3e6cb';
        } else if (lower === 'custom offer sent' || lower === 'custom offer') {
          bg = '#0056b3'; color = '#ffffff'; border = '1px solid #004085';
        } else if (lower === 'brief') {
          bg = '#fff3cd'; color = '#856404'; border = '1px solid #ffeeba';
        }

        return (
          <span key={i} style={{ 
            background: bg, color: color, border: border,
            padding: '2px 10px', borderRadius: '12px', 
            fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            {tag}
          </span>
        );
      })}
    </div>
  );
}

function ServicePill({ name }) {
  if (!name || name === '-') return <span>-</span>;
  
  const lower = String(name).toLowerCase();
  let bg = 'var(--bg-secondary)';
  let color = 'var(--text-primary)';
  let border = '1px solid var(--border)';

  if (lower.includes('smd')) {
    bg = '#155eaf'; color = '#ffffff'; border = '1px solid #114c8f';
  } else if (lower.includes('packaging')) {
    bg = '#a31414'; color = '#ffffff'; border = '1px solid #821010';
  } else if (lower.includes('wix')) {
    bg = '#fbe49f'; color = '#3a3a3a'; border = '1px solid #f9d870';
  } else if (lower.includes('wordpress')) {
    bg = '#bce1f4'; color = '#155eaf'; border = '1px solid #a3d4ef';
  } else if (lower.includes('shopify')) {
    bg = '#196a3e'; color = '#ffffff'; border = '1px solid #145532';
  } else if (lower.includes('custom')) {
    bg = '#5c388a'; color = '#ffffff'; border = '1px solid #4a2d6e';
  }

  return (
    <span style={{ 
      background: bg, color: color, border: border,
      padding: '4px 10px', borderRadius: '12px', 
      fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
      display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      {name}
    </span>
  );
}

function ProfilePill({ name }) {
  if (!name || name === '-') return <span>-</span>;
  
  const lower = String(name).toLowerCase();
  let bg = 'var(--bg-secondary)';
  let color = 'var(--text-primary)';
  let border = '1px solid var(--border)';

  if (lower.includes('pixelora')) {
    bg = '#155eaf'; color = '#ffffff'; border = '1px solid #114c8f';
  } else if (lower.includes('socio_vista')) {
    bg = '#a31414'; color = '#ffffff'; border = '1px solid #821010';
  } else if (lower.includes('thestudioxx')) {
    bg = '#196a3e'; color = '#ffffff'; border = '1px solid #145532';
  } else if (lower.includes('sketchmuse')) {
    bg = '#5c388a'; color = '#ffffff'; border = '1px solid #4a2d6e';
  } else if (lower.includes('ink_byte')) {
    bg = '#e3c5f4'; color = '#5c388a'; border = '1px solid #d2a4ea';
  } else if (lower.includes('graphixnest')) {
    bg = '#bce1f4'; color = '#155eaf'; border = '1px solid #a3d4ef';
  } else if (lower.includes('verispace')) {
    bg = '#fbe49f'; color = '#3a3a3a'; border = '1px solid #f9d870';
  } else if (lower.includes('vanila')) {
    bg = '#d0f1bd'; color = '#196a3e'; border = '1px solid #bceb9f';
  } else if (lower.includes('northblock')) {
    bg = '#ffcfcc'; color = '#a31414'; border = '1px solid #ffb5b0';
  } else if (lower.includes('dgtl')) {
    bg = '#f3a912'; color = '#ffffff'; border = '1px solid #d1910f';
  } else if (lower.includes('bloomroxy')) {
    bg = '#434343'; color = '#ffffff'; border = '1px solid #333333';
  }

  return (
    <span style={{ 
      background: bg, color: color, border: border,
      padding: '4px 10px', borderRadius: '12px', 
      fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
      display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      {name}
    </span>
  );
}

function DrilldownTable({ rows }) {
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  if (!rows || rows.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data found.</div>;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    
    let valA = a[sortKey] || '';
    let valB = b[sortKey] || '';
    
    if (sortKey === 'amount') {
       valA = parseFloat(String(valA).replace(/[^0-9.-]+/g, "")) || 0;
       valB = parseFloat(String(valB).replace(/[^0-9.-]+/g, "")) || 0;
       return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    
    if (sortKey === 'date') {
       const timeA = new Date(valA + " 2026").getTime() || 0;
       const timeB = new Date(valB + " 2026").getTime() || 0;
       return sortDir === 'asc' ? timeA - timeB : timeB - timeA;
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const thStyle = {
    padding: '12px 16px', textAlign: 'left', fontSize: '0.82rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap',
    cursor: 'pointer', userSelect: 'none'
  };

  const tdStyle = {
    padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-primary)',
    borderBottom: '1px solid rgba(99,130,255,0.06)', whiteSpace: 'nowrap'
  };

  const Th = ({ label, sortName }) => (
    <th style={thStyle} onClick={() => handleSort(sortName)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {label}
        <span style={{ fontSize: '0.7rem', color: sortKey === sortName ? 'var(--accent)' : 'var(--text-muted)', opacity: sortKey === sortName ? 1 : 0.4 }}>
          {sortKey === sortName ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );

  return (
    <div style={{ overflow: 'auto', maxHeight: '70vh' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)' }}>
            <Th label="Date" sortName="date" />
            <Th label="Client Name" sortName="clientName" />
            <Th label="URL" sortName="clientUrl" />
            <Th label="Service Line" sortName="serviceLine" />
            <Th label="Amount" sortName="amount" />
            <Th label="Profile" sortName="profileName" />
            <Th label="Seller" sortName="sellerName" />
            <Th label="Status" sortName="status" />
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,124,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}>
              <td style={tdStyle}>{r.date}</td>
              <td style={tdStyle}>{r.clientName}</td>
              <td style={{...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.clientUrl ? (
                  <a href={r.clientUrl.startsWith('http') ? r.clientUrl : `https://${r.clientUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }} title={r.clientUrl}>
                    {r.clientUrl}
                  </a>
                ) : '-'}
              </td>
              <td style={tdStyle}>
                <ServicePill name={r.serviceLine} />
              </td>
              <td style={tdStyle}>{r.amount}</td>
              <td style={tdStyle}>
                <ProfilePill name={r.profileName} />
              </td>
              <td style={tdStyle}>{r.sellerName}</td>
              <td style={tdStyle}>
                <StatusPills statusString={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
