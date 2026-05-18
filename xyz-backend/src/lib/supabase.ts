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

const supabaseKey = getRequiredEnv([
  'SUPABASE_SERVICE_ROLE_KEY', // preferred: full trust for backend operations
  'SUPABASE_ANON_KEY',         // fallback: JWT anon key (eyJ...) — NOT sb_publishable_*
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]);

/**
 * Supabase client configured from environment variables.
 * Prefer SUPABASE_SERVICE_ROLE_KEY for trusted backend operations.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
