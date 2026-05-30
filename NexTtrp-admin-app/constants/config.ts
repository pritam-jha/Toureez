/**
 * @file constants/config.ts
 */
import Constants from 'expo-constants';

const env = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
} as const;

function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) throw new Error(`[Config] Missing env var: ${key}`);
  return value;
}

export const Config = {
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  apiBaseUrl: requireEnv('EXPO_PUBLIC_API_BASE_URL'),
  appName: 'XYZ Admin',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  queryStaleTimeMs: 5 * 60 * 1000,
  queryCacheTimeMs: 10 * 60 * 1000,
} as const;
