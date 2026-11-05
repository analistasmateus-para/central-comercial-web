import {auth} from './firebase';
export async function api(path){const token=await auth.currentUser?.getIdToken();if(!token)throw Error('Login obrigatório');const response=await fetch(import.meta.env.VITE_API_URL+path,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw Error(`Consulta indisponível (${response.status})`);return response.json()}
