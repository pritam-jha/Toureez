import 'dotenv/config';

const parsePositiveIntegerEnv = (key: string, fallback: number): number => {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeBaseUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`API_BASE_URL must be a valid absolute URL. Received: ${value}`);
  }
};

const port = parsePositiveIntegerEnv('PORT', 3000);

export const config = {
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  PORT: port,
  API_BASE_URL: normalizeBaseUrl(process.env.API_BASE_URL?.trim() || `http://localhost:${port}`),
  APP_NAME: process.env.APP_NAME?.trim() || 'API',
} as const;

export const IS_PRODUCTION = config.NODE_ENV === 'production';
