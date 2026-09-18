import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { cleanNumbers, frequencies, max, mean, median, min, mode, range, standardDeviation } from '../utils/stats.js';
const router=Router();router.use(requireAuth,requireAdmin);
router.get('/:formId',async(req,res,next)=>{try{
  const {data:fields,error:fe}=await supabaseAdmin.from('form_fields').select('*').eq('form_id',req.params.formId).order('position');if(fe)throw fe;
  const {data:subs,error:se}=await supabaseAdmin.from('submissions').select('id,validation_status,validation_score,submitted_at,submission_answers(field_id,value)').eq('form_id',req.params.formId);if(se)throw se;
  const answers=(subs??[]).flatMap((s:any)=>s.submission_answers??[]);
  const questions=(fields??[]).map((field:any)=>{
    const raw=answers.filter((a:any)=>a.field_id===field.id).map((a:any)=>a.value).filter((v:any)=>v!==null&&v!==undefined&&v!=='');
    const base:any={field,total:raw.length,unanswered:(subs?.length??0)-raw.length};
    if(['number','decimal','rating','range'].includes(field.type)){const nums=cleanNumbers(raw);base.numeric={count:nums.length,average:mean(nums),median:median(nums),mode:mode(nums),minimum:min(nums),maximum:max(nums),range:range(nums),standardDeviation:standardDeviation(nums)};base.frequency=frequencies(nums);}
    else if(['select_one','select_multiple','boolean'].includes(field.type)){base.frequency=frequencies(raw);base.mode=mode(raw.flatMap((v:any)=>Array.isArray(v)?v:[v]));}
    else if(['text','textarea','email','phone'].includes(field.type)){const words=raw.flatMap((v:any)=>String(v).toLowerCase().match(/[\p{L}\p{N}]{4,}/gu)??[]);base.text={unique:new Set(raw.map(String)).size,frequentWords:frequencies(words).slice(0,10)};}
    else if(['date','datetime'].includes(field.type)){base.frequency=frequencies(raw.map((v:any)=>String(v).slice(0,10)));}
    return base;
  });
  const total=subs?.length??0;res.json({summary:{total,validated:subs?.filter(s=>s.validation_status==='validated').length??0,pending:subs?.filter(s=>s.validation_status==='pending').length??0,incomplete:subs?.filter(s=>s.validation_status==='incomplete').length??0,rejected:subs?.filter(s=>s.validation_status==='rejected').length??0,averageCompletion:total?Number(((subs??[]).reduce((a,s)=>a+(s.validation_score??0),0)/total).toFixed(1)):0,lastSubmission:subs?.map(s=>s.submitted_at).filter(Boolean).sort().at(-1)??null},questions});
}catch(e){next(e)}});export default router;
