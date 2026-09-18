import { Badge,Progress,Tag } from 'antd';
export const validationLabel=(s:string)=>({validated:'Validado',pending:'Pendiente',incomplete:'Incompleto',rejected:'Rechazado'}[s]??s);
export function ValidationTag({status}:{status:string}){const color=status==='validated'?'success':status==='pending'?'warning':'error';return <Tag color={color}>{validationLabel(status)}</Tag>}
export function TrafficLight({status,score}:{status:string;score:number}){const badge=status==='validated'?'success':status==='pending'?'warning':'error';return <div style={{minWidth:140}}><Badge status={badge} text={validationLabel(status)}/><Progress percent={score} size="small" status={status==='rejected'?'exception':'normal'}/></div>}
