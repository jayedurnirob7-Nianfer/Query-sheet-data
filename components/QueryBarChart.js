'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const LINES = [
  { key:'totalQuery',  label:'Query',        color:'#4f7cff' },
  { key:'passSpam',    label:'Pass/Spam',    color:'#a78bfa' },
  { key:'quoteSent',   label:'Quote Sent',   color:'#10d98a' },
  { key:'totalBrief',  label:'Brief',        color:'#f5c542' },
  { key:'converted',   label:'Converted',    color:'#ff5e7a' },
];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ fontWeight:700, marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', justifyContent:'space-between', gap:16, color:'white' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:p.color || p.stroke || p.fill }}></span>
            <span>{p.name}</span>
          </div>
          <span style={{ fontWeight:600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function QueryBarChart({ rows }) {
  const data = rows.map(r => ({
    name: r.name,
    ...Object.fromEntries(LINES.map(b => [b.key, r[b.key] ?? 0])),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barSize={10} barGap={2} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<Tip />} cursor={{ fill:'rgba(79,124,255,0.05)' }} />
        <Legend wrapperStyle={{ fontSize:'0.75rem', color:'var(--text-secondary)', paddingTop:12 }} />
        {LINES.map(b => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[3,3,0,0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
