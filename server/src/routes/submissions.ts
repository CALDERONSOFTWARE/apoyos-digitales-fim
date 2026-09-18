import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { calculateCompletion } from '../utils/completion.js';
import { audit } from '../utils/audit.js';

const router=Router(); router.use(requireAuth);

router.get('/form/:formId', requireAdmin, async (req,res,next)=>{ try {
  const {data,error}=await supabaseAdmin.from('submissions').select('*, profiles!submissions_respondent_id_fkey(full_name,email), submission_answers(*)').eq('form_id',req.params.formId).order('submitted_at',{ascending:false}); if(error) throw error; res.json(data);
}catch(e){next(e)}});

router.get('/mine', async (req,res,next)=>{try{const {data,error}=await supabaseAdmin.from('submissions').select('*, forms(title)').eq('respondent_id',req.profile!.id).order('submitted_at',{ascending:false});if(error)throw error;res.json(data)}catch(e){next(e)}});

router.get('/:id', async (req,res,next)=>{try{
  const {data,error}=await supabaseAdmin.from('submissions').select('*, forms(*), profiles!submissions_respondent_id_fkey(full_name,email), submission_answers(*, form_fields(*))').eq('id',req.params.id).single(); if(error) throw error;
  if(req.profile!.role!=='admin' && data.respondent_id!==req.profile!.id) return res.status(403).json({error:'Sin acceso'}); res.json(data);
}catch(e){next(e)}});

router.post('/', async (req,res,next)=>{try{
  const formId=req.body.form_id; const answers=Array.isArray(req.body.answers)?req.body.answers:[];
  const {data:form,error:fo}=await supabaseAdmin.from('forms').select('id,status').eq('id',formId).single(); if(fo) throw fo; if(form.status!=='published') return res.status(400).json({error:'Formulario no publicado'});
  const {data:fields,error:fe}=await supabaseAdmin.from('form_fields').select('id,required,type').eq('form_id',formId); if(fe) throw fe;
  const completion=calculateCompletion(fields??[],answers);
  const {data:sub,error:se}=await supabaseAdmin.from('submissions').insert({form_id:formId,respondent_id:req.profile!.id,status:'submitted',validation_status:completion===100?'pending':'incomplete',validation_score:completion}).select().single(); if(se) throw se;
  if(answers.length){const rows=answers.map((a:any)=>({submission_id:sub.id,field_id:a.field_id,value:a.value}));const {error:ae}=await supabaseAdmin.from('submission_answers').insert(rows);if(ae)throw ae;}
  res.status(201).json(sub);
}catch(e){next(e)}});

router.put('/:id', requireAdmin, async (req,res,next)=>{try{
  const {data:old,error:oe}=await supabaseAdmin.from('submissions').select('*').eq('id',req.params.id).single();if(oe)throw oe;
  const patch:any={}; ['status','validation_status','validation_score','admin_notes'].forEach(k=>{if(req.body[k]!==undefined)patch[k]=req.body[k]});
  if(['validated','rejected'].includes(patch.validation_status)){patch.validated_by=req.profile!.id;patch.validated_at=new Date().toISOString();}
  const {data,error}=await supabaseAdmin.from('submissions').update(patch).eq('id',req.params.id).select().single();if(error)throw error;
  await audit(req.profile!.id,'submission',data.id,patch.validation_status==='validated'?'submission_validated':'submission_updated',old,data);res.json(data);
}catch(e){next(e)}});

router.put('/:id/answers', requireAdmin, async (req,res,next)=>{try{
  const answers=Array.isArray(req.body.answers)?req.body.answers:[];
  const {data:old}=await supabaseAdmin.from('submission_answers').select('*').eq('submission_id',req.params.id);
  for(const a of answers){const {error}=await supabaseAdmin.from('submission_answers').upsert({submission_id:req.params.id,field_id:a.field_id,value:a.value},{onConflict:'submission_id,field_id'});if(error)throw error;}
await audit(
  req.profile!.id,
  'submission',
  String(req.params.id),
  'submission_updated',
  old,
  answers
);

res.json({ ok: true });
}catch(e){next(e)}});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id);

    const { data: old } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await audit(
      req.profile!.id,
      'submission',
      id,
      'submission_deleted',
      old,
      null
    );

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
export default router;
