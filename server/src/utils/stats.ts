export const cleanNumbers = (values: unknown[]) => values
  .map(Number)
  .filter((v) => Number.isFinite(v));

export const mean = (values: number[]) => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
export const median = (values: number[]) => {
  if (!values.length) return null;
  const a=[...values].sort((x,y)=>x-y), m=Math.floor(a.length/2);
  return a.length%2 ? a[m] : (a[m-1]+a[m])/2;
};
export const mode = (values: Array<string|number>) => {
  if (!values.length) return null;
  const map = new Map<string|number, number>();
  values.forEach(v=>map.set(v,(map.get(v)||0)+1));
  return [...map.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null;
};
export const min = (values:number[]) => values.length ? Math.min(...values) : null;
export const max = (values:number[]) => values.length ? Math.max(...values) : null;
export const range = (values:number[]) => values.length ? Math.max(...values)-Math.min(...values) : null;
export const standardDeviation = (values:number[]) => {
  if (!values.length) return null;
  const avg=mean(values)!;
  return Math.sqrt(values.reduce((s,v)=>s+(v-avg)**2,0)/values.length);
};
export const frequencies = (values: unknown[]) => {
  const map = new Map<string,number>();
  values.flatMap(v=>Array.isArray(v)?v:[v])
    .filter(v=>v!==null && v!==undefined && v!=='' )
    .forEach(v=>{ const k=String(v); map.set(k,(map.get(k)||0)+1); });
  const total=[...map.values()].reduce((a,b)=>a+b,0);
  return [...map.entries()].map(([value,count])=>({value,count,percentage: total ? Number((count*100/total).toFixed(2)) : 0})).sort((a,b)=>b.count-a.count);
};
