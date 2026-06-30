'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const LINES = [
  { key:'totalQuery', label:'Total Query',  color:'#38bdf8' },
  { key:'freshQuery', label:'Fresh Query',  color:'#4f7cff' },
  { key:'directOrder',label:'Direct Order', color:'#e879f9' },
  { key:'totalBrief', label:'Brief',        color:'#f5c542' },
  { key:'converted',  label:'Converted',    color:'#10d98a' },
  { key:'passSpam',   label:'Pass/Spam',    color:'#ff5e7a' },
];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ fontWeight:700, marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', justifyContent:'space-between', gap:16, color:'white' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:p.color || p.fill }}></span>
            <span>{p.name}</span>
          </div>
          <span style={{ fontWeight:600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DailyChart({ rows }) {
  if (!rows || rows.length === 0) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:280, color:'var(--text-muted)' }}>
      No daily data available. Ensure the sheet has a Date column.
    </div>
  );

  const data = rows.map(r => ({
    name: r.name, // The exact date string (e.g., "Jun 3")
    ...Object.fromEntries(LINES.map(l => [l.key, r[l.key] ?? 0])),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={1}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fill:'var(--text-muted)', fontSize:11 }} 
          axisLine={false} tickLine={false} 
        />
        <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<Tip />} cursor={{ fill:'rgba(79,124,255,0.05)' }} />
        <Legend wrapperStyle={{ fontSize:'0.75rem', color:'var(--text-secondary)', paddingTop:12 }} />
        {LINES.map(l => (
          <Bar 
            key={l.key} 
            dataKey={l.key} 
            name={l.label} 
            fill={l.color} 
            radius={[3,3,0,0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
