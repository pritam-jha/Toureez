import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Node.js < 22 WebSocket polyfill ──────────────────────────────────────────
// @supabase/realtime-js checks globalThis.WebSocket at startup.
// Node.js 22+ has it natively; older versions need the 'ws' package.
// Setting globalThis.WebSocket here before createClient() is called is
// the most reliable approach — no options threading needed.
if (typeof (globalThis as Record<string, unknown>).WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = require('ws');
}

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

export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
