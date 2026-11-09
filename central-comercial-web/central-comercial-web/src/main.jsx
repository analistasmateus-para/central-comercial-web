import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { auth, login, signOut, onAuthStateChanged } from './firebase';
import { api } from './api';
import './style.css';

const MODULES = { vendedores: 'Situação de Vendedores', crm: 'CRM de Clientes', propostas: 'Análise de Propostas', gerais: 'Relatórios Gerais' };
const TYPES = [ ['volume', 'Volume', 'R$'], ['positivacao', 'Positivação', 'clientes'], ['mix', 'Mix', 'itens'] ];
const num = v => v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const formatNumber = (v, digits = 0) => v == null ? '—' : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
const money = v => v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const percent = v => v == null ? '—' : `${formatNumber(Math.min(100, Math.max(0, v)), 1)}%`;
const rate = item => { const p = num(item?.percentual); if (p !== null) return Math.min(100, Math.max(0, p)); const meta = num(item?.meta); const realizado = num(item?.realizado); return meta > 0 && realizado !== null ? Math.min(100, Math.max(0, realizado / meta * 100)) : null; };
const dateTime = value => { if (!value) return 'Não informada'; const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Data inválida' : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d); };
const month = value => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 'Não informada'; const [y, m] = value.split('-').map(Number); return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1))); };
const displayValue = (v, kind) => kind === 'R$' ? money(v) : formatNumber(v, 0);
const keyOf = r => `${r.codigo_coordenacao || ''}|${r.codigo_supervisao || ''}|${r.codigo_vendedor || ''}`;
const unique = (arr, fn) => new Set(arr.map(fn).filter(Boolean)).size;

function Metric({ title, value, sub }) { return <div className="metric"><span>{title}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>; }
function Progress({ value }) { const p = value == null ? 0 : Math.min(100, Math.max(0, value)); return <div className="progress" role="progressbar" aria-valuenow={p} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${p}%`, background: p >= 100 ? '#16845c' : p >= 70 ? '#1763a8' : '#d18a22' }} /></div>; }
function Indicator({ item, name, kind }) { const p = rate(item); return <div className="indicator"><div className="indicator-heading"><strong>{name}</strong><b>{percent(p)}</b></div><Progress value={p}/><div className="indicator-values"><span>Meta <b>{displayValue(num(item?.meta), kind)}</b></span><span>Realizado <b>{displayValue(num(item?.realizado), kind)}</b></span>{num(item?.tendencia) !== null && <span>Tendência <b>{displayValue(num(item?.tendencia), kind)}</b></span>}</div></div>; }

function App() {
  const [user, setUser] = useState(undefined);
  const [me, setMe] = useState(null);
  const [module, setModule] = useState('vendedores');
  const [coord, setCoord] = useState('');
  const [sup, setSup] = useState('');
  const [seller, setSeller] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, u => {
      if (!active) return;
      setUser(u); setMe(null); setRows([]); setMetadata(null); setError('');
      if (u) api('/api/me').then(data => { if (active) setMe(data); }).catch(e => { if (active) setError(e.message); });
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!me) return;
    const allowed = Array.isArray(me.modules) ? me.modules : [];
    if (!allowed.includes(module) && allowed.length) setModule(allowed[0]);
  }, [me, module]);
  useEffect(() => {
    if (!me || !(me.modules || []).includes(module)) return;
    let active = true;
    setLoading(true); setError(''); setRows([]); setMetadata(null); setSelected('');
    const query = coord ? '?coordenacao=' + encodeURIComponent(coord) : '';
    api('/api/reports/' + module + query)
      .then(data => { if (!active) return; setRows(Array.isArray(data.rows) ? data.rows : []); setMetadata(data); })
      .catch(e => { if (active) { setError(e.message); setRows([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [me, module, coord]);

  const coords = Array.isArray(me?.coordenacoes) ? me.coordenacoes : [];
  const supOptions = useMemo(() => [...new Map(rows.map(r => [`${r.codigo_coordenacao}|${r.codigo_supervisao}`, { code: String(r.codigo_supervisao ?? ''), name: r.supervisao, coord: r.codigo_coordenacao }])).values()].filter(s => s.code).sort((a,b) => String(a.name).localeCompare(String(b.name),'pt-BR')), [rows]);
  const supRows = useMemo(() => sup ? rows.filter(r => `${r.codigo_coordenacao}|${r.codigo_supervisao}` === sup) : rows, [rows, sup]);
  const sellerOptions = useMemo(() => [...new Map(supRows.map(r => [keyOf(r), { key: keyOf(r), name: r.vendedor, code: r.codigo_vendedor }])).values()].sort((a,b) => String(a.name).localeCompare(String(b.name),'pt-BR')), [supRows]);
  const visible = useMemo(() => supRows.filter(r => (!seller || keyOf(r) === seller) && (!search.trim() || [r.vendedor,r.codigo_vendedor,r.supervisao,r.codigo_supervisao,r.coordenacao].some(v => String(v ?? '').toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))))), [supRows, seller, search]);
  const ordered = useMemo(() => [...visible].sort((a,b) => String(a.coordenacao).localeCompare(String(b.coordenacao),'pt-BR') || String(a.supervisao).localeCompare(String(b.supervisao),'pt-BR') || String(a.vendedor).localeCompare(String(b.vendedor),'pt-BR')), [visible]);
  const detail = ordered.find(r => keyOf(r) === selected);
  const updates = metadata?.ultima_atualizacao && typeof metadata.ultima_atualizacao === 'object' ? metadata.ultima_atualizacao : {};
  const competencies = metadata?.competencias && typeof metadata.competencias === 'object' ? metadata.competencias : {};
  const activeCoords = coords.filter(c => !coord || c.codigo === coord);
  const totals = useMemo(() => TYPES.map(([key,name,kind]) => {
    const values = visible.map(r => r.indicadores?.[key]).filter(Boolean);
    const meta = values.reduce((a,x) => a + (num(x.meta) ?? 0), 0);
    const realizado = values.reduce((a,x) => a + (num(x.realizado) ?? 0), 0);
    const tendencia = values.some(x => num(x.tendencia) !== null) ? values.reduce((a,x) => a + (num(x.tendencia) ?? 0), 0) : null;
    return { key,name,kind,meta,realizado,tendencia,hasData:values.length > 0 };
  }), [visible]);

  if (user === undefined) return <main className="page">Carregando…</main>;
  if (!user) return <main className="login"><h1>Central Comercial</h1><p>Acesso exclusivo para usuários autorizados.</p><button className="primary" onClick={() => login().catch(e => setError(e.message))}>Entrar com Google</button>{error && <p className="error">{error}</p>}</main>;
  if (!me) return <main className="page"><h1>Central Comercial</h1><p>{error || 'Validando autorização…'}</p><button onClick={() => signOut(auth)}>Sair</button></main>;
  const allowed = Array.isArray(me.modules) ? me.modules : [];
  return <>
    <header className="topbar"><strong>Central Comercial</strong><div className="account"><span>{user.email}</span><button onClick={() => signOut(auth)}>Sair</button></div></header>
    <main className="page">
      <nav className="modules">{Object.entries(MODULES).filter(([k]) => allowed.includes(k)).map(([k,name]) => <button key={k} className={module === k ? 'active' : ''} onClick={() => { setModule(k);setCoord('');setSup('');setSeller('');setSearch(''); }}>{name}</button>)}</nav>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">PAINEL COMERCIAL</p><h1>{MODULES[module]}</h1><p className="muted">Acompanhamento de metas e resultados por coordenação, supervisão e RCA.</p></div><span className="count-tag">{loading ? 'Carregando…' : `${visible.length} vendedores exibidos`}</span></div>
        <div className="filters">
          <label>Coordenação<select value={coord} onChange={e => {setCoord(e.target.value);setSup('');setSeller('');setSearch('');}}><option value="">Todas autorizadas</option>{coords.map(c => <option key={c.id} value={c.codigo}>{c.nome}</option>)}</select></label>
          <label>Supervisão<select value={sup} onChange={e => {setSup(e.target.value);setSeller('');}}><option value="">Todas</option>{supOptions.map(s => <option key={`${s.coord}|${s.code}`} value={`${s.coord}|${s.code}`}>{s.name} ({s.code})</option>)}</select></label>
          <label>Vendedor<select value={seller} onChange={e => setSeller(e.target.value)}><option value="">Todos</option>{sellerOptions.map(s => <option key={s.key} value={s.key}>{s.name} ({s.code})</option>)}</select></label>
          <label>Pesquisar<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome ou código" /></label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="kpis"><Metric title="Vendedores no filtro" value={formatNumber(unique(visible,keyOf))}/><Metric title="Supervisões" value={formatNumber(unique(visible,r => `${r.codigo_coordenacao}|${r.codigo_supervisao}`))}/><Metric title="Coordenações" value={formatNumber(unique(visible,r => r.codigo_coordenacao))}/><Metric title="Registros na consulta" value={formatNumber(rows.length)} sub="Antes dos filtros locais"/></div>
        <div className="updates"><h2>Atualização por coordenação</h2><div className="update-grid">{activeCoords.map(c => <div className="update-item" key={c.codigo}><strong>{c.nome}</strong><span>Atualizado: {dateTime(updates[c.codigo])}</span><span>Competência: {month(competencies[c.codigo])}</span></div>)}</div></div>
        {module === 'vendedores' && <>
          <div className="section-title"><h2>Indicadores consolidados</h2><span className="muted">Soma das metas e realizados dos vendedores filtrados</span></div>
          <div className="summary-grid">{totals.map(t => <div className="summary-card" key={t.key}><div className="summary-top"><strong>{t.name}</strong><b>{t.hasData && t.meta > 0 ? percent(t.realizado / t.meta * 100) : '—'}</b></div><Progress value={t.hasData && t.meta > 0 ? t.realizado / t.meta * 100 : null}/><div className="summary-values"><span>Meta <strong>{t.hasData ? displayValue(t.meta,t.kind) : '—'}</strong></span><span>Realizado <strong>{t.hasData ? displayValue(t.realizado,t.kind) : '—'}</strong></span>{t.tendencia !== null && <span>Tendência <strong>{displayValue(t.tendencia,t.kind)}</strong></span>}</div></div>)}</div>
          <div className="section-title"><h2>Vendedores</h2><span className="muted">Selecione um vendedor para ver todos os indicadores</span></div>
          <div className="scroll"><table><thead><tr><th>Vendedor</th><th>Coordenação</th><th>Supervisão</th><th>Volume</th><th>Positivação</th><th>Mix</th><th>Detalhes</th></tr></thead><tbody>{ordered.map(r => <tr key={keyOf(r)}><td><strong>{r.vendedor}</strong><small>RCA {r.codigo_vendedor}</small></td><td>{r.coordenacao}</td><td>{r.supervisao}<small>{r.codigo_supervisao}</small></td>{TYPES.map(([key]) => <td key={key}><span className="pct">{percent(rate(r.indicadores?.[key]))}</span><Progress value={rate(r.indicadores?.[key])}/></td>)}<td><button className="detail-btn" onClick={() => setSelected(keyOf(r))}>Ver</button></td></tr>)}</tbody></table>{!loading && !ordered.length && <p className="empty">Nenhum vendedor encontrado.</p>}</div>
          {detail && <div className="detail-backdrop" onClick={() => setSelected('')}><div className="detail-panel" role="dialog" aria-modal="true" aria-label="Indicadores do vendedor" onClick={e => e.stopPropagation()}><div className="detail-header"><div><p className="eyebrow">DETALHAMENTO DO RCA</p><h2>{detail.vendedor}</h2><p className="muted">Código {detail.codigo_vendedor} · {detail.supervisao} · {detail.coordenacao}</p><p className="muted">Competência: {month(detail.competencia)}</p></div><button onClick={() => setSelected('')} aria-label="Fechar detalhes">✕</button></div><div className="detail-indicators">{TYPES.map(([key,name,kind]) => <Indicator key={key} name={name} kind={kind} item={detail.indicadores?.[key]}/>)}</div><button className="primary close-btn" onClick={() => setSelected('')}>Fechar</button></div></div>}
        </>}
        <p className="hint">Dados consultados pela API conforme as permissões do usuário. Os percentuais visuais são limitados a 100%; metas e valores realizados permanecem integrais. Exportação PDF ainda não implementada.</p>
      </section>
    </main>
  </>;
}
createRoot(document.getElementById('root')).render(<App />);
