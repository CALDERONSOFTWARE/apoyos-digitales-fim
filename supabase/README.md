# Supabase

1. Crea un proyecto Supabase.
2. Abre SQL Editor y ejecuta `schema.sql` una sola vez en una base nueva.
3. En Authentication > URL Configuration agrega `http://localhost:5173` y la URL final del frontend Render.
4. Copia Project URL, anon key y service_role key a los `.env` correspondientes.
5. Ejecuta `npm --prefix server run seed` después de configurar `server/.env`.
6. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend.

El bucket `form-uploads` se crea desde SQL y queda privado. El frontend almacena rutas, no URLs públicas, y genera Signed URLs para preview/descarga.
