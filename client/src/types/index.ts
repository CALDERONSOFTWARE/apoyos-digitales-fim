export type Role='admin'|'respondent';
export type FieldType='text'|'textarea'|'number'|'decimal'|'email'|'phone'|'date'|'time'|'datetime'|'select_one'|'select_multiple'|'boolean'|'rating'|'range'|'file'|'image'|'signature'|'consent'|'note'|'section'|'matrix';
export interface Profile{id:string;full_name:string|null;email:string;role:Role;avatar_url?:string|null}
export interface FormField{id?:string;form_id?:string;type:FieldType;label:string;description?:string;required:boolean;position:number;options?:any;validation?:Record<string,any>;conditional_logic?:Record<string,any>;settings?:Record<string,any>}
export interface DynamicForm{id:string;title:string;description:string;status:'draft'|'published'|'closed'|'archived';created_by:string;settings?:Record<string,any>;created_at:string;updated_at:string;published_at?:string|null;fields?:FormField[];submissions?:[{count:number}];form_fields?:[{count:number}]}
export interface SubmissionAnswer{id?:string;submission_id?:string;field_id:string;value:any;form_fields?:FormField}
export interface Submission{id:string;folio:string;form_id:string;respondent_id:string;status:string;validation_status:'incomplete'|'pending'|'validated'|'rejected';validation_score:number;admin_notes?:string|null;submitted_at:string;validated_at?:string|null;profiles?:{full_name:string;email:string};forms?:DynamicForm;submission_answers?:SubmissionAnswer[]}
