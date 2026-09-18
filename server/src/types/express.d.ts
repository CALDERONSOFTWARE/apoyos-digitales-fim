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
