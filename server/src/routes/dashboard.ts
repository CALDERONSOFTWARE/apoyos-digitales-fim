import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
const router=Router(); router.use(requireAuth,requireAdmin);
router.get('/', async (_req,res,next)=>{try{
  const [{data:forms,error:fe},{data:subs,error:se}]=await Promise.all([
    supabaseAdmin.from('forms').select('id,title,status'),
    supabaseAdmin.from('submissions').select('id,form_id,status,validation_status,submitted_at,forms(title),profiles!submissions_respondent_id_fkey(full_name)').order('submitted_at',{ascending:false})
  ]); if(fe)throw fe;if(se)throw se;
  const byDay=new Map<string,number>(); const byForm=new Map<string,number>();
  (subs??[]).forEach((s:any)=>{const d=s.submitted_at?.slice(0,10);if(d)byDay.set(d,(byDay.get(d)||0)+1);const t=s.forms?.title??'Sin formulario';byForm.set(t,(byForm.get(t)||0)+1)});
  res.json({counts:{forms:forms?.length??0,active:forms?.filter(f=>f.status==='published').length??0,submissions:subs?.length??0,pending:subs?.filter(s=>s.validation_status==='pending').length??0,validated:subs?.filter(s=>s.validation_status==='validated').length??0,observations:subs?.filter(s=>['rejected','incomplete'].includes(s.validation_status)).length??0},recent:(subs??[]).slice(0,10),byDay:[...byDay].map(([date,count])=>({date,count})),byForm:[...byForm].map(([form,count])=>({form,count})).sort((a,b)=>b.count-a.count)});
}catch(e){next(e)}}); export default router;
