/**
 * @file lib/supabase.ts
 * @description Supabase client singleton with AsyncStorage session persistence.
 *
 * Uses the same Supabase project as NexTtrp-user and NexTtrp-admin-app —
 * all three apps share the same auth.users table and public schema.
 *
 * IMPORTANT: Import `supabase` from this file only inside lib/api/* files.
 * Screens and components must NEVER import supabase directly — all data
 * access goes through the typed API layer in lib/api/*.
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/config';

/**
 * Singleton Supabase client configured with:
 * - AsyncStorage for session persistence across app restarts
 * - Auto token refresh enabled
 * - detectSessionInUrl disabled (not applicable in React Native)
 */
export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
