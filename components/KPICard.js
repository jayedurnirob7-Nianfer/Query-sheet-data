'use client';

import { useState } from 'react';

function getColorStyle(color, isPct, value) {
  if (isPct) {
    const n = parseFloat(String(value).replace('%',''));
    if (n >= 35) return { color:'var(--green)', background:'var(--green-bg)' };
    if (n >= 20) return { color:'var(--yellow)', background:'var(--yellow-bg)' };
    return { color:'var(--red)', background:'var(--red-bg)' };
  }
  const map = {
    green:  { color:'var(--green)',  background:'var(--green-bg)'  },
    yellow: { color:'var(--yellow)', background:'var(--yellow-bg)' },
    red:    { color:'var(--red)',    background:'var(--red-bg)'    },
    accent: { color:'var(--accent)', background:'rgba(79,124,255,0.08)' },
  };
  return map[color] || map.accent;
}

export default function KPICard({ label, value, icon, color, isPct, tooltip, onClick }) {
  const [hovered, setHovered] = useState(false);
  const style = getColorStyle(color, isPct, value);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.25rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      transition: 'all 0.2s',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'visible', // Changed to visible so tooltip can overflow
      zIndex: hovered ? 100 : 1, // Elevate z-index when hovered so tooltip doesn't hide behind other cards
    }}
    onClick={onClick}
    onMouseEnter={e => {
      setHovered(true);
      e.currentTarget.style.borderColor = style.color;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 30px ${style.background}`;
    }}
    onMouseLeave={e => {
      setHovered(false);
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Custom Tooltip */}
      {hovered && tooltip && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '220px',
          background: 'rgba(15, 20, 35, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${style.color}`,
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 999,
          pointerEvents: 'none',
          animation: 'fadeInUp 0.2s ease-out forwards',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '10px',
            height: '10px',
            background: 'rgba(15, 20, 35, 0.95)',
            borderTop: `1px solid ${style.color}`,
            borderLeft: `1px solid ${style.color}`,
          }} />
          {tooltip}
        </div>
      )}
      {/* Background accent blob */}
      <div style={{
        position:'absolute', top:-20, right:-20,
        width:80, height:80, borderRadius:'50%',
        background: style.background,
        filter:'blur(20px)',
        pointerEvents:'none',
      }}/>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={{ fontSize:'1.5rem' }}>{icon}</span>
        <span style={{
          fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.04em',
          textTransform:'uppercase', color: style.color,
          background: style.background,
          padding:'2px 8px', borderRadius:'999px',
        }}>
          {isPct ? 'Rate' : 'Total'}
        </span>
      </div>

      <div style={{
        fontSize: isPct ? '1.8rem' : '2rem',
        fontWeight: 800,
        color: style.color,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {value ?? '—'}
      </div>

      <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:500 }}>
        {label}
      </div>
    </div>
  );
}
