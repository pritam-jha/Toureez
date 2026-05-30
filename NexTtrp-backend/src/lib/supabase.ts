import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const getRequiredEnv = (keys: string[]): string => {
  for (const key of keys) {
    const value = process.env[key];

    if (value !== undefined && value.trim() !== '') {
      return value.trim();
    }
  }

  throw new Error(`${keys.join(' or ')} environment variable is required`);
};

const supabaseUrl = getRequiredEnv([
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
]);

// FIXED: 4 - Keep the public JWT client separate from privileged backend access.
const supabaseAnonKey = getRequiredEnv([
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]);

// FIXED: 4 - Require the backend-only service role key for trusted server operations.
const supabaseServiceRoleKey = getRequiredEnv(['SUPABASE_SERVICE_ROLE_KEY']);

/**
 * Supabase client configured with the public anon key.
 * Use this for auth token validation and other non-privileged operations.
 */
// FIXED: 4 - Public client is explicitly named so it is not confused with admin access.
export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Supabase service-role client for backend-only trusted operations.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
 */
// FIXED: 4 - Admin client is explicitly named for RLS-bypassing backend work.
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
