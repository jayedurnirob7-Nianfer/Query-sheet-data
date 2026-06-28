'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const LINES = [
  { key:'quoteVsConv', label:'Quote VS Conv.', color:'#4f7cff' },
  { key:'queryVsConv', label:'Query VS Conv.', color:'#10d98a' },
  { key:'totalVsConv', label:'Total VS Conv.', color:'#f5c542' },
];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ fontWeight:700, marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', justifyContent:'space-between', gap:16, color:p.stroke }}>
          <span>{p.name}</span><span style={{ fontWeight:600 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function ConversionChart({ rows }) {
  const data = rows.map(r => ({
    name: r.name,
    ...Object.fromEntries(LINES.map(l => [l.key, r[l.key] ?? 0])),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={36} tickFormatter={v => `${v}%`} />
        <Tooltip content={<Tip />} cursor={{ stroke:'rgba(79,124,255,0.15)', strokeWidth:1 }} />
        <Legend wrapperStyle={{ fontSize:'0.75rem', color:'var(--text-secondary)', paddingTop:8 }} />
        {LINES.map(l => (
          <Line
            key={l.key} type="monotone"
            dataKey={l.key} name={l.label} stroke={l.color}
            strokeWidth={2} dot={{ r:4, fill:l.color, strokeWidth:0 }} activeDot={{ r:6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
