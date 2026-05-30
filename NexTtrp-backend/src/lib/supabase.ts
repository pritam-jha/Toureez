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

const supabaseAnonKey = getRequiredEnv([
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]);

const supabaseServiceRoleKey = getRequiredEnv(['SUPABASE_SERVICE_ROLE_KEY']);

// Node.js 22+ has native WebSocket — no polyfill needed.
// The Dockerfile uses node:22-alpine which satisfies this requirement.

export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
