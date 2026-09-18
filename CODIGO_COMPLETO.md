# Código completo — Apoyos Digitales FIM
Cada sección corresponde a un archivo completo. Al ser un proyecto nuevo, no existe código anterior que sustituir: crea cada ruta y pega el contenido completo.

## `.gitignore`
```text
node_modules
dist
.env
.env.local
*.log
.DS_Store

```

## `README.md`
```md
# Apoyos Digitales para la Facultad de Ingeniería Mochis

Aplicación full stack para construir formularios dinámicos, publicarlos, recibir respuestas, adjuntar archivos, firmar, validar mediante semáforo, analizar resultados y generar comprobantes PDF. La interfaz prioriza densidad de información, navegación lateral, pestañas y tablas administrativas inspiradas conceptualmente en KoboToolbox sin copiar su identidad.

## 1. Arquitectura

```text
apoyos-digitales/
├─ client/                         React 19 + Vite + TypeScript + Ant Design 5
│  └─ src/
│     ├─ components/
│     │  ├─ common/Guards.tsx
│     │  ├─ forms/FormRenderer.tsx
│     │  ├─ forms/SignatureField.tsx
│     │  ├─ forms/UploadField.tsx
│     │  ├─ forms/BuilderFieldCard.tsx
│     │  └─ layout/
│     ├─ context/AuthContext.tsx
│     ├─ pages/admin/
│     ├─ pages/auth/
│     ├─ pages/respondent/
│     ├─ services/api.ts
│     ├─ services/supabase.ts
│     ├─ types/
│     └─ utils/
├─ server/                         Express 5 + TypeScript
│  └─ src/
│     ├─ config/
│     ├─ middleware/
│     ├─ routes/
│     ├─ types/
│     └─ utils/
├─ supabase/schema.sql             Tablas + FK + índices + triggers + RLS + Storage
├─ render.yaml                     Blueprint de Render
└─ README.md
```

## 2. Preparar Supabase

1. Crea un proyecto nuevo en Supabase.
2. En **SQL Editor** pega y ejecuta completo `supabase/schema.sql`.
3. El SQL crea las tablas `profiles`, `forms`, `form_fields`, `submissions`, `submission_answers`, `audit_logs`, índices, enums, triggers, folios, RLS y el bucket privado `form-uploads`.
4. Ve a **Project Settings > API** y copia Project URL, anon key y service_role key.
5. En **Authentication > URL Configuration** agrega como Site URL `http://localhost:5173` durante desarrollo y después la URL de Render.
6. No pongas jamás `SUPABASE_SERVICE_ROLE_KEY` en `client/.env`.

## 3. Variables de entorno

Copia:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

`client/.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_API_URL=http://localhost:4000/api
```

`server/.env`:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
SEED_ADMIN_EMAIL=admin@demo.com
SEED_ADMIN_PASSWORD=DemoAdmin123!
SEED_RESPONDENT_EMAIL=respondente@demo.com
SEED_RESPONDENT_PASSWORD=DemoRespondent123!
```

## 4. Instalar y ejecutar

Desde raíz:

```bash
npm run install:all
npm run dev:server
```

En otra terminal:

```bash
npm run dev:client
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000/api/health`

## 5. Seed de demostración

Con `server/.env` configurado:

```bash
npm --prefix server run seed
```

Crea usuarios Auth si no existen, asigna el perfil administrador/respondente, crea **Solicitud de atención académica** con sus 11 campos y 20 respuestas, y crea **Evaluación cuantitativa de servicios** con 20 respuestas numéricas.

Credenciales por defecto:

```text
ADMIN
admin@demo.com
DemoAdmin123!

RESPONDENT
respondente@demo.com
DemoRespondent123!
```

Cámbialas mediante variables de entorno si la demo será pública.

## 6. Flujo para la exposición

1. Login admin.
2. Dashboard muestra totales y gráficas.
3. Formularios > Nuevo formulario.
4. Constructor: agrega campos desde la izquierda, arrastra para reordenar, selecciona un campo y configura a la derecha.
5. Guardar y Publicar.
6. Abrir sesión respondent.
7. Abrir formulario publicado, llenar, subir imagen, firmar y enviar.
8. Login admin > formulario > DATOS.
9. Abrir respuesta, revisar semáforo y porcentaje.
10. Validar / pendiente / rechazar y agregar observaciones.
11. Ir a ANÁLISIS para ver gráficas y estadísticas por pregunta.
12. Volver al detalle y **Generar recibo PDF**.

## 7. Rutas principales

```text
/login
/admin/dashboard
/admin/forms
/admin/forms/:id
/admin/forms/:id/builder
/admin/forms/:id/settings
/admin/forms/:formId/submissions
/admin/forms/:formId/analytics
/admin/submissions/:id
/admin/audit
/forms
/forms/:id
/my-submissions
```

## 8. API

Todas las rutas protegidas reciben `Authorization: Bearer <Supabase access_token>`.

```text
GET    /api/health
GET    /api/dashboard
GET    /api/forms
GET    /api/forms/:id
POST   /api/forms
PUT    /api/forms/:id
DELETE /api/forms/:id
POST   /api/forms/:id/duplicate
PUT    /api/forms/:id/fields
POST   /api/submissions
GET    /api/submissions/mine
GET    /api/submissions/form/:formId
GET    /api/submissions/:id
PUT    /api/submissions/:id
PUT    /api/submissions/:id/answers
DELETE /api/submissions/:id
GET    /api/analytics/:formId
GET    /api/audit
```

## 9. Storage

Bucket privado: `form-uploads`.

Formato de ruta:

```text
<userId>/<formId>/<uuid>-<filename>
```

Tipos permitidos: JPG, JPEG, PNG, PDF, DOCX y XLSX. Máximo 10 MB por archivo. Las imágenes/archivos se consultan mediante Signed URL temporal.

## 10. Deploy en Render

### Opción recomendada: Blueprint

1. Sube este proyecto a GitHub.
2. En Render: **New > Blueprint**.
3. Selecciona el repositorio. Render detectará `render.yaml`.
4. Completa las variables solicitadas.
5. Primero puede desplegar el backend y obtener una URL como `https://apoyos-digitales-api.onrender.com`.
6. En el servicio frontend define:

```env
VITE_API_URL=https://apoyos-digitales-api.onrender.com/api
```

7. En backend define:

```env
CLIENT_URL=https://TU-FRONTEND.onrender.com
```

8. En Supabase Authentication agrega la URL del frontend a URLs permitidas.
9. Redeploy del frontend después de cambiar una variable `VITE_*`, porque Vite las incorpora durante build.

### Manual

Backend Web Service:
- Root Directory: `server`
- Build: `npm install && npm run build`
- Start: `npm start`
- Health Check: `/api/health`

Frontend Static Site:
- Root Directory: `client`
- Build: `npm install && npm run build`
- Publish: `dist`
- Rewrite: `/* -> /index.html`

## 11. Sobre “antes vs después”

Este repositorio se crea desde cero, por lo que no existe un fragmento anterior correcto que sustituir. Cada archivo incluido aquí es **el archivo nuevo completo**. Si después quieres integrarlo dentro de otro repositorio existente, la regla segura es reemplazar archivo por archivo con las versiones completas de este proyecto, no insertar fragmentos aislados.

```

## `client/.env.example`
```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
VITE_API_URL=http://localhost:4000/api

```

## `client/index.html`
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Apoyos Digitales - FIM</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>

```

## `client/package.json`
```json
{
  "name": "apoyos-digitales-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^6.0.0",
    "@ant-design/plots": "^2.6.5",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@supabase/supabase-js": "^2.57.4",
    "antd": "^5.27.1",
    "dayjs": "^1.11.18",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.2",
    "qrcode": "^1.5.4",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.8.2",
    "react-signature-canvas": "^1.1.0-alpha.2"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "@types/react": "^19.1.12",
    "@types/react-dom": "^19.1.9",
    "@types/react-signature-canvas": "^1.0.7",
    "@vitejs/plugin-react": "^5.0.2",
    "typescript": "^5.9.2",
    "vite": "^7.1.5"
  }
}

```

## `client/src/App.tsx`
```tsx
import { Navigate,Route,Routes } from 'react-router-dom';import LoginPage from './pages/auth/LoginPage';import { ProtectedRoute,RoleGuard } from './components/common/Guards';import AdminLayout from './components/layout/AdminLayout';import RespondentLayout from './components/layout/RespondentLayout';import DashboardPage from './pages/admin/DashboardPage';import FormsPage from './pages/admin/FormsPage';import FormBuilderPage from './pages/admin/FormBuilderPage';import FormSummaryPage from './pages/admin/FormSummaryPage';import SubmissionsPage from './pages/admin/SubmissionsPage';import SubmissionDetailPage from './pages/admin/SubmissionDetailPage';import AnalyticsPage from './pages/admin/AnalyticsPage';import AuditPage from './pages/admin/AuditPage';import FormsListPage from './pages/respondent/FormsListPage';import FormFillPage from './pages/respondent/FormFillPage';import MySubmissionsPage from './pages/respondent/MySubmissionsPage';import FormSettingsPage from './pages/admin/FormSettingsPage';
export default function App(){return <Routes><Route path="/login" element={<LoginPage/>}/><Route element={<ProtectedRoute/>}><Route path="/forms/:id" element={<FormFillPage/>}/><Route element={<RoleGuard role="admin"/>}><Route element={<AdminLayout/>}><Route path="/admin/dashboard" element={<DashboardPage/>}/><Route path="/admin/forms" element={<FormsPage/>}/><Route path="/admin/forms/:id" element={<FormSummaryPage/>}/><Route path="/admin/forms/:id/builder" element={<FormBuilderPage/>}/><Route path="/admin/forms/:id/settings" element={<FormSettingsPage/>}/><Route path="/admin/forms/:formId/submissions" element={<SubmissionsPage/>}/><Route path="/admin/forms/:formId/analytics" element={<AnalyticsPage/>}/><Route path="/admin/submissions/:id" element={<SubmissionDetailPage/>}/><Route path="/admin/audit" element={<AuditPage/>}/></Route></Route><Route element={<RoleGuard role="respondent"/>}><Route element={<RespondentLayout/>}><Route path="/forms" element={<FormsListPage/>}/><Route path="/my-submissions" element={<MySubmissionsPage/>}/></Route></Route></Route><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>}

```

## `client/src/components/common/Guards.tsx`
```tsx
import { Navigate,Outlet } from 'react-router-dom';import { Spin } from 'antd';import { useAuth } from '../../context/AuthContext';import type{Role}from'../../types';
export function ProtectedRoute(){const{session,loading}=useAuth();if(loading)return <div className="center"><Spin size="large"/></div>;return session?<Outlet/>:<Navigate to="/login" replace/>}
export function RoleGuard({role}:{role:Role}){const{profile,loading}=useAuth();if(loading)return <div className="center"><Spin/> </div>;return profile?.role===role?<Outlet/>:<Navigate to={profile?.role==='admin'?'/admin/dashboard':'/forms'} replace/>}

```

## `client/src/components/forms/BuilderFieldCard.tsx`
```tsx
import { useSortable } from '@dnd-kit/sortable';import { CSS } from '@dnd-kit/utilities';import { Card,Button,Space,Tag } from 'antd';import { HolderOutlined,CopyOutlined,DeleteOutlined } from '@ant-design/icons';import type{FormField}from'../../types';
export default function BuilderFieldCard({field,selected,onSelect,onDuplicate,onDelete}:{field:FormField;selected:boolean;onSelect:()=>void;onDuplicate:()=>void;onDelete:()=>void}){const{id}=field;const{sAttributes,listeners,setNodeRef,transform,transition}=useSortable({id:id!});return <div ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition,marginBottom:10}}><Card size="small" className={selected?'builder-field selected':'builder-field'} onClick={onSelect} title={<Space><span {...sAttributes} {...listeners}><HolderOutlined/></span><span>{field.label||'Sin título'}</span><Tag>{field.type}</Tag></Space>} extra={<Space><Button size="small" type="text" icon={<CopyOutlined/>} onClick={e=>{e.stopPropagation();onDuplicate()}}/><Button danger size="small" type="text" icon={<DeleteOutlined/>} onClick={e=>{e.stopPropagation();onDelete()}}/></Space>}><div className="field-placeholder">{field.description||'Sin descripción'}{field.required&&<Tag color="blue" style={{marginLeft:8}}>Obligatoria</Tag>}</div></Card></div>}

```

## `client/src/components/forms/FormRenderer.tsx`
```tsx
import { Form,Input,InputNumber,Select,Radio,Checkbox,Rate,Slider,DatePicker,TimePicker,Typography,Divider } from 'antd';import dayjs from 'dayjs';import type{DynamicForm,FormField}from'../../types';import SignatureField from './SignatureField';import UploadField from './UploadField';
function shouldShow(field:FormField,values:Record<string,any>){const c=field.conditional_logic as any;if(!c?.showWhen?.fieldId)return true;const v=values[c.showWhen.fieldId];return c.showWhen.operator==='not_equals'?v!==c.showWhen.value:v===c.showWhen.value}
export default function FormRenderer({form,fields,values,onChange,disabled=false}:{form:DynamicForm;fields:FormField[];values:Record<string,any>;onChange:(id:string,v:any)=>void;disabled?:boolean}){return <div>{fields.filter(f=>shouldShow(f,values)).map(field=>{const id=field.id!;if(field.type==='section')return <Divider orientation="left" key={id}>{field.label}</Divider>;if(field.type==='note')return <Typography.Paragraph type="secondary" key={id}>{field.label}<br/>{field.description}</Typography.Paragraph>;const rules=field.validation||{};const common={label:field.label,required:field.required,help:field.description||undefined,key:id};let control:any=null;switch(field.type){case'text':control=<Input disabled={disabled} value={values[id]} maxLength={rules.maxLength} onChange={e=>onChange(id,e.target.value)}/>;break;case'textarea':control=<Input.TextArea disabled={disabled} rows={4} value={values[id]} maxLength={rules.maxLength} onChange={e=>onChange(id,e.target.value)}/>;break;case'number':case'decimal':control=<InputNumber disabled={disabled} style={{width:'100%'}} value={values[id]} min={rules.min} max={rules.max} step={field.type==='decimal'?0.01:1} onChange={v=>onChange(id,v)}/>;break;case'email':control=<Input type="email" disabled={disabled} value={values[id]} onChange={e=>onChange(id,e.target.value)}/>;break;case'phone':control=<Input type="tel" disabled={disabled} value={values[id]} onChange={e=>onChange(id,e.target.value)}/>;break;case'date':control=<DatePicker disabled={disabled} style={{width:'100%'}} value={values[id]?dayjs(values[id]):null} onChange={v=>onChange(id,v?.format('YYYY-MM-DD')??null)}/>;break;case'time':control=<TimePicker disabled={disabled} style={{width:'100%'}} value={values[id]?dayjs(values[id],'HH:mm'):null} onChange={v=>onChange(id,v?.format('HH:mm')??null)}/>;break;case'datetime':control=<DatePicker showTime disabled={disabled} style={{width:'100%'}} value={values[id]?dayjs(values[id]):null} onChange={v=>onChange(id,v?.toISOString()??null)}/>;break;case'select_one':control=<Select disabled={disabled} value={values[id]} options={(field.options||[]).map((o:any)=>({label:typeof o==='string'?o:o.label,value:typeof o==='string'?o:o.value}))} onChange={v=>onChange(id,v)}/>;break;case'select_multiple':control=<Select mode="multiple" disabled={disabled} value={values[id]||[]} options={(field.options||[]).map((o:any)=>({label:typeof o==='string'?o:o.label,value:typeof o==='string'?o:o.value}))} onChange={v=>onChange(id,v)}/>;break;case'boolean':control=<Radio.Group disabled={disabled} value={values[id]} onChange={e=>onChange(id,e.target.value)}><Radio value="Sí">Sí</Radio><Radio value="No">No</Radio></Radio.Group>;break;case'rating':control=<Rate disabled={disabled} value={values[id]||0} onChange={v=>onChange(id,v)}/>;break;case'range':control=<Slider disabled={disabled} min={rules.min??0} max={rules.max??100} value={values[id]??rules.min??0} onChange={v=>onChange(id,v)}/>;break;case'consent':control=<Checkbox disabled={disabled} checked={!!values[id]} onChange={e=>onChange(id,e.target.checked)}>{field.settings?.consentText??'Acepto'}</Checkbox>;break;case'file':control=<UploadField formId={form.id} value={values[id]} onChange={v=>onChange(id,v)}/>;break;case'image':control=<UploadField formId={form.id} imageOnly value={values[id]} onChange={v=>onChange(id,v)}/>;break;case'signature':control=<SignatureField value={values[id]} onChange={v=>onChange(id,v)}/>;break;case'matrix':control=<div className="matrix"><Typography.Text type="secondary">Matriz</Typography.Text>{(field.options?.rows||[]).map((r:string)=><div key={r}><span>{r}</span><Radio.Group disabled={disabled} value={values[id]?.[r]} onChange={e=>onChange(id,{...(values[id]||{}),[r]:e.target.value})}>{(field.options?.columns||[]).map((c:string)=><Radio key={c} value={c}>{c}</Radio>)}</Radio.Group></div>)}</div>;break;default:control=<Input/>}return <Form.Item {...common}>{control}</Form.Item>})}</div>}

```

## `client/src/components/forms/FormTabs.tsx`
```tsx
import { Tabs } from 'antd';import { useLocation,useNavigate } from 'react-router-dom';
export default function FormTabs({formId}:{formId:string}){const nav=useNavigate(),loc=useLocation();const key=loc.pathname.includes('/builder')?'form':loc.pathname.includes('/submissions')?'data':loc.pathname.includes('/analytics')?'analytics':loc.pathname.includes('/settings')?'settings':'summary';return <Tabs activeKey={key} onChange={k=>nav(k==='summary'?`/admin/forms/${formId}`:k==='form'?`/admin/forms/${formId}/builder`:k==='data'?`/admin/forms/${formId}/submissions`:k==='analytics'?`/admin/forms/${formId}/analytics`:`/admin/forms/${formId}/settings`)} items={[{key:'summary',label:'RESUMEN'},{key:'form',label:'FORMULARIO'},{key:'data',label:'DATOS'},{key:'analytics',label:'ANÁLISIS'},{key:'settings',label:'CONFIGURACIÓN'}]}/>}

```

## `client/src/components/forms/SignatureField.tsx`
```tsx
import { useRef } from 'react';import SignatureCanvas from 'react-signature-canvas';import { Button,Space } from 'antd';
export default function SignatureField({value,onChange}:{value?:string;onChange?:(v:string)=>void}){const ref=useRef<SignatureCanvas>(null);return <div><div className="signature-box">{value?<img src={value} alt="Firma" className="signature-preview"/>:<SignatureCanvas ref={ref} penColor="black" canvasProps={{width:650,height:180,className:'signature-canvas'}}/>}</div><Space style={{marginTop:8}}><Button onClick={()=>{ref.current?.clear();onChange?.('')}}>Limpiar</Button><Button type="primary" onClick={()=>{const sig=ref.current;if(sig&&!sig.isEmpty())onChange?.(sig.getTrimmedCanvas().toDataURL('image/png'))}}>Guardar firma</Button></Space></div>}

```

## `client/src/components/forms/UploadField.tsx`
```tsx
import { Upload,Button,Image,message } from 'antd';import { UploadOutlined } from '@ant-design/icons';import { supabase } from '../../services/supabase';
export default function UploadField({formId,imageOnly=false,value,onChange}:{formId:string;imageOnly?:boolean;value?:any;onChange?:(v:any)=>void}){return <div><Upload beforeUpload={async(file)=>{const allowed=['image/jpeg','image/png','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];if(!allowed.includes(file.type)){message.error('Tipo de archivo no permitido');return Upload.LIST_IGNORE}if(file.size>10*1024*1024){message.error('Máximo 10 MB');return Upload.LIST_IGNORE}const{data:{user}}=await supabase.auth.getUser();if(!user)return Upload.LIST_IGNORE;const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${user.id}/${formId}/${crypto.randomUUID()}-${safe}`;const{error}=await supabase.storage.from('form-uploads').upload(path,file);if(error){message.error(error.message);return Upload.LIST_IGNORE}const{data:signed}=await supabase.storage.from('form-uploads').createSignedUrl(path,3600);onChange?.({name:file.name,path,mime:file.type,size:file.size,preview:signed?.signedUrl});message.success('Archivo cargado');return false}} showUploadList={false} accept={imageOnly?'image/jpeg,image/png':'.jpg,.jpeg,.png,.pdf,.docx,.xlsx'}><Button icon={<UploadOutlined/>}>Subir {imageOnly?'imagen':'archivo'}</Button></Upload>{value?.preview&&String(value.mime).startsWith('image/')&&<div style={{marginTop:10}}><Image width={180} src={value.preview}/></div>}{value?.name&&<div style={{marginTop:6}}>{value.name}</div>}</div>}

```

## `client/src/components/layout/AdminLayout.tsx`
```tsx
import { DashboardOutlined,FileTextOutlined,AuditOutlined,LogoutOutlined } from '@ant-design/icons';
import { Layout,Menu,Button,Typography } from 'antd';import { Outlet,useLocation,useNavigate } from 'react-router-dom';import { useAuth } from '../../context/AuthContext';
const{Sider,Header,Content}=Layout;
export default function AdminLayout(){const nav=useNavigate(),loc=useLocation(),{profile,signOut}=useAuth();return <Layout className="app-layout"><Sider width={230} theme="light" className="sider"><div className="brand"><b>Apoyos Digitales</b><span>Ingeniería Mochis</span></div><Menu mode="inline" selectedKeys={[loc.pathname]} onClick={({key})=>nav(key)} items={[{key:'/admin/dashboard',icon:<DashboardOutlined/>,label:'Dashboard'},{key:'/admin/forms',icon:<FileTextOutlined/>,label:'Formularios'},{key:'/admin/audit',icon:<AuditOutlined/>,label:'Auditoría'}]}/></Sider><Layout><Header className="topbar"><Typography.Text>{profile?.full_name||profile?.email}</Typography.Text><Button type="text" icon={<LogoutOutlined/>} onClick={async()=>{await signOut();nav('/login')}}>Salir</Button></Header><Content className="content"><Outlet/></Content></Layout></Layout>}

```

## `client/src/components/layout/RespondentLayout.tsx`
```tsx
import { Layout,Button,Typography,Space } from 'antd';import { LogoutOutlined } from '@ant-design/icons';import { Link,Outlet,useNavigate } from 'react-router-dom';import { useAuth } from '../../context/AuthContext';
export default function RespondentLayout(){const{signOut,profile}=useAuth(),nav=useNavigate();return <Layout className="respondent-layout"><Layout.Header className="respondent-header"><div><Link to="/forms" className="resp-brand">Apoyos Digitales</Link><span className="resp-sub">Facultad de Ingeniería Mochis</span></div><Space><Typography.Text>{profile?.full_name||profile?.email}</Typography.Text><Link to="/my-submissions">Mis envíos</Link><Button type="text" icon={<LogoutOutlined/>} onClick={async()=>{await signOut();nav('/login')}}>Salir</Button></Space></Layout.Header><Layout.Content className="respondent-content"><Outlet/></Layout.Content></Layout>}

```

## `client/src/context/AuthContext.tsx`
```tsx
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { Profile } from '../types';

type AuthValue={session:Session|null;profile:Profile|null;loading:boolean;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthValue>({session:null,profile:null,loading:true,signOut:async()=>{}});
export function AuthProvider({children}:{children:ReactNode}){
 const[session,setSession]=useState<Session|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[loading,setLoading]=useState(true);
 async function load(s:Session|null){setSession(s);if(!s){setProfile(null);setLoading(false);return;}const{data}=await supabase.from('profiles').select('*').eq('id',s.user.id).single();setProfile(data as Profile);setLoading(false)}
 useEffect(()=>{supabase.auth.getSession().then(({data})=>load(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>load(s));return()=>subscription.unsubscribe()},[]);
 return <AuthContext.Provider value={{session,profile,loading,signOut:async()=>{await supabase.auth.signOut()}}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);

```

## `client/src/main.tsx`
```tsx
import { StrictMode } from 'react';import { createRoot } from 'react-dom/client';import { BrowserRouter } from 'react-router-dom';import { ConfigProvider } from 'antd';import 'antd/dist/reset.css';import './styles.css';import App from './App';import { AuthProvider } from './context/AuthContext';
createRoot(document.getElementById('root')!).render(<StrictMode><ConfigProvider theme={{token:{colorPrimary:'#185fa7',borderRadius:5,fontSize:14,colorBgLayout:'#f4f6f8'},components:{Table:{cellPaddingBlockSM:7,cellPaddingInlineSM:10},Card:{headerHeightSM:40}}}}><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></ConfigProvider></StrictMode>);

```

## `client/src/pages/admin/AnalyticsPage.tsx`
```tsx
import { Bar,Column,Pie } from '@ant-design/plots';import { Card,Col,Row,Statistic,Table,Typography } from 'antd';import { useEffect,useState } from 'react';import { useParams } from 'react-router-dom';import { api } from '../../services/api';import type{DynamicForm}from'../../types';import FormTabs from '../../components/forms/FormTabs';
export default function AnalyticsPage(){const{formId}=useParams(),[data,setData]=useState<any>(),[form,setForm]=useState<DynamicForm>();useEffect(()=>{if(formId){api.get(`/analytics/${formId}`).then(setData);api.get<DynamicForm>(`/forms/${formId}`).then(setForm)}},[formId]);if(!data||!form)return null;const s=data.summary;return <><Typography.Title level={3} style={{marginBottom:0}}>{form.title}</Typography.Title><FormTabs formId={form.id}/><Row gutter={[12,12]}>{[['Respuestas',s.total],['Validadas',s.validated],['Pendientes',s.pending],['Incompletas',s.incomplete],['Rechazadas',s.rejected],['Promedio completado',`${s.averageCompletion}%`]].map(([t,v])=><Col xs={12} md={8} xl={4} key={String(t)}><Card size="small"><Statistic title={t} value={v as any}/></Card></Col>)}</Row><div style={{marginTop:16}}>{data.questions.map((q:any)=><QuestionAnalytics key={q.field.id} q={q}/>)}</div></>}
function QuestionAnalytics({q}:{q:any}){const f=q.field;const frequency=q.frequency??[];const numeric=q.numeric;return <Card className="analytics-card" title={f.label} extra={`${q.total} respuestas`}><Row gutter={16}><Col xs={24} xl={numeric?12:14}>{frequency.length>0&&(['select_one','boolean'].includes(f.type)?<Pie height={260} data={frequency} angleField="count" colorField="value" innerRadius={0.55} label={{text:'value'}}/>:f.type==='select_multiple'?<Bar height={280} data={frequency} xField="count" yField="value"/>:<Column height={260} data={frequency} xField="value" yField="count"/>)}{!frequency.length&&q.text&&<div><Statistic title="Respuestas únicas" value={q.text.unique}/><Typography.Text type="secondary">Palabras frecuentes: {q.text.frequentWords.map((x:any)=>`${x.value} (${x.count})`).join(', ')||'—'}</Typography.Text></div>}</Col><Col xs={24} xl={numeric?12:10}>{numeric?<Row gutter={[8,8]}>{[['Cantidad',numeric.count],['Promedio',fmt(numeric.average)],['Mediana',fmt(numeric.median)],['Moda',fmt(numeric.mode)],['Mínimo',fmt(numeric.minimum)],['Máximo',fmt(numeric.maximum)],['Rango',fmt(numeric.range)],['Desv. estándar',fmt(numeric.standardDeviation)]].map(([t,v])=><Col span={12} key={String(t)}><Card size="small"><Statistic title={t} value={v as any}/></Card></Col>)}</Row>:frequency.length?<Table size="small" pagination={false} rowKey="value" dataSource={frequency} columns={[{title:'Respuesta',dataIndex:'value'},{title:'Conteo',dataIndex:'count'},{title:'Porcentaje',dataIndex:'percentage',render:v=>`${v}%`} ]}/>:<Statistic title="Sin responder" value={q.unanswered}/>}</Col></Row></Card>}
const fmt=(v:any)=>typeof v==='number'?Number(v.toFixed(2)):v??'—';

```

## `client/src/pages/admin/AuditPage.tsx`
```tsx
import { Card,Table,Typography } from 'antd';import { useEffect,useState } from 'react';import { api } from '../../services/api';import dayjs from 'dayjs';
export default function AuditPage(){const[data,setData]=useState<any[]>([]);useEffect(()=>{api.get<any[]>('/audit').then(setData)},[]);return <><Typography.Title level={3}>Auditoría</Typography.Title><Card><Table rowKey="id" size="small" dataSource={data} columns={[{title:'Fecha',dataIndex:'created_at',render:v=>dayjs(v).format('DD/MM/YYYY HH:mm:ss')},{title:'Usuario',render:(_,r)=>r.profiles?.full_name||r.profiles?.email||'Sistema'},{title:'Entidad',dataIndex:'entity_type'},{title:'Acción',dataIndex:'action'},{title:'ID',dataIndex:'entity_id'}]}/></Card></>}

```

## `client/src/pages/admin/DashboardPage.tsx`
```tsx
import { Card,Col,Row,Statistic,Table,Typography } from 'antd';import { Column,Bar } from '@ant-design/plots';import { useEffect,useState } from 'react';import { api } from '../../services/api';import dayjs from 'dayjs';import { ValidationTag } from '../../utils/status';
export default function DashboardPage(){const[data,setData]=useState<any>();useEffect(()=>{api.get('/dashboard').then(setData)},[]);const c=data?.counts??{};return <><Typography.Title level={3}>Dashboard</Typography.Title><Row gutter={[12,12]}>{[['Total formularios',c.forms],['Formularios activos',c.active],['Total respuestas',c.submissions],['Pendientes',c.pending],['Validadas',c.validated],['Con observaciones',c.observations]].map(([t,v])=><Col xs={12} md={8} xl={4} key={String(t)}><Card size="small"><Statistic title={t} value={v??0}/></Card></Col>)}</Row><Row gutter={16} style={{marginTop:16}}><Col xs={24} xl={14}><Card title="Respuestas por día">{data?.byDay?.length?<Column data={data.byDay} xField="date" yField="count" height={260}/>:<span>Sin datos</span>}</Card></Col><Col xs={24} xl={10}><Card title="Formularios más utilizados">{data?.byForm?.length?<Bar data={data.byForm} xField="count" yField="form" height={260}/>:<span>Sin datos</span>}</Card></Col></Row><Card title="Respuestas recientes" style={{marginTop:16}}><Table rowKey="id" size="small" dataSource={data?.recent??[]} pagination={false} columns={[{title:'Fecha',dataIndex:'submitted_at',render:v=>dayjs(v).format('DD/MM/YYYY HH:mm')},{title:'Formulario',render:(_,r:any)=>r.forms?.title},{title:'Respondente',render:(_,r:any)=>r.profiles?.full_name||'—'},{title:'Estado',dataIndex:'status'},{title:'Validación',dataIndex:'validation_status',render:v=><ValidationTag status={v}/>} ]}/></Card></>}

```

## `client/src/pages/admin/FormBuilderPage.tsx`
```tsx
import { DndContext,closestCenter,type DragEndEvent } from '@dnd-kit/core';import { SortableContext,verticalListSortingStrategy,arrayMove } from '@dnd-kit/sortable';
import { Button,Card,Checkbox,Col,Divider,Input,InputNumber,Row,Select,Space,Switch,Typography,message,Result } from 'antd';import { SaveOutlined,EyeOutlined,SendOutlined } from '@ant-design/icons';import { useEffect,useMemo,useState } from 'react';import { useNavigate,useParams } from 'react-router-dom';import { api } from '../../services/api';import type{DynamicForm,FieldType,FormField}from'../../types';import BuilderFieldCard from '../../components/forms/BuilderFieldCard';import FormTabs from '../../components/forms/FormTabs';
const types:{type:FieldType;label:string}[]=[['text','Texto corto'],['textarea','Texto largo'],['number','Número'],['decimal','Decimal'],['email','Correo'],['phone','Teléfono'],['date','Fecha'],['time','Hora'],['datetime','Fecha y hora'],['select_one','Seleccionar una'],['select_multiple','Seleccionar varias'],['boolean','Sí / No'],['rating','Calificación'],['range','Rango'],['file','Archivo'],['image','Imagen'],['signature','Firma digital'],['consent','Consentimiento'],['note','Nota informativa'],['section','Sección'],['matrix','Matriz']].map(([type,label])=>({type:type as FieldType,label}));
const newField=(type:FieldType,label:string):FormField=>({id:`tmp-${crypto.randomUUID()}`,type,label,description:'',required:false,position:0,options:['select_one','select_multiple'].includes(type)?['Opción 1','Opción 2']:type==='matrix'?{rows:['Fila 1','Fila 2'],columns:['Sí','No']}:[],validation:{},conditional_logic:{},settings:{}});
export default function FormBuilderPage(){const{id}=useParams(),nav=useNavigate(),[form,setForm]=useState<DynamicForm>(),[fields,setFields]=useState<FormField[]>([]),[selected,setSelected]=useState<string>();const selectedField=useMemo(()=>fields.find(f=>f.id===selected),[fields,selected]);useEffect(()=>{if(id)api.get<DynamicForm>(`/forms/${id}`).then(f=>{setForm(f);setFields((f.fields??[]).map(x=>({...x,id:x.id!})))})},[id]);if(!id||!form)return null;
function add(type:FieldType,label:string){const f=newField(type,label);setFields(p=>[...p,{...f,position:p.length}]);setSelected(f.id)}
function update(patch:Partial<FormField>){setFields(fs=>fs.map(f=>f.id===selected?{...f,...patch}:f))}
function drag(e:DragEndEvent){if(!e.over||e.active.id===e.over.id)return;setFields(fs=>{const a=fs.findIndex(f=>f.id===e.active.id),b=fs.findIndex(f=>f.id===e.over!.id);return arrayMove(fs,a,b).map((f,i)=>({...f,position:i}))})}
async function save(){await api.put(`/forms/${id}`,{title:form.title,description:form.description,status:form.status,settings:form.settings});const saved=await api.put<FormField[]>(`/forms/${id}/fields`,{fields:fields.map(({form_id,...f})=>f)});setFields(saved);setSelected(saved[0]?.id);message.success('Formulario guardado')}
async function publish(){await save();const updated=await api.put<DynamicForm>(`/forms/${id}`,{title:form.title,description:form.description,status:form.status==='published'?'draft':'published',settings:form.settings});setForm(updated);message.success(updated.status==='published'?'Formulario publicado':'Formulario pasado a borrador')}
return <><Space style={{width:'100%',justifyContent:'space-between'}}><div><Typography.Title level={3} style={{marginBottom:0}}>{form.title}</Typography.Title><Typography.Text type="secondary">Constructor dinámico</Typography.Text></div><Space><Button icon={<EyeOutlined/>} onClick={()=>nav(`/forms/${id}?preview=1`)}>Vista previa</Button><Button icon={<SaveOutlined/>} onClick={save}>Guardar</Button><Button type="primary" icon={<SendOutlined/>} onClick={publish}>{form.status==='published'?'Despublicar':'Publicar'}</Button></Space></Space><FormTabs formId={id}/><div className="builder-grid"><Card size="small" className="builder-panel" title="Componentes disponibles"><div className="palette">{types.map(t=><Button key={t.type} block onClick={()=>add(t.type,t.label)}>{t.label}</Button>)}</div></Card><Card size="small" className="builder-canvas" title="Formulario"><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{fontWeight:600,marginBottom:8}}/><Input.TextArea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{marginBottom:14}}/><DndContext collisionDetection={closestCenter} onDragEnd={drag}><SortableContext items={fields.map(f=>f.id!)} strategy={verticalListSortingStrategy}>{fields.map(f=><BuilderFieldCard key={f.id} field={f} selected={selected===f.id} onSelect={()=>setSelected(f.id)} onDuplicate={()=>{const copy={...f,id:`tmp-${crypto.randomUUID()}`,label:`${f.label} (copia)`};setFields(x=>[...x,copy].map((z,i)=>({...z,position:i})))} } onDelete={()=>setFields(x=>x.filter(z=>z.id!==f.id).map((z,i)=>({...z,position:i})))}/>)}</SortableContext></DndContext>{!fields.length&&<Result status="info" title="Agrega preguntas desde la columna izquierda"/>}</Card><Card size="small" className="builder-panel" title="Configuración">{selectedField?<FieldSettings field={selectedField} all={fields} update={update}/>:<Typography.Text type="secondary">Selecciona una pregunta para editarla.</Typography.Text>}</Card></div></>}
function FieldSettings({field,all,update}:{field:FormField;all:FormField[];update:(p:Partial<FormField>)=>void}){const optionTypes=['select_one','select_multiple'];const validation=field.validation||{},conditional=(field.conditional_logic as any)?.showWhen||{};return <Space direction="vertical" style={{width:'100%'}} size="middle"><div><Typography.Text strong>Etiqueta</Typography.Text><Input value={field.label} onChange={e=>update({label:e.target.value})}/></div><div><Typography.Text strong>Descripción / ayuda</Typography.Text><Input.TextArea rows={2} value={field.description} onChange={e=>update({description:e.target.value})}/></div><div><Typography.Text strong>Tipo</Typography.Text><Select style={{width:'100%'}} value={field.type} options={types.map(t=>({label:t.label,value:t.type}))} onChange={v=>update({type:v})}/></div><Checkbox checked={field.required} disabled={['section','note'].includes(field.type)} onChange={e=>update({required:e.target.checked})}>Obligatoria</Checkbox>{optionTypes.includes(field.type)&&<div><Typography.Text strong>Opciones (una por línea)</Typography.Text><Input.TextArea rows={5} value={(field.options||[]).join('\n')} onChange={e=>update({options:e.target.value.split('\n').filter(Boolean)})}/></div>}{field.type==='matrix'&&<><div><Typography.Text strong>Filas</Typography.Text><Input.TextArea rows={3} value={(field.options?.rows||[]).join('\n')} onChange={e=>update({options:{...(field.options||{}),rows:e.target.value.split('\n').filter(Boolean)}})}/></div><div><Typography.Text strong>Columnas</Typography.Text><Input.TextArea rows={3} value={(field.options?.columns||[]).join('\n')} onChange={e=>update({options:{...(field.options||{}),columns:e.target.value.split('\n').filter(Boolean)}})}/></div></>}<Divider plain>Validaciones</Divider>{['text','textarea'].includes(field.type)&&<Row gutter={8}><Col span={12}><InputNumber style={{width:'100%'}} placeholder="Mínimo" value={validation.minLength} onChange={v=>update({validation:{...validation,minLength:v}})}/></Col><Col span={12}><InputNumber style={{width:'100%'}} placeholder="Máximo" value={validation.maxLength} onChange={v=>update({validation:{...validation,maxLength:v}})}/></Col></Row>}{['number','decimal','range'].includes(field.type)&&<Row gutter={8}><Col span={12}><InputNumber style={{width:'100%'}} placeholder="Mínimo" value={validation.min} onChange={v=>update({validation:{...validation,min:v}})}/></Col><Col span={12}><InputNumber style={{width:'100%'}} placeholder="Máximo" value={validation.max} onChange={v=>update({validation:{...validation,max:v}})}/></Col></Row>}<Divider plain>Lógica condicional</Divider><Select allowClear placeholder="Depende de..." style={{width:'100%'}} value={conditional.fieldId} options={all.filter(f=>f.id!==field.id).map(f=>({label:f.label,value:f.id}))} onChange={v=>update({conditional_logic:v?{showWhen:{...conditional,fieldId:v,operator:'equals'}}:{}})}/>{conditional.fieldId&&<><Select style={{width:'100%'}} value={conditional.operator||'equals'} options={[{label:'Es igual a',value:'equals'},{label:'No es igual a',value:'not_equals'}]} onChange={v=>update({conditional_logic:{showWhen:{...conditional,operator:v}}})}/><Input placeholder="Valor esperado" value={conditional.value} onChange={e=>update({conditional_logic:{showWhen:{...conditional,value:e.target.value}}})}/></>}</Space>}

```

## `client/src/pages/admin/FormSettingsPage.tsx`
```tsx
import { Button,Card,Form,Input,Select,Typography,message } from 'antd';import { useEffect,useState } from 'react';import { useParams } from 'react-router-dom';import { api } from '../../services/api';import type{DynamicForm}from'../../types';import FormTabs from '../../components/forms/FormTabs';
export default function FormSettingsPage(){const{id}=useParams(),[form,setForm]=useState<DynamicForm>();useEffect(()=>{if(id)api.get<DynamicForm>(`/forms/${id}`).then(setForm)},[id]);if(!form)return null;async function save(v:any){const updated=await api.put<DynamicForm>(`/forms/${form.id}`,{...form,...v});setForm(updated);message.success('Configuración guardada')}return <><Typography.Title level={3} style={{marginBottom:0}}>{form.title}</Typography.Title><FormTabs formId={form.id}/><Card title="Configuración del formulario"><Form layout="vertical" initialValues={{title:form.title,description:form.description,status:form.status}} onFinish={save}><Form.Item label="Título" name="title" rules={[{required:true}]}><Input/></Form.Item><Form.Item label="Descripción" name="description"><Input.TextArea rows={4}/></Form.Item><Form.Item label="Estado" name="status"><Select options={['draft','published','closed','archived'].map(v=>({value:v,label:v}))}/></Form.Item><Button htmlType="submit" type="primary">Guardar configuración</Button></Form></Card></>}

```

## `client/src/pages/admin/FormSummaryPage.tsx`
```tsx
import { Card,Descriptions,Space,Tag,Typography,Button } from 'antd';import { useEffect,useState } from 'react';import { useNavigate,useParams } from 'react-router-dom';import { api } from '../../services/api';import type{DynamicForm}from'../../types';import FormTabs from '../../components/forms/FormTabs';import dayjs from 'dayjs';
export default function FormSummaryPage(){const{id}=useParams(),[form,setForm]=useState<DynamicForm>(),nav=useNavigate();useEffect(()=>{if(id)api.get<DynamicForm>(`/forms/${id}`).then(setForm)},[id]);if(!form)return null;return <><Space style={{width:'100%',justifyContent:'space-between'}}><div><Typography.Title level={3} style={{marginBottom:0}}>{form.title}</Typography.Title><Typography.Text type="secondary">{form.description}</Typography.Text></div><Button onClick={()=>nav(`/admin/forms/${id}/builder`)}>Editar formulario</Button></Space><FormTabs formId={form.id}/><Card><Descriptions column={2} items={[{key:'status',label:'Estado',children:<Tag color={form.status==='published'?'success':'default'}>{form.status}</Tag>},{key:'created',label:'Creación',children:dayjs(form.created_at).format('DD/MM/YYYY HH:mm')},{key:'updated',label:'Última modificación',children:dayjs(form.updated_at).format('DD/MM/YYYY HH:mm')},{key:'fields',label:'Preguntas',children:form.fields?.length??0}]}/></Card></>}

```

## `client/src/pages/admin/FormsPage.tsx`
```tsx
import { Button,Card,Dropdown,Input,Modal,Space,Table,Tag,Typography,message } from 'antd';import { PlusOutlined,MoreOutlined } from '@ant-design/icons';import { useEffect,useMemo,useState } from 'react';import { api } from '../../services/api';import type{DynamicForm}from'../../types';import { useNavigate } from 'react-router-dom';import dayjs from 'dayjs';
export default function FormsPage(){const[forms,setForms]=useState<DynamicForm[]>([]),[q,setQ]=useState(''),[open,setOpen]=useState(false),nav=useNavigate();const load=()=>api.get<DynamicForm[]>('/forms').then(setForms);useEffect(()=>{load()},[]);const filtered=useMemo(()=>forms.filter(f=>f.title.toLowerCase().includes(q.toLowerCase())),[forms,q]);async function create(v:any){const f=await api.post<DynamicForm>('/forms',v);setOpen(false);nav(`/admin/forms/${f.id}/builder`)}return <><Space style={{width:'100%',justifyContent:'space-between'}}><Typography.Title level={3}>Formularios</Typography.Title><Button type="primary" icon={<PlusOutlined/>} onClick={()=>setOpen(true)}>Nuevo formulario</Button></Space><Card><Input.Search placeholder="Buscar formularios" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:360,marginBottom:12}}/><Table rowKey="id" size="small" dataSource={filtered} columns={[{title:'Nombre',dataIndex:'title',render:(v,r)=><a onClick={()=>nav(`/admin/forms/${r.id}`)}>{v}</a>},{title:'Estado',dataIndex:'status',render:v=><Tag color={v==='published'?'success':'default'}>{v}</Tag>},{title:'Respuestas',render:(_,r)=>r.submissions?.[0]?.count??0},{title:'Última modificación',dataIndex:'updated_at',render:v=>dayjs(v).format('DD/MM/YYYY HH:mm')},{title:'Acciones',render:(_,r)=><Dropdown menu={{items:[{key:'edit',label:'Editar'},{key:'preview',label:'Vista previa'},{key:'publish',label:r.status==='published'?'Despublicar':'Publicar'},{key:'duplicate',label:'Duplicar'},{key:'data',label:'Ver respuestas'},{key:'analytics',label:'Analizar'},{key:'delete',danger:true,label:'Eliminar'}],onClick:async({key})=>{if(key==='edit')nav(`/admin/forms/${r.id}/builder`);if(key==='preview')nav(`/forms/${r.id}?preview=1`);if(key==='data')nav(`/admin/forms/${r.id}/submissions`);if(key==='analytics')nav(`/admin/forms/${r.id}/analytics`);if(key==='publish'){await api.put(`/forms/${r.id}`,{...r,status:r.status==='published'?'draft':'published'});message.success('Estado actualizado');load()}if(key==='duplicate'){await api.post(`/forms/${r.id}/duplicate`);message.success('Formulario duplicado');load()}if(key==='delete'){Modal.confirm({title:'Eliminar formulario',content:'Se eliminará el formulario y sus campos. Las restricciones de BD impedirán borrar si tiene envíos.',onOk:async()=>{await api.delete(`/forms/${r.id}`);load()}})}}}}><Button type="text" icon={<MoreOutlined/>}/></Dropdown>} ]}/></Card><Modal title="Nuevo formulario" open={open} onCancel={()=>setOpen(false)} footer={null}><CreateForm onSubmit={create}/></Modal></>}
function CreateForm({onSubmit}:{onSubmit:(v:any)=>void}){const[title,setTitle]=useState(''),[description,setDescription]=useState('');return <Space direction="vertical" style={{width:'100%'}}><Input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)}/><Input.TextArea placeholder="Descripción" value={description} onChange={e=>setDescription(e.target.value)}/><Button type="primary" disabled={!title.trim()} onClick={()=>onSubmit({title,description})}>Crear y abrir constructor</Button></Space>}

```

## `client/src/pages/admin/SubmissionDetailPage.tsx`
```tsx
import { Button,Card,Descriptions,Divider,Form,Image,Input,Modal,Space,Tag,Typography,message } from 'antd';
import { useEffect,useState } from 'react';import { useNavigate,useParams } from 'react-router-dom';import { api } from '../../services/api';
import type{DynamicForm,Submission}from'../../types';import { TrafficLight } from '../../utils/status';import dayjs from 'dayjs';import { downloadReceipt,previewReceipt,printReceipt } from '../../utils/pdf';import { supabase } from '../../services/supabase';import FormRenderer from '../../components/forms/FormRenderer';
export default function SubmissionDetailPage(){const{id}=useParams(),[sub,setSub]=useState<Submission>(),[notes,setNotes]=useState(''),[editOpen,setEditOpen]=useState(false),[editForm,setEditForm]=useState<DynamicForm>(),[editValues,setEditValues]=useState<Record<string,any>>({}),nav=useNavigate();
const load=()=>id&&api.get<Submission>(`/submissions/${id}`).then(async s=>{for(const a of s.submission_answers??[]){if(a.value?.path){const{data}=await supabase.storage.from('form-uploads').createSignedUrl(a.value.path,3600);a.value={...a.value,preview:data?.signedUrl}}}setSub(s);setNotes(s.admin_notes??'')});useEffect(()=>{load()},[id]);if(!sub)return null;
async function state(validation_status:string,status=sub.status){await api.put(`/submissions/${sub.id}`,{validation_status,status,validation_score:validation_status==='validated'?100:sub.validation_score,admin_notes:notes});message.success('Respuesta actualizada');load()}
async function openEdit(){const f=await api.get<DynamicForm>(`/forms/${sub.form_id}`);setEditForm(f);setEditValues(Object.fromEntries((sub.submission_answers??[]).map(a=>[a.field_id,a.value])));setEditOpen(true)}
async function saveAnswers(){await api.put(`/submissions/${sub.id}/answers`,{answers:Object.entries(editValues).map(([field_id,value])=>({field_id,value:value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).filter(([k])=>k!=='preview')):value}))});message.success('Respuestas editadas');setEditOpen(false);load()}
return <><Space style={{width:'100%',justifyContent:'space-between'}}><div><Typography.Title level={3} style={{marginBottom:0}}>Respuesta {sub.folio}</Typography.Title><Typography.Text type="secondary">{sub.forms?.title}</Typography.Text></div><Button onClick={()=>nav(-1)}>Volver</Button></Space><Card style={{marginTop:14}}><Descriptions column={2} items={[{key:'user',label:'Usuario',children:sub.profiles?.full_name||sub.profiles?.email},{key:'date',label:'Fecha',children:dayjs(sub.submitted_at).format('DD/MM/YYYY HH:mm')},{key:'status',label:'Estado',children:<Tag>{sub.status}</Tag>},{key:'validation',label:'Semáforo',children:<TrafficLight status={sub.validation_status} score={sub.validation_score}/>} ]}/><Divider>Preguntas y respuestas</Divider>{(sub.submission_answers??[]).sort((a,b)=>(a.form_fields?.position??0)-(b.form_fields?.position??0)).map(a=><div className="answer-row" key={a.field_id}><Typography.Text strong>{a.form_fields?.label}</Typography.Text><div>{renderValue(a.value,a.form_fields?.type)}</div></div>)}<Divider>Observaciones administrativas</Divider><Input.TextArea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observaciones de revisión"/><Space wrap style={{marginTop:12}}><Button onClick={openEdit}>Editar respuestas</Button><Button type="primary" onClick={()=>state('validated','resolved')}>Validar</Button><Button onClick={()=>state('pending','in_review')}>Pendiente</Button><Button danger onClick={()=>state('rejected','in_review')}>Rechazar</Button><Button onClick={async()=>{await api.put(`/submissions/${sub.id}`,{admin_notes:notes});message.success('Observaciones guardadas');load()}}>Guardar observación</Button><Button onClick={()=>previewReceipt(sub)}>Vista previa PDF</Button><Button onClick={()=>printReceipt(sub)}>Imprimir</Button><Button onClick={()=>downloadReceipt(sub)}>Descargar PDF</Button><Button danger onClick={()=>Modal.confirm({title:'Eliminar respuesta',content:'Esta acción elimina respuestas asociadas.',onOk:async()=>{await api.delete(`/submissions/${sub.id}`);nav(`/admin/forms/${sub.form_id}/submissions`)}})}>Eliminar</Button></Space></Card><Modal width={900} title="Editar respuesta" open={editOpen} onCancel={()=>setEditOpen(false)} onOk={saveAnswers} okText="Guardar cambios">{editForm&&<Form layout="vertical"><FormRenderer form={editForm} fields={editForm.fields??[]} values={editValues} onChange={(k,v)=>setEditValues(x=>({...x,[k]:v}))}/></Form>}</Modal></>}
function renderValue(v:any,type?:string){if(v===null||v===undefined||v==='')return <Typography.Text type="secondary">Sin respuesta</Typography.Text>;if(v?.preview&&String(v.mime).startsWith('image/'))return <Space direction="vertical"><Image width={260} src={v.preview}/><a href={v.preview} target="_blank" rel="noreferrer">Abrir archivo</a></Space>;if(v?.preview)return <a href={v.preview} target="_blank" rel="noreferrer">{v.name||'Abrir archivo'}</a>;if(Array.isArray(v))return v.join(', ');if(typeof v==='object')return <pre className="json-value">{JSON.stringify(v,null,2)}</pre>;if(type==='boolean')return String(v);return String(v)}

```

## `client/src/pages/admin/SubmissionsPage.tsx`
```tsx
import { Button,Card,Checkbox,Dropdown,Input,Space,Table,Typography } from 'antd';import { SettingOutlined } from '@ant-design/icons';import { useEffect,useMemo,useState } from 'react';import { api } from '../../services/api';import type{DynamicForm,Submission}from'../../types';import { useNavigate,useParams } from 'react-router-dom';import FormTabs from '../../components/forms/FormTabs';import dayjs from 'dayjs';import { TrafficLight } from '../../utils/status';
export default function SubmissionsPage(){const{formId}=useParams(),[data,setData]=useState<Submission[]>([]),[form,setForm]=useState<DynamicForm>(),[q,setQ]=useState(''),[visible,setVisible]=useState(['folio','respondent','date','status','validation','completion']),nav=useNavigate();useEffect(()=>{if(formId){api.get<Submission[]>(`/submissions/form/${formId}`).then(setData);api.get<DynamicForm>(`/forms/${formId}`).then(setForm)}},[formId]);const filtered=useMemo(()=>data.filter(s=>`${s.folio} ${s.profiles?.full_name} ${s.profiles?.email}`.toLowerCase().includes(q.toLowerCase())),[data,q]);const allCols:any[]=[{key:'folio',title:'Folio',dataIndex:'folio',sorter:(a:any,b:any)=>a.folio.localeCompare(b.folio)},{key:'respondent',title:'Respondente',render:(_:any,r:any)=>r.profiles?.full_name||r.profiles?.email},{key:'date',title:'Fecha',dataIndex:'submitted_at',render:(v:any)=>dayjs(v).format('DD/MM/YYYY HH:mm'),sorter:(a:any,b:any)=>dayjs(a.submitted_at).valueOf()-dayjs(b.submitted_at).valueOf()},{key:'status',title:'Estado',dataIndex:'status',filters:[{text:'Enviado',value:'submitted'},{text:'En revisión',value:'in_review'},{text:'Resuelto',value:'resolved'}],onFilter:(v:any,r:any)=>r.status===v},{key:'validation',title:'Validación',dataIndex:'validation_status',filters:['pending','validated','incomplete','rejected'].map(x=>({text:x,value:x})),onFilter:(v:any,r:any)=>r.validation_status===v,render:(v:any,r:any)=><TrafficLight status={v} score={r.validation_score}/>},{key:'completion',title:'Completado',dataIndex:'validation_score',render:(v:any)=>`${v}%`},{key:'actions',title:'Acciones',render:(_:any,r:any)=><Button onClick={()=>nav(`/admin/submissions/${r.id}`)}>Ver</Button>}];return <>{form&&<><Typography.Title level={3} style={{marginBottom:0}}>{form.title}</Typography.Title><FormTabs formId={form.id}/></>}<Card><Space style={{marginBottom:12,width:'100%',justifyContent:'space-between'}}><Input.Search placeholder="Buscar folio o respondente" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:380}}/><Dropdown trigger={['click']} dropdownRender={()=> <Card size="small">{allCols.filter(c=>c.key!=='actions').map(c=><div key={c.key}><Checkbox checked={visible.includes(c.key)} onChange={e=>setVisible(v=>e.target.checked?[...v,c.key]:v.filter(x=>x!==c.key))}>{c.title}</Checkbox></div>)}</Card>}><Button icon={<SettingOutlined/>}>Columnas</Button></Dropdown><Button onClick={()=>{const headers=['folio','respondent','submitted_at','status','validation_status','completion'];const rows=filtered.map(s=>[s.folio,s.profiles?.full_name||s.profiles?.email||'',s.submitted_at,s.status,s.validation_status,s.validation_score]);const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??'').replaceAll('\"','\"\"')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`respuestas-${formId}.csv`;a.click();URL.revokeObjectURL(a.href)}}>Exportar CSV</Button></Space><Table rowKey="id" size="small" dataSource={filtered} columns={allCols.filter(c=>c.key==='actions'||visible.includes(c.key))} pagination={{pageSize:10,showSizeChanger:true}}/></Card></>}

```

## `client/src/pages/auth/LoginPage.tsx`
```tsx
import { Button,Card,Form,Input,Typography,message } from 'antd';import { LockOutlined,MailOutlined } from '@ant-design/icons';import { supabase } from '../../services/supabase';import { useNavigate } from 'react-router-dom';
export default function LoginPage(){const nav=useNavigate();async function submit(v:{email:string;password:string}){const{data,error}=await supabase.auth.signInWithPassword(v);if(error)return message.error(error.message);const{data:p}=await supabase.from('profiles').select('role').eq('id',data.user.id).single();nav(p?.role==='admin'?'/admin/dashboard':'/forms')}return <div className="login-page"><Card className="login-card"><Typography.Title level={3} style={{marginBottom:0}}>Apoyos Digitales</Typography.Title><Typography.Paragraph type="secondary">Facultad de Ingeniería Mochis</Typography.Paragraph><Form layout="vertical" onFinish={submit}><Form.Item name="email" label="Correo" rules={[{required:true},{type:'email'}]}><Input prefix={<MailOutlined/>}/></Form.Item><Form.Item name="password" label="Contraseña" rules={[{required:true}]}><Input.Password prefix={<LockOutlined/>}/></Form.Item><Button htmlType="submit" type="primary" block>Iniciar sesión</Button></Form></Card></div>}

```

## `client/src/pages/respondent/FormFillPage.tsx`
```tsx
import { Button,Card,Form,Result,Space,Spin,Typography,message } from 'antd';import { useEffect,useState } from 'react';import { useNavigate,useParams,useSearchParams } from 'react-router-dom';import { api } from '../../services/api';import type{DynamicForm}from'../../types';import FormRenderer from '../../components/forms/FormRenderer';import { useAuth } from '../../context/AuthContext';
export default function FormFillPage(){const{id}=useParams(),[sp]=useSearchParams(),preview=sp.get('preview')==='1';const[form,setForm]=useState<DynamicForm>(),[values,setValues]=useState<Record<string,any>>({}),[sent,setSent]=useState<any>(),[loading,setLoading]=useState(false),nav=useNavigate(),{profile}=useAuth();useEffect(()=>{if(id)api.get<DynamicForm>(`/forms/${id}`).then(setForm).catch(e=>message.error(e.message))},[id]);if(!form)return <Spin/>;const fields=form.fields??[];function missing(){return fields.filter(f=>f.required&&!['note','section'].includes(f.type)).filter(f=>{const v=values[f.id!];return v===null||v===undefined||v===''||(Array.isArray(v)&&!v.length)||(f.type==='consent'&&!v)})}async function submit(){const miss=missing();if(miss.length)return message.error(`Faltan ${miss.length} campos obligatorios`);setLoading(true);try{const signatureFields=fields.filter(f=>f.type==='signature'&&typeof values[f.id!]==='string'&&values[f.id!].startsWith('data:image'));const cooked={...values};for(const f of signatureFields){const dataUrl=cooked[f.id!];const blob=await(await fetch(dataUrl)).blob();const {supabase}=await import('../../services/supabase');const path=`${profile!.id}/${form.id}/${crypto.randomUUID()}-firma.png`;const{error}=await supabase.storage.from('form-uploads').upload(path,blob,{contentType:'image/png'});if(error)throw error;cooked[f.id!]={name:'firma.png',path,mime:'image/png',size:blob.size};}const sub=await api.post('/submissions',{form_id:form.id,answers:Object.entries(cooked).map(([field_id,value])=>({field_id,value}))});setSent(sub)}catch(e:any){message.error(e.message)}finally{setLoading(false)}}if(sent)return <Result status="success" title="Formulario enviado" subTitle={`Folio: ${sent.folio}`} extra={<Button type="primary" onClick={()=>nav('/forms')}>Volver a formularios</Button>}/>;return <Card className="form-fill-card"><Typography.Title level={2}>{form.title}</Typography.Title><Typography.Paragraph type="secondary">{form.description}</Typography.Paragraph>{preview&&<Result status="info" title="Vista previa administrativa" subTitle="Los cambios aquí no se guardarán"/>}<Form layout="vertical"><FormRenderer form={form} fields={fields} values={values} onChange={(k,v)=>setValues(x=>({...x,[k]:v}))}/><Space><Button onClick={()=>nav(-1)}>Cancelar</Button>{!preview&&<Button type="primary" loading={loading} onClick={submit}>Enviar formulario</Button>}</Space></Form></Card>}

```

## `client/src/pages/respondent/FormsListPage.tsx`
```tsx
import { Card,Col,Row,Tag,Typography,Button } from 'antd';import { useEffect,useState } from 'react';import { api } from '../../services/api';import type{DynamicForm}from'../../types';import { useNavigate } from 'react-router-dom';
export default function FormsListPage(){const[forms,setForms]=useState<DynamicForm[]>([]),nav=useNavigate();useEffect(()=>{api.get<DynamicForm[]>('/forms').then(setForms)},[]);return <><Typography.Title level={3}>Formularios disponibles</Typography.Title><Row gutter={[16,16]}>{forms.map(f=><Col xs={24} md={12} xl={8} key={f.id}><Card title={f.title} extra={<Tag color="success">Disponible</Tag>}><Typography.Paragraph type="secondary">{f.description}</Typography.Paragraph><Button type="primary" onClick={()=>nav(`/forms/${f.id}`)}>Responder</Button></Card></Col>)}</Row>{!forms.length&&<Card>No hay formularios publicados por el momento.</Card>}</>}

```

## `client/src/pages/respondent/MySubmissionsPage.tsx`
```tsx
import { Card,Table,Typography } from 'antd';import { useEffect,useState } from 'react';import { api } from '../../services/api';import dayjs from 'dayjs';import { ValidationTag } from '../../utils/status';
export default function MySubmissionsPage(){const[data,setData]=useState<any[]>([]);useEffect(()=>{api.get<any[]>('/submissions/mine').then(setData)},[]);return <><Typography.Title level={3}>Mis envíos</Typography.Title><Card><Table rowKey="id" size="small" dataSource={data} columns={[{title:'Folio',dataIndex:'folio'},{title:'Formulario',render:(_,r)=>r.forms?.title},{title:'Fecha',dataIndex:'submitted_at',render:v=>dayjs(v).format('DD/MM/YYYY HH:mm')},{title:'Estado',dataIndex:'status'},{title:'Validación',dataIndex:'validation_status',render:v=><ValidationTag status={v}/>} ]}/></Card></>}

```

## `client/src/services/api.ts`
```ts
import { supabase } from './supabase';
const base=import.meta.env.VITE_API_URL??'http://localhost:4000/api';
async function request<T>(path:string,options:RequestInit={}){
  const {data:{session}}=await supabase.auth.getSession();
  const res=await fetch(`${base}${path}`,{...options,headers:{'Content-Type':'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }),...(options.headers??{})}});
  if(!res.ok){const e=await res.json().catch(()=>({error:res.statusText}));throw new Error(e.error??'Error de API')}
  if(res.status===204)return undefined as T;
  return res.json() as Promise<T>;
}
export const api={get:<T>(p:string)=>request<T>(p),post:<T>(p:string,b?:any)=>request<T>(p,{method:'POST',body:JSON.stringify(b??{})}),put:<T>(p:string,b:any)=>request<T>(p,{method:'PUT',body:JSON.stringify(b)}),delete:<T>(p:string)=>request<T>(p,{method:'DELETE'})};

```

## `client/src/services/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
if(!url||!key) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
export const supabase=createClient(url,key);

```

## `client/src/styles.css`
```css
html,body,#root{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f4f6f8;color:#1f2937}.center{height:100vh;display:grid;place-items:center}.app-layout{min-height:100vh}.sider{border-right:1px solid #e5e7eb;position:sticky!important;top:0;height:100vh}.brand{height:72px;padding:17px 18px;border-bottom:1px solid #eef0f2;display:flex;flex-direction:column;color:#194f80}.brand span{font-size:12px;color:#6b7280;margin-top:2px}.topbar{background:white!important;border-bottom:1px solid #e5e7eb!important;padding:0 24px!important;display:flex;align-items:center;justify-content:flex-end;gap:12px;position:sticky;top:0;z-index:5}.content{padding:20px 24px;overflow:auto}.login-page{min-height:100vh;display:grid;place-items:center;background:#eef2f6}.login-card{width:min(390px,calc(100vw - 32px));border-top:4px solid #185fa7}.builder-grid{display:grid;grid-template-columns:230px minmax(480px,1fr) 320px;gap:12px;align-items:start}.builder-panel,.builder-canvas{min-height:620px}.palette{display:grid;gap:6px}.palette .ant-btn{text-align:left}.builder-field{border-left:3px solid transparent}.builder-field.selected{border-left-color:#185fa7;background:#f8fbff}.field-placeholder{color:#6b7280}.signature-box{border:1px solid #d9d9d9;background:white;overflow:auto;max-width:100%}.signature-canvas{max-width:100%;touch-action:none}.signature-preview{max-width:100%;max-height:180px}.respondent-layout{min-height:100vh}.respondent-header{background:#fff!important;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;padding:0 5%!important}.resp-brand{font-weight:700;font-size:17px;color:#185fa7}.resp-sub{margin-left:10px;color:#6b7280}.respondent-content{width:min(1050px,92%);margin:24px auto}.form-fill-card{max-width:850px;margin:auto}.answer-row{padding:12px 0;border-bottom:1px solid #f0f0f0;display:grid;grid-template-columns:minmax(180px,35%) 1fr;gap:20px}.json-value{white-space:pre-wrap;margin:0}.analytics-card{margin-bottom:14px}.matrix>div{display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee}@media(max-width:1000px){.builder-grid{grid-template-columns:1fr}.builder-panel:first-child,.builder-panel:last-child{display:none}.builder-canvas:before{content:'Constructor optimizado para escritorio';display:block;background:#fffbe6;border:1px solid #ffe58f;padding:8px;margin-bottom:10px}.sider{display:none}.content{padding:16px}.respondent-header{height:auto!important;min-height:64px;flex-wrap:wrap}.resp-sub{display:none}}@media(max-width:640px){.answer-row{grid-template-columns:1fr}.respondent-header .ant-space{gap:6px!important}.respondent-header .ant-typography{display:none}}

```

## `client/src/types/index.ts`
```ts
export type Role='admin'|'respondent';
export type FieldType='text'|'textarea'|'number'|'decimal'|'email'|'phone'|'date'|'time'|'datetime'|'select_one'|'select_multiple'|'boolean'|'rating'|'range'|'file'|'image'|'signature'|'consent'|'note'|'section'|'matrix';
export interface Profile{id:string;full_name:string|null;email:string;role:Role;avatar_url?:string|null}
export interface FormField{id?:string;form_id?:string;type:FieldType;label:string;description?:string;required:boolean;position:number;options?:any;validation?:Record<string,any>;conditional_logic?:Record<string,any>;settings?:Record<string,any>}
export interface DynamicForm{id:string;title:string;description:string;status:'draft'|'published'|'closed'|'archived';created_by:string;settings?:Record<string,any>;created_at:string;updated_at:string;published_at?:string|null;fields?:FormField[];submissions?:[{count:number}];form_fields?:[{count:number}]}
export interface SubmissionAnswer{id?:string;submission_id?:string;field_id:string;value:any;form_fields?:FormField}
export interface Submission{id:string;folio:string;form_id:string;respondent_id:string;status:string;validation_status:'incomplete'|'pending'|'validated'|'rejected';validation_score:number;admin_notes?:string|null;submitted_at:string;validated_at?:string|null;profiles?:{full_name:string;email:string};forms?:DynamicForm;submission_answers?:SubmissionAnswer[]}

```

## `client/src/utils/pdf.ts`
```ts
import jsPDF from 'jspdf';import QRCode from 'qrcode';import type{Submission}from'../types';
async function buildReceipt(sub:Submission){const doc=new jsPDF();let y=18;doc.setFontSize(15);doc.text('Facultad de Ingeniería Mochis',20,y);y+=8;doc.setFontSize(12);doc.text('COMPROBANTE DE REGISTRO',20,y);y+=10;const rows=[['Folio',sub.folio],['Formulario',sub.forms?.title??''],['Usuario',sub.profiles?.full_name??sub.profiles?.email??''],['Fecha',new Date(sub.submitted_at).toLocaleString('es-MX')],['Estado',sub.status],['Validación',sub.validation_status],['Generado',new Date().toLocaleString('es-MX')]];for(const[r,v]of rows){doc.setFont(undefined,'bold');doc.text(`${r}:`,20,y);doc.setFont(undefined,'normal');doc.text(String(v),55,y);y+=7}y+=4;doc.setFont(undefined,'bold');doc.text('Resumen de respuestas',20,y);y+=7;doc.setFont(undefined,'normal');for(const a of sub.submission_answers??[]){const label=a.form_fields?.label??a.field_id;if(a.form_fields?.type==='signature'&&a.value?.preview){try{const blob=await fetch(a.value.preview).then(r=>r.blob());const data=await new Promise<string>((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result));fr.onerror=reject;fr.readAsDataURL(blob)});if(y+38>270){doc.addPage();y=20}doc.text(`${label}:`,20,y);doc.addImage(data,'PNG',55,y-5,55,24);y+=30;continue}catch{}}const raw=typeof a.value==='object'?JSON.stringify(a.value):String(a.value??'');const lines=doc.splitTextToSize(`${label}: ${raw}`,170);if(y+lines.length*6>270){doc.addPage();y=20}doc.text(lines,20,y);y+=lines.length*6+2}const qr=await QRCode.toDataURL(sub.folio);doc.addImage(qr,'PNG',155,15,35,35);doc.rect(135,250,55,22);doc.setFontSize(8);doc.text('Espacio para sello institucional',140,262);return doc}
export async function downloadReceipt(sub:Submission){const doc=await buildReceipt(sub);doc.save(`${sub.folio}.pdf`)}
export async function previewReceipt(sub:Submission){const doc=await buildReceipt(sub);window.open(doc.output('bloburl'),'_blank','noopener,noreferrer')}
export async function printReceipt(sub:Submission){const doc=await buildReceipt(sub);const url=doc.output('bloburl');const w=window.open(url,'_blank');if(w)w.addEventListener('load',()=>w.print())}

```

## `client/src/utils/status.tsx`
```tsx
import { Badge,Progress,Tag } from 'antd';
export const validationLabel=(s:string)=>({validated:'Validado',pending:'Pendiente',incomplete:'Incompleto',rejected:'Rechazado'}[s]??s);
export function ValidationTag({status}:{status:string}){const color=status==='validated'?'success':status==='pending'?'warning':'error';return <Tag color={color}>{validationLabel(status)}</Tag>}
export function TrafficLight({status,score}:{status:string;score:number}){const badge=status==='validated'?'success':status==='pending'?'warning':'error';return <div style={{minWidth:140}}><Badge status={badge} text={validationLabel(status)}/><Progress percent={score} size="small" status={status==='rejected'?'exception':'normal'}/></div>}

```

## `client/tsconfig.app.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}

```

## `client/tsconfig.json`
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

## `client/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true
  },
  "include": ["vite.config.ts"]
}

```

## `client/vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});

```

## `package.json`
```json
{
  "name": "apoyos-digitales-fim",
  "private": true,
  "scripts": {
    "install:all": "npm --prefix server install && npm --prefix client install",
    "build": "npm --prefix server run build && npm --prefix client run build",
    "dev:server": "npm --prefix server run dev",
    "dev:client": "npm --prefix client run dev"
  }
}

```

## `render.yaml`
```yaml
services:
  - type: web
    name: apoyos-digitales-api
    runtime: node
    rootDir: server
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 22
      - key: CLIENT_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
  - type: web
    name: apoyos-digitales-web
    runtime: static
    rootDir: client
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: NODE_VERSION
        value: 22
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: VITE_API_URL
        sync: false

```

## `server/.env.example`
```env
PORT=4000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY
SEED_ADMIN_EMAIL=admin@demo.com
SEED_ADMIN_PASSWORD=DemoAdmin123!
SEED_RESPONDENT_EMAIL=respondente@demo.com
SEED_RESPONDENT_PASSWORD=DemoRespondent123!

```

## `server/package.json`
```json
{
  "name": "apoyos-digitales-server",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^5.1.0",
    "helmet": "^8.1.0",
    "morgan": "^1.10.1",
    "zod": "^4.1.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/morgan": "^1.9.10",
    "@types/node": "^24.3.1",
    "tsx": "^4.20.5",
    "typescript": "^5.9.2"
  }
}

```

## `server/src/config/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) throw new Error('Faltan variables SUPABASE_* en server/.env');

export const supabaseAdmin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const supabaseAnon = createClient(url, anon, {
  auth: { autoRefreshToken: false, persistSession: false }
});

```

## `server/src/index.ts`
```ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import forms from './routes/forms.js';
import submissions from './routes/submissions.js';
import dashboard from './routes/dashboard.js';
import analytics from './routes/analytics.js';
import audit from './routes/audit.js';
import { errorHandler } from './middleware/error.js';

const app=express();
app.use(helmet());app.use(cors({origin:(process.env.CLIENT_URL??'http://localhost:5173').split(',')}));app.use(express.json({limit:'10mb'}));app.use(morgan('dev'));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'apoyos-digitales-api'}));
app.use('/api/forms',forms);app.use('/api/submissions',submissions);app.use('/api/dashboard',dashboard);app.use('/api/analytics',analytics);app.use('/api/audit',audit);app.use(errorHandler);
const port=Number(process.env.PORT??4000);app.listen(port,()=>console.log(`API en puerto ${port}`));

```

## `server/src/middleware/auth.ts`
```ts
import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autenticado' });
    const token = header.slice(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Sesión inválida' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) return res.status(403).json({ error: 'Perfil no encontrado' });
    req.authUser = data.user;
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Requiere rol administrador' });
  next();
}

```

## `server/src/middleware/error.ts`
```ts
import type { NextFunction, Request, Response } from 'express';
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Error interno';
  res.status(500).json({ error: message });
}

```

## `server/src/routes/analytics.ts`
```ts
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

```

## `server/src/routes/audit.ts`
```ts
import { Router } from 'express';import { supabaseAdmin } from '../config/supabase.js';import { requireAdmin, requireAuth } from '../middleware/auth.js';
const router=Router();router.use(requireAuth,requireAdmin);router.get('/',async(_req,res,next)=>{try{const{data,error}=await supabaseAdmin.from('audit_logs').select('*,profiles(full_name,email)').order('created_at',{ascending:false}).limit(200);if(error)throw error;res.json(data)}catch(e){next(e)}});export default router;

```

## `server/src/routes/dashboard.ts`
```ts
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

```

## `server/src/routes/forms.ts`
```ts
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
  try { const {data:old}=await supabaseAdmin.from('forms').select('*').eq('id',req.params.id).single(); const {error}=await supabaseAdmin.from('forms').delete().eq('id',req.params.id); if(error) throw error; await audit(req.profile!.id,'form',req.params.id,'form_deleted',old,null); res.status(204).end(); }catch(e){next(e)}
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
    await audit(req.profile!.id,'form',req.params.id,'form_updated',null,{fields:data}); res.json(data);
  }catch(e){next(e)}
});

export default router;

```

## `server/src/routes/submissions.ts`
```ts
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
  await audit(req.profile!.id,'submission',req.params.id,'submission_updated',old,answers);res.json({ok:true});
}catch(e){next(e)}});

router.delete('/:id', requireAdmin, async (req,res,next)=>{try{const {data:old}=await supabaseAdmin.from('submissions').select('*').eq('id',req.params.id).single();const {error}=await supabaseAdmin.from('submissions').delete().eq('id',req.params.id);if(error)throw error;await audit(req.profile!.id,'submission',req.params.id,'submission_deleted',old,null);res.status(204).end()}catch(e){next(e)}});

export default router;

```

## `server/src/seed.ts`
```ts
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

```

## `server/src/types/express.d.ts`
```ts
import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
      profile?: { id: string; full_name: string | null; email: string; role: 'admin' | 'respondent' };
    }
  }
}
export {};

```

## `server/src/utils/audit.ts`
```ts
import { supabaseAdmin } from '../config/supabase.js';
export async function audit(userId:string, entityType:string, entityId:string, action:string, oldData:unknown=null, newData:unknown=null){
  await supabaseAdmin.from('audit_logs').insert({user_id:userId,entity_type:entityType,entity_id:entityId,action,old_data:oldData,new_data:newData});
}

```

## `server/src/utils/completion.ts`
```ts
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

```

## `server/src/utils/stats.ts`
```ts
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

```

## `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}

```

## `supabase/README.md`
```md
# Supabase

1. Crea un proyecto Supabase.
2. Abre SQL Editor y ejecuta `schema.sql` una sola vez en una base nueva.
3. En Authentication > URL Configuration agrega `http://localhost:5173` y la URL final del frontend Render.
4. Copia Project URL, anon key y service_role key a los `.env` correspondientes.
5. Ejecuta `npm --prefix server run seed` después de configurar `server/.env`.
6. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend.

El bucket `form-uploads` se crea desde SQL y queda privado. El frontend almacena rutas, no URLs públicas, y genera Signed URLs para preview/descarga.

```

## `supabase/schema.sql`
```sql
-- Apoyos Digitales - Facultad de Ingeniería Mochis
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','respondent');
create type public.form_status as enum ('draft','published','closed','archived');
create type public.submission_status as enum ('draft','submitted','in_review','resolved','closed');
create type public.validation_status as enum ('incomplete','pending','validated','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role public.user_role not null default 'respondent',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  status public.form_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  type text not null check (type in ('text','textarea','number','decimal','email','phone','date','time','datetime','select_one','select_multiple','boolean','rating','range','file','image','signature','consent','note','section','matrix')),
  label text not null,
  description text not null default '',
  required boolean not null default false,
  position integer not null default 0 check(position >= 0),
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  conditional_logic jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  folio text unique,
  form_id uuid not null references public.forms(id) on delete restrict,
  respondent_id uuid not null references public.profiles(id) on delete restrict,
  status public.submission_status not null default 'draft',
  validation_status public.validation_status not null default 'pending',
  validation_score integer not null default 0 check(validation_score between 0 and 100),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null
);

create table public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  field_id uuid not null references public.form_fields(id) on delete cascade,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(submission_id, field_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index forms_status_idx on public.forms(status);
create index forms_created_by_idx on public.forms(created_by);
create index form_fields_form_position_idx on public.form_fields(form_id, position);
create index submissions_form_idx on public.submissions(form_id);
create index submissions_respondent_idx on public.submissions(respondent_id);
create index submissions_validation_idx on public.submissions(validation_status);
create index submissions_submitted_idx on public.submissions(submitted_at desc);
create index answers_submission_idx on public.submission_answers(submission_id);
create index answers_field_idx on public.submission_answers(field_id);
create index audit_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger forms_updated before update on public.forms for each row execute function public.set_updated_at();
create trigger form_fields_updated before update on public.form_fields for each row execute function public.set_updated_at();
create trigger submissions_updated before update on public.submissions for each row execute function public.set_updated_at();
create trigger submission_answers_updated before update on public.submission_answers for each row execute function public.set_updated_at();

create sequence if not exists public.submission_folio_seq start 1;
create or replace function public.assign_submission_folio()
returns trigger language plpgsql as $$
begin
  if new.folio is null then
    new.folio := 'FIM-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.submission_folio_seq')::text, 6, '0');
  end if;
  return new;
end; $$;
create trigger submissions_folio before insert on public.submissions for each row execute function public.assign_submission_folio();

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,full_name,email,role)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''), 'respondent')
  on conflict(id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
create policy "profiles own select" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "admins profiles all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Forms
create policy "published forms readable" on public.forms for select using (status='published' or public.is_admin());
create policy "admins forms insert" on public.forms for insert with check (public.is_admin() and created_by=auth.uid());
create policy "admins forms update" on public.forms for update using (public.is_admin()) with check (public.is_admin());
create policy "admins forms delete" on public.forms for delete using (public.is_admin());

-- Fields
create policy "published fields readable" on public.form_fields for select using (
  public.is_admin() or exists(select 1 from public.forms f where f.id=form_id and f.status='published')
);
create policy "admins fields insert" on public.form_fields for insert with check (public.is_admin());
create policy "admins fields update" on public.form_fields for update using (public.is_admin()) with check (public.is_admin());
create policy "admins fields delete" on public.form_fields for delete using (public.is_admin());

-- Submissions
create policy "own submissions readable" on public.submissions for select using (respondent_id=auth.uid() or public.is_admin());
create policy "respondent submission insert" on public.submissions for insert with check (
  respondent_id=auth.uid() and exists(select 1 from public.forms f where f.id=form_id and f.status='published')
);
create policy "admin submissions update" on public.submissions for update using (public.is_admin()) with check (public.is_admin());
create policy "admin submissions delete" on public.submissions for delete using (public.is_admin());

-- Answers
create policy "own answers readable" on public.submission_answers for select using (
  public.is_admin() or exists(select 1 from public.submissions s where s.id=submission_id and s.respondent_id=auth.uid())
);
create policy "own answers insert" on public.submission_answers for insert with check (
  exists(select 1 from public.submissions s where s.id=submission_id and s.respondent_id=auth.uid())
);
create policy "admin answers update" on public.submission_answers for update using (public.is_admin()) with check(public.is_admin());
create policy "admin answers delete" on public.submission_answers for delete using(public.is_admin());

-- Audit
create policy "admin audit read" on public.audit_logs for select using(public.is_admin());
create policy "admin audit insert" on public.audit_logs for insert with check(public.is_admin());

-- Storage bucket: private, signed URLs only
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('form-uploads','form-uploads',false,10485760,array[
  'image/jpeg','image/png','application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]) on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Storage path convention: <userId>/<formId>/<uuid>-filename
create policy "authenticated upload own prefix" on storage.objects for insert to authenticated
with check(bucket_id='form-uploads' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "authenticated read own prefix" on storage.objects for select to authenticated
using(bucket_id='form-uploads' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
create policy "authenticated delete own prefix" on storage.objects for delete to authenticated
using(bucket_id='form-uploads' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

```
