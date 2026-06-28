'use client';
import { useState } from 'react';

export default function SettingsModal({ currentUrl, onSave, onClose }) {
  const [url, setUrl] = useState(currentUrl || '');

  const overlay = {
    position:'fixed', inset:0, zIndex:1000,
    background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)',
    display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
  };

  const modal = {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'2rem',
    width:'100%', maxWidth:560,
    boxShadow:'0 24px 80px rgba(0,0,0,0.6)',
    position:'relative',
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Close */}
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16,
          background:'none', border:'none', color:'var(--text-muted)',
          fontSize:'1.4rem', cursor:'pointer', lineHeight:1,
        }}>×</button>

        <h2 style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:'0.4rem' }}>
          ⚙️ Dashboard Settings
        </h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.83rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
          Paste your Google Apps Script Web App URL below. The dashboard will auto-fetch
          data from your sheet on page load and refresh every hour automatically.
        </p>

        {/* Step guide */}
        <div style={{
          background:'rgba(79,124,255,0.06)', border:'1px solid rgba(79,124,255,0.2)',
          borderRadius:10, padding:'1rem 1.2rem', marginBottom:'1.5rem', fontSize:'0.8rem',
          color:'var(--text-secondary)', lineHeight:1.8,
        }}>
          <strong style={{ color:'var(--accent)', display:'block', marginBottom:4 }}>One-time setup (5 min):</strong>
          1. Create a new Google Sheet (you must own it)<br/>
          2. Extensions → Apps Script → paste the provided script<br/>
          3. Click Deploy → New Deployment → Web App → Execute as: Me → Anyone<br/>
          4. Run <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 5px', borderRadius:4 }}>setupTrigger()</code> once to enable hourly auto-sync<br/>
          5. Copy the Web App URL and paste it below
        </div>

        <label style={{ display:'block', marginBottom:6, fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)' }}>
          Apps Script Web App URL
        </label>
        <input
          id="input-script-url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/…/exec"
          style={{
            width:'100%', padding:'10px 14px',
            background:'var(--bg-secondary)', border:'1px solid var(--border)',
            borderRadius:8, color:'var(--text-primary)', fontSize:'0.85rem',
            outline:'none', marginBottom:'1.25rem',
            transition:'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{
            padding:'9px 20px', borderRadius:8,
            border:'1px solid var(--border)', background:'none',
            color:'var(--text-secondary)', cursor:'pointer', fontSize:'0.85rem',
          }}>
            Cancel
          </button>
          <button
            id="btn-save-settings"
            onClick={() => url && onSave(url)}
            disabled={!url.trim()}
            style={{
              padding:'9px 24px', borderRadius:8, border:'none',
              background:'var(--accent)', color:'#fff',
              fontWeight:600, cursor: url.trim() ? 'pointer' : 'not-allowed',
              opacity: url.trim() ? 1 : 0.5, fontSize:'0.85rem',
              transition:'all 0.2s',
            }}
            onMouseEnter={e => url.trim() && (e.currentTarget.style.background = 'var(--accent-light)')}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
