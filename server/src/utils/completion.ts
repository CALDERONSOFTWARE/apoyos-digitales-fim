export function calculateCompletion(fields: Array<{id:string; required:boolean; type:string}>, answers: Array<{field_id:string; value:unknown}>) {
  const required = fields.filter(f=>f.required && !['note','section'].includes(f.type));
  if (!required.length) return 100;
  const map = new Map(answers.map(a=>[a.field_id,a.value]));
  const filled = required.filter(f=>{
    const v=map.get(f.id);
    if (Array.isArray(v)) return v.length>0;
    return v !== null && v !== undefined && v !== '';
  }).length;
  return Math.round(filled*100/required.length);
}
