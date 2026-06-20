const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
} as const;

function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}. Set it in toureez-web/.env`
    );
  }
  return value;
}

export const Config = {
  supabaseUrl: requireEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),

  appName: 'Toureez',

  packagesPageSize: 20,
  maxCompareItems: 4,

  queryStaleTimeMs: 5 * 60 * 1000,
  queryCacheTimeMs: 10 * 60 * 1000,

  indianStates: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  ] as const,

  packageCategories: [
    { value: 'pilgrimage', label: 'Pilgrimage' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'leisure', label: 'Leisure' },
    { value: 'honeymoon', label: 'Honeymoon' },
    { value: 'family', label: 'Family' },
  ] as const,
} as const;
