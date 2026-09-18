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
