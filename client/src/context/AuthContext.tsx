import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { Profile } from '../types';

type AuthValue={session:Session|null;profile:Profile|null;loading:boolean;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthValue>({session:null,profile:null,loading:true,signOut:async()=>{}});
export function AuthProvider({children}:{children:ReactNode}){
 const[session,setSession]=useState<Session|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[loading,setLoading]=useState(true);
 async function load(s:Session|null){setSession(s);if(!s){setProfile(null);setLoading(false);return;}const{data}=await supabase.from('profiles').select('*').eq('id',s.user.id).single();setProfile(data as Profile);setLoading(false)}
 useEffect(()=>{supabase.auth.getSession().then(({data})=>load(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>load(s));return()=>subscription.unsubscribe()},[]);
 return <AuthContext.Provider value={{session,profile,loading,signOut:async()=>{await supabase.auth.signOut()}}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
