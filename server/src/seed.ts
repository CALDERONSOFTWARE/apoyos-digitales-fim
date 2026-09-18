import 'dotenv/config';
import { supabaseAdmin } from './config/supabase.js';

const adminEmail=process.env.SEED_ADMIN_EMAIL??'admin@demo.com';
const adminPassword=process.env.SEED_ADMIN_PASSWORD??'DemoAdmin123!';
const respondentEmail=process.env.SEED_RESPONDENT_EMAIL??'respondente@demo.com';
const respondentPassword=process.env.SEED_RESPONDENT_PASSWORD??'DemoRespondent123!';

async function ensureUser(email:string,password:string,fullName:string,role:'admin'|'respondent'){
  const {data:list,error:listError}=await supabaseAdmin.auth.admin.listUsers({page:1,perPage:1000}); if(listError)throw listError;
  let user=list.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
  if(!user){const{data,error}=await supabaseAdmin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName}});if(error)throw error;user=data.user}
  if(!user)throw new Error(`No se pudo crear ${email}`);
  const{error:profileError}=await supabaseAdmin.from('profiles').upsert({id:user.id,email,full_name:fullName,role},{onConflict:'id'});if(profileError)throw profileError;
  return user;
}

async function seed(){
  const admin=await ensureUser(adminEmail,adminPassword,'Administrador Demo','admin');
  const respondent=await ensureUser(respondentEmail,respondentPassword,'Respondente Demo','respondent');
  const {data:existing}=await supabaseAdmin.from('forms').select('id').eq('title','Solicitud de atención académica').maybeSingle();
  if(existing){console.log('Seed ya existe. No se duplicó.');return;}

  const{data:form,error:formError}=await supabaseAdmin.from('forms').insert({title:'Solicitud de atención académica',description:'Registro y seguimiento de solicitudes académicas y administrativas.',status:'published',created_by:admin.id,published_at:new Date().toISOString(),settings:{institution:'Facultad de Ingeniería Mochis'}}).select().single();if(formError)throw formError;
  const fieldDefs=[
    ['text','Nombre completo','Nombre completo del solicitante',true,[]],
    ['email','Correo institucional','Correo institucional',true,[]],
    ['select_one','Tipo de usuario','Seleccione el tipo de usuario',true,['Estudiante','Docente','Administrativo']],
    ['text','Programa académico o área','Programa o área de adscripción',true,[]],
    ['select_one','Tipo de solicitud','Clasifique la solicitud',true,['Apoyo académico','Registro de información','Seguimiento de trámite','Soporte técnico','Otro']],
    ['textarea','Descripción de solicitud','Describa la solicitud o problema',true,[]],
    ['boolean','Información validada','Indique si la información fue validada',true,[]],
    ['select_one','Prioridad','Nivel de prioridad',true,['Baja','Media','Alta']],
    ['image','Evidencia','Adjunte evidencia si aplica',false,[]],
    ['signature','Firma digital','Firma del solicitante',true,[]],
    ['textarea','Comentarios adicionales','Información adicional',false,[]]
  ];
  const{data:fields,error:fieldsError}=await supabaseAdmin.from('form_fields').insert(fieldDefs.map((d,i)=>({form_id:form.id,type:d[0],label:d[1],description:d[2],required:d[3],position:i,options:d[4],validation:{},conditional_logic:{},settings:{}}))).select();if(fieldsError)throw fieldsError;
  if(!fields)throw new Error('No se crearon campos');

  const users=['Estudiante','Docente','Administrativo'];
  const requests=['Apoyo académico','Registro de información','Seguimiento de trámite','Soporte técnico','Otro'];
  const priorities=['Baja','Media','Alta'];
  for(let i=0;i<20;i++){
    const validation=i%7===0?'rejected':i%4===0?'pending':'validated';
    const score=i%9===0?82:100;
    const submitted=new Date(Date.now()-(19-i)*86400000).toISOString();
    const{data:sub,error}=await supabaseAdmin.from('submissions').insert({form_id:form.id,respondent_id:respondent.id,status:validation==='validated'?'resolved':'in_review',validation_status:validation,validation_score:score,submitted_at:submitted,validated_by:validation==='validated'?admin.id:null,validated_at:validation==='validated'?submitted:null,admin_notes:validation==='rejected'?'Revisar documentación adjunta':null}).select().single();if(error)throw error;
    const vals:any[]=[`Solicitante Demo ${i+1}`,`usuario${i+1}@uas.edu.mx`,users[i%users.length],['Software','Civil','Procesos','Posgrado'][i%4],requests[i%requests.length],`Solicitud de demostración número ${i+1} para pruebas de seguimiento.`,i%5===0?'No':'Sí',priorities[(i*i+1)%3],null,{name:'firma-demo.png',path:null,mime:'image/png',size:0},i%3===0?'Requiere seguimiento adicional':''];
    const rows=fields.map((f,j)=>({submission_id:sub.id,field_id:f.id,value:vals[j]})).filter(r=>r.value!==null);
    const{error:ae}=await supabaseAdmin.from('submission_answers').insert(rows);if(ae)throw ae;
  }

  const{data:numForm,error:nf}=await supabaseAdmin.from('forms').insert({title:'Evaluación cuantitativa de servicios',description:'Formulario de demostración para estadísticas numéricas.',status:'published',created_by:admin.id,published_at:new Date().toISOString()}).select().single();if(nf)throw nf;
  const{data:numFields,error:nfe}=await supabaseAdmin.from('form_fields').insert([
    {form_id:numForm.id,type:'number',label:'Tiempo de atención (minutos)',required:true,position:0,validation:{min:1,max:240}},
    {form_id:numForm.id,type:'rating',label:'Satisfacción del servicio',required:true,position:1,options:[]},
    {form_id:numForm.id,type:'select_one',label:'Área evaluada',required:true,position:2,options:['Control escolar','Coordinación','Soporte','Laboratorio']}
  ]).select();if(nfe)throw nfe;
  const times=[18,25,30,25,40,35,25,50,45,30,28,25,60,42,33,25,38,48,31,25];
  for(let i=0;i<20;i++){const{data:sub,error}=await supabaseAdmin.from('submissions').insert({form_id:numForm.id,respondent_id:respondent.id,status:'resolved',validation_status:'validated',validation_score:100,validated_by:admin.id,validated_at:new Date().toISOString()}).select().single();if(error)throw error;const{error:ae}=await supabaseAdmin.from('submission_answers').insert([{submission_id:sub.id,field_id:numFields![0].id,value:times[i]},{submission_id:sub.id,field_id:numFields![1].id,value:(i%5)+1},{submission_id:sub.id,field_id:numFields![2].id,value:['Control escolar','Coordinación','Soporte','Laboratorio'][i%4]}]);if(ae)throw ae;}
  console.log('Seed completo');console.log(`Admin: ${adminEmail} / ${adminPassword}`);console.log(`Respondente: ${respondentEmail} / ${respondentPassword}`);
}
seed().catch(e=>{console.error(e);process.exit(1)});
