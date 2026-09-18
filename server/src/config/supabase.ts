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
