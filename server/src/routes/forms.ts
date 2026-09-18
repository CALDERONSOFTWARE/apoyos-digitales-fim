import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req,res,next)=>{
  try {
    let query = supabaseAdmin.from('forms').select('*, form_fields(count), submissions(count)').order('updated_at',{ascending:false});
    if (req.profile?.role !== 'admin') query = query.eq('status','published');
    const {data,error}=await query; if(error) throw error; res.json(data);
  } catch(e){next(e)}
});

router.get('/:id', async (req,res,next)=>{
  try {
    const {data:form,error}=await supabaseAdmin.from('forms').select('*').eq('id',req.params.id).single(); if(error) throw error;
    if(req.profile?.role!=='admin' && form.status!=='published') return res.status(403).json({error:'Formulario no disponible'});
    const {data:fields,error:fe}=await supabaseAdmin.from('form_fields').select('*').eq('form_id',req.params.id).order('position'); if(fe) throw fe;
    res.json({...form,fields});
  }catch(e){next(e)}
});

router.post('/', requireAdmin, async (req,res,next)=>{
  try {
    const payload={title:req.body.title,description:req.body.description??'',status:'draft',created_by:req.profile!.id,settings:req.body.settings??{}};
    const {data,error}=await supabaseAdmin.from('forms').insert(payload).select().single(); if(error) throw error;
    await audit(req.profile!.id,'form',data.id,'form_created',null,data); res.status(201).json(data);
  }catch(e){next(e)}
});

router.put('/:id', requireAdmin, async (req,res,next)=>{
  try {
    const {data:old}=await supabaseAdmin.from('forms').select('*').eq('id',req.params.id).single();
    const allowed={title:req.body.title,description:req.body.description,status:req.body.status,settings:req.body.settings,published_at:req.body.status==='published'?new Date().toISOString():req.body.published_at};
    const {data,error}=await supabaseAdmin.from('forms').update(allowed).eq('id',req.params.id).select().single(); if(error) throw error;
    await audit(req.profile!.id,'form',data.id,'form_updated',old,data); res.json(data);
  }catch(e){next(e)}
});

router.delete('/:id', requireAdmin, async (req,res,next)=>{
 try {
  const id = String(req.params.id);

  const { data: old } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin
    .from('forms')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await audit(
    req.profile!.id,
    'form',
    id,
    'form_deleted',
    old,
    null
  );

  res.status(204).end();
} catch (e) {
  next(e);
}
});

router.post('/:id/duplicate', requireAdmin, async (req,res,next)=>{
  try {
    const {data:source,error}=await supabaseAdmin.from('forms').select('*').eq('id',req.params.id).single(); if(error) throw error;
    const {data:fields,error:fe}=await supabaseAdmin.from('form_fields').select('*').eq('form_id',req.params.id).order('position'); if(fe) throw fe;
    const {data:newForm,error:ie}=await supabaseAdmin.from('forms').insert({title:`${source.title} (copia)`,description:source.description,status:'draft',created_by:req.profile!.id,settings:source.settings}).select().single(); if(ie) throw ie;
    if(fields?.length){ const copies=fields.map(({id,created_at,updated_at,...f})=>({...f,form_id:newForm.id})); const {error:ce}=await supabaseAdmin.from('form_fields').insert(copies); if(ce) throw ce; }
    await audit(req.profile!.id,'form',newForm.id,'form_created',null,newForm); res.status(201).json(newForm);
  }catch(e){next(e)}
});

router.put('/:id/fields', requireAdmin, async (req,res,next)=>{
  try {
    const fields=Array.isArray(req.body.fields)?req.body.fields:[];
    const normalized=fields.map((f:any,i:number)=>({
      id:f.id && !String(f.id).startsWith('tmp-') ? f.id : undefined, form_id:req.params.id, type:f.type, label:f.label, description:f.description??'', required:!!f.required,
      position:i, options:f.options??[], validation:f.validation??{}, conditional_logic:f.conditional_logic??{}, settings:f.settings??{}
    }));
    const incomingIds=normalized.filter((f:any)=>f.id).map((f:any)=>f.id);
    let del=supabaseAdmin.from('form_fields').delete().eq('form_id',req.params.id); if(incomingIds.length) del=del.not('id','in',`(${incomingIds.join(',')})`); const {error:de}=await del; if(de) throw de;
    for(const field of normalized){
      const {id,...body}=field;
      if(id){ const {error}=await supabaseAdmin.from('form_fields').update(body).eq('id',id); if(error) throw error; }
      else { const {error}=await supabaseAdmin.from('form_fields').insert(body); if(error) throw error; }
    }
    const {data,error}=await supabaseAdmin.from('form_fields').select('*').eq('form_id',req.params.id).order('position'); if(error) throw error;
const id = String(req.params.id);

await audit(
  req.profile!.id,
  'form',
  id,
  'form_updated',
  null,
  { fields: data }
);

res.json(data);
  }catch(e){next(e)}
});

export default router;
