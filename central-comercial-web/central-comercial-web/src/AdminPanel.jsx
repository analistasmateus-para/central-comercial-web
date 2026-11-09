import React,{useEffect,useState} from 'react';
import {api} from './api';
const MODULE_NAMES={vendedores:'Situação de Vendedores',crm:'CRM de Clientes',propostas:'Análise de Propostas',gerais:'Relatórios Gerais'};
const blank={nome:'',email:'',ativo:true,administrador:false,coordenacoes:[],modulos:['vendedores']};
export default function AdminPanel({me}) {
  const [data,setData]=useState(null),[editing,setEditing]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[filter,setFilter]=useState('');
  const reload=async()=>{const result=await api('/api/admin/usuarios');setData(result);};
  useEffect(()=>{reload().catch(e=>setError(e.message));},[]);
  if(!me?.administrador)return <section className="panel"><h1>Acesso restrito</h1><p>Somente administradores podem gerenciar usuários.</p></section>;
  const change=(key,value)=>setEditing(v=>({...v,[key]:value}));
  const toggle=(key,value)=>change(key,editing[key].includes(value)?editing[key].filter(x=>x!==value):[...editing[key],value]);
  const save=async()=>{
    if(!editing)return;
    if(!window.confirm(`Confirmar ${editing.id?'alterações':'cadastro'} para ${editing.email}?`))return;
    setBusy(true);setError('');setNotice('');
    try{await api('/api/admin/usuarios',{method:editing.id?'PATCH':'POST',body:editing});await reload();setEditing(null);setNotice('Permissões salvas. Alterações de acesso serão aplicadas nas próximas consultas.');}
    catch(e){setError(e.message+'; confira o cadastro e as permissões antes de tentar novamente.');}
    finally{setBusy(false);}
  };
  const users=(data?.usuarios||[]).filter(u=>[u.nome,u.email].some(s=>String(s||'').toLowerCase().includes(filter.toLowerCase())));
  return <section className="panel admin-panel">
    <div className="panel-heading"><div><p className="eyebrow">GESTÃO DE ACESSOS</p><h1>Painel Administrador</h1><p className="muted">Cadastre usuários e controle coordenações, módulos e bloqueios.</p></div><button className="primary" onClick={()=>{setEditing({...blank});setError('');}}>+ Novo usuário</button></div>
    <div className="kpis admin-stats"><div className="metric"><span>Usuários</span><strong>{data?.usuarios?.length??'—'}</strong></div><div className="metric"><span>Ativos</span><strong>{data?.usuarios?.filter(u=>u.ativo).length??'—'}</strong></div><div className="metric"><span>Bloqueados</span><strong>{data?.usuarios?.filter(u=>!u.ativo).length??'—'}</strong></div><div className="metric"><span>Administradores</span><strong>{data?.usuarios?.filter(u=>u.administrador).length??'—'}</strong></div></div>
    {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="admin-notice">{notice}</p>}
    <div className="admin-tools"><input aria-label="Pesquisar usuários" placeholder="Pesquisar nome ou e-mail" value={filter} onChange={e=>setFilter(e.target.value)}/><button onClick={()=>reload().then(()=>setNotice('Lista atualizada.')).catch(e=>setError(e.message))}>Atualizar</button></div>
    <div className="scroll"><table><thead><tr><th>Usuário</th><th>Status</th><th>Perfil</th><th>Coordenações</th><th>Módulos</th><th>Ação</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.nome}</strong><small>{u.email}</small><small>{u.vinculado?'Google vinculado':'Aguardando primeiro login'}</small></td><td><span className={u.ativo?'admin-active':'admin-inactive'}>{u.ativo?'Ativo':'Bloqueado'}</span></td><td>{u.administrador?'Administrador':'Usuário'}</td><td>{u.coordenacoes.map(id=>data.coordenacoes.find(c=>c.id===id)?.nome||id).join(', ')||'Nenhuma'}</td><td>{u.modulos.map(m=>MODULE_NAMES[m]||m).join(', ')||'Nenhum'}</td><td><button className="detail-btn" onClick={()=>{setEditing({...u});setError('');setNotice('');}}>Gerenciar</button></td></tr>)}</tbody></table>{data&&!users.length&&<p className="empty">Nenhum usuário encontrado.</p>}</div>
    {!data&&!error&&<p>Carregando usuários…</p>}
    <p className="hint">Para liberar um novo usuário, cadastre o mesmo e-mail utilizado na conta Google. No primeiro login verificado, a conta será vinculada automaticamente. Módulos sem relatórios implementados não exibirão dados.</p>
    {editing&&<div className="detail-backdrop" onClick={()=>!busy&&setEditing(null)}><div className="detail-panel admin-dialog" role="dialog" aria-modal="true" aria-label="Gerenciar usuário" onClick={e=>e.stopPropagation()}>
      <div className="detail-header"><div><p className="eyebrow">{editing.id?'EDITAR ACESSO':'CADASTRAR ACESSO'}</p><h2>{editing.id?'Gerenciar usuário':'Novo usuário'}</h2></div><button disabled={busy} onClick={()=>setEditing(null)} aria-label="Fechar">✕</button></div>
      <div className="admin-form"><label>Nome<input maxLength="120" value={editing.nome} onChange={e=>change('nome',e.target.value)} /></label><label>E-mail Google<input type="email" value={editing.email} onChange={e=>change('email',e.target.value)} /></label></div>
      <h3>Perfil</h3><div className="admin-checks"><label><input type="checkbox" checked={editing.ativo} onChange={e=>change('ativo',e.target.checked)}/> Usuário ativo</label><label><input type="checkbox" checked={editing.administrador} onChange={e=>change('administrador',e.target.checked)}/> Administrador</label></div>
      <h3>Coordenações autorizadas</h3><div className="admin-checks">{(data?.coordenacoes||[]).filter(c=>c.ativo||editing.coordenacoes.includes(c.id)).map(c=><label key={c.id}><input type="checkbox" checked={editing.coordenacoes.includes(c.id)} onChange={()=>toggle('coordenacoes',c.id)} /> {c.nome}</label>)}</div>
      <h3>Módulos autorizados</h3><div className="admin-checks">{Object.entries(MODULE_NAMES).map(([id,name])=><label key={id}><input type="checkbox" checked={editing.modulos.includes(id)} onChange={()=>toggle('modulos',id)}/> {name}</label>)}</div>
      {error&&<p className="error">{error}</p>}
      <div className="admin-actions"><button disabled={busy} onClick={()=>setEditing(null)}>Cancelar</button><button className="primary" disabled={busy} onClick={save}>{busy?'Salvando…':'Salvar permissões'}</button></div>
    </div></div>}
  </section>;
}
