import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Mode démo activé si les clés Supabase ne sont pas configurées
export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

// Client server-side avec service_role (bypass RLS pour les opérations admin)
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Client server-side avec anon key (pour les opérations côté utilisateur)
export const supabaseServer = (() => {
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey) return null;
  return createClient(supabaseUrl, anonKey);
})();
