import {auth} from './firebase';
const base=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
export async function api(path){
  if(!base)throw new Error('VITE_API_URL não configurada no GitHub Actions');
  const token=await auth.currentUser?.getIdToken();
  if(!token)throw new Error('Login Firebase obrigatório');
  let response;
  try {response=await fetch(base+path,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});}
  catch {throw new Error('Não foi possível conectar à API Cloudflare (rede ou CORS)');}
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`API HTTP ${response.status}: ${payload.error||payload.message||'Falha na consulta'}`);
  return payload;
}
