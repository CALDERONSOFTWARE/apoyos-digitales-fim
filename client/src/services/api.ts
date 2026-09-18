import { supabase } from './supabase';
const base=import.meta.env.VITE_API_URL??'http://localhost:4000/api';
async function request<T>(path:string,options:RequestInit={}){
  const {data:{session}}=await supabase.auth.getSession();
  const res=await fetch(`${base}${path}`,{...options,headers:{'Content-Type':'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }),...(options.headers??{})}});
  if(!res.ok){const e=await res.json().catch(()=>({error:res.statusText}));throw new Error(e.error??'Error de API')}
  if(res.status===204)return undefined as T;
  return res.json() as Promise<T>;
}
export const api={get:<T>(p:string)=>request<T>(p),post:<T>(p:string,b?:any)=>request<T>(p,{method:'POST',body:JSON.stringify(b??{})}),put:<T>(p:string,b:any)=>request<T>(p,{method:'PUT',body:JSON.stringify(b)}),delete:<T>(p:string)=>request<T>(p,{method:'DELETE'})};
