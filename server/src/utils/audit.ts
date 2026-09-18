import { supabaseAdmin } from '../config/supabase.js';
export async function audit(userId:string, entityType:string, entityId:string, action:string, oldData:unknown=null, newData:unknown=null){
  await supabaseAdmin.from('audit_logs').insert({user_id:userId,entity_type:entityType,entity_id:entityId,action,old_data:oldData,new_data:newData});
}
