'use client';

const getCols = (type) => {
  const cols = [
    { key:'name',        label: type || 'Profile', align:'left'  },
    { key:'totalQuery',  label:'Total Query',      align:'center' },
    { key:'freshQuery',  label:'Fresh Query',      align:'center' },
    { key:'totalBrief',  label:'Total Brief',      align:'center' },
    { key:'freshBrief',  label:'Fresh Brief',      align:'center' },
    { key:'quoteSent',   label:'Quote Sent',       align:'center' },
    { key:'converted',   label:'Converted',        align:'center' },
    { key:'queryConverted',label:'Query Conv.',    align:'center' },
    { key:'briefConverted',label:'Brief Conv.',    align:'center' },
    { key:'passSpam',    label:'Pass/Spam',        align:'center' },
    { key:'directOrder', label:'Direct Order',     align:'center' },
    { key:'quoteVsConv', label:'Quote VS Conv.',   align:'center', isPct:true },
    { key:'queryVsConv', label:'Query VS Conv.',   align:'center', isPct:true },
    { key:'briefVsConv', label:'Brief VS Conv.',   align:'center', isPct:true },
  ];

  if (type === 'SELLER') {
    cols.push({ key:'target',      label:'Target',           align:'center', isCurrency:true });
    cols.push({ key:'achieved',    label:'Achieved',         align:'center', isCurrency:true });
  }

  return cols;
};

function pctBadge(val) {
  const n = parseFloat(String(val).replace('%','')) || 0;
  const color = n >= 35 ? 'var(--green)'  : n >= 20 ? 'var(--yellow)' : 'var(--red)';
  const bg    = n >= 35 ? 'var(--green-bg)' : n >= 20 ? 'var(--yellow-bg)' : 'var(--red-bg)';
  return { color, bg };
}

const AVATAR_COLORS = [
  '#4f7cff','#a78bfa','#10d98a','#f5c542','#ff5e7a',
  '#38bdf8','#fb923c','#34d399','#f472b6','#818cf8','#e879f9',
];

export default function SalesTable({ rows, totals, sortKey, sortDir, onSort, type, onRowClick, onCellClick }) {
  const COLS = getCols(type);
  const sorted = [...rows].sort((a, b) => {
    const av = parseFloat(a[sortKey]) || 0;
    const bv = parseFloat(b[sortKey]) || 0;
    if (!isNaN(av) && !isNaN(bv)) return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc'
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  const th = (col) => ({
    padding:'8px 10px',
    textAlign: col.align,
    fontSize:'0.68rem', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.03em',
    color: sortKey === col.key ? 'var(--accent)' : 'var(--text-muted)',
    cursor:'pointer', whiteSpace:'nowrap', userSelect:'none',
    transition:'color 0.15s',
    borderBottom:'1px solid var(--border)',
    background:'var(--bg-secondary)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  });

  const td = (align, extra={}) => ({
    padding:'8px 10px',
    textAlign: align,
    fontSize:'0.8rem',
    color:'var(--text-primary)',
    borderBottom:'1px solid rgba(99,130,255,0.06)',
    whiteSpace:'nowrap',
    ...extra,
  });

  return (
    <div style={{ overflow:'auto', maxHeight: type === 'DATE' ? '70vh' : 'none' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {COLS.map(col => (
              <th key={col.key} style={th(col)} onClick={() => onSort(col.key)}>
                {col.label}
                {sortKey === col.key && <span style={{ marginLeft:4 }}>{sortDir==='asc'?'↑':'↓'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}
              onClick={() => onRowClick && onRowClick(row.name)}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
              style={{ transition:'background 0.15s', cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {COLS.map(col => {
                const val = row[col.key];
                if (col.isPct) {
                  const { color, bg } = pctBadge(val);
                  let tooltip = '';
                  if (col.key === 'quoteVsConv') tooltip = `${row.converted ?? 0} Converted ÷ ${row.quoteSent ?? 0} Quotes Sent`;
                  if (col.key === 'queryVsConv') tooltip = `${row.converted ?? 0} Converted ÷ ${row.freshQuery ?? 0} Fresh Queries`;
                  if (col.key === 'briefVsConv') tooltip = `${row.briefConverted ?? 0} Briefs Converted ÷ ${row.freshBrief ?? 0} Fresh Briefs`;

                  return (
                    <td key={col.key} style={td(col.align)} title={tooltip}>
                      <span style={{
                        display:'inline-block', padding:'2px 10px',
                        borderRadius:'999px', fontSize:'0.78rem', fontWeight:600,
                        color, background:bg, cursor:'help'
                      }}>{val}%</span>
                    </td>
                  );
                }
                if (col.isCurrency) {
                  const numVal = Number(val) || 0;
                  const targetNum = Number(row.target) || 0;
                  let color = 'var(--text-primary)';
                  if (col.key === 'achieved' && targetNum > 0) {
                     color = numVal >= targetNum ? 'var(--green)' : 'var(--yellow)';
                  }
                  return (
                    <td key={col.key} style={{...td(col.align), color, fontWeight: 600}}>
                      ${numVal.toLocaleString()}
                    </td>
                  );
                }
                if (col.key === 'name') {
                  return (
                    <td key={col.key} style={td(col.align)}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{
                          width:32, height:32, borderRadius:'50%', flexShrink:0,
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'0.78rem', fontWeight:700, color:'#fff',
                        }}>
                          {String(val).charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600 }}>{val}</span>
                      </div>
                    </td>
                  );
                }
                const isClickable = onCellClick && col.key !== 'name' && !col.isPct;
                return (
                  <td key={col.key} 
                      style={{...td(col.align), cursor: isClickable ? 'pointer' : 'inherit', transition: 'color 0.15s'}}
                      onClick={(e) => {
                        if (isClickable) {
                          e.stopPropagation();
                          onCellClick(col.key, row.name);
                        }
                      }}
                      onMouseEnter={e => { if (isClickable) e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { if (isClickable) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    {val ?? 0}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {totals && (
          <tfoot>
            <tr style={{ background:'rgba(79,124,255,0.06)', borderTop:'2px solid var(--accent)' }}>
              {COLS.map(col => {
                const val = totals[col.key];
                if (col.isPct) {
                  const { color, bg } = pctBadge(val);
                  let tooltip = '';
                  if (col.key === 'quoteVsConv') tooltip = `${totals.converted ?? 0} Converted ÷ ${totals.quoteSent ?? 0} Quotes Sent`;
                  if (col.key === 'queryVsConv') tooltip = `${totals.converted ?? 0} Converted ÷ ${totals.freshQuery ?? 0} Fresh Queries`;
                  if (col.key === 'briefVsConv') tooltip = `${totals.briefConverted ?? 0} Briefs Converted ÷ ${totals.freshBrief ?? 0} Fresh Briefs`;

                  return (
                    <td key={col.key} style={{ ...td(col.align), fontWeight:700, borderBottom:'none' }} title={tooltip}>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:'999px', fontSize:'0.78rem', fontWeight:700, color, background:bg, cursor:'help' }}>
                        {val}%
                      </span>
                    </td>
                  );
                }
                if (col.isCurrency) {
                  const numVal = Number(val) || 0;
                  const targetNum = Number(totals.target) || 0;
                  let color = 'var(--text-primary)';
                  if (col.key === 'achieved' && targetNum > 0) {
                     color = numVal >= targetNum ? 'var(--green)' : 'var(--yellow)';
                  }
                  return (
                    <td key={col.key} style={{...td(col.align), fontWeight:700, borderBottom:'none', color}}>
                      ${numVal.toLocaleString()}
                    </td>
                  );
                }
                if (col.key === 'name') {
                  return <td key={col.key} style={{ ...td(col.align), fontWeight:700, borderBottom:'none' }}>TOTAL</td>;
                }
                const isClickable = onCellClick && col.key !== 'name' && !col.isPct;
                return (
                  <td key={col.key} 
                      style={{ ...td(col.align), fontWeight:700, borderBottom:'none', cursor: isClickable ? 'pointer' : 'inherit', transition: 'color 0.15s' }}
                      onClick={(e) => {
                        if (isClickable) {
                          e.stopPropagation();
                          onCellClick(col.key, 'TOTAL');
                        }
                      }}
                      onMouseEnter={e => { if (isClickable) e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { if (isClickable) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  >
                    {val ?? 0}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
