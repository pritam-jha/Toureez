/**
 * @file lib/sentry.ts
 * @description Sentry error monitoring for the admin app.
 * Set EXPO_PUBLIC_SENTRY_DSN in .env to enable.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const release = Constants.expoConfig?.version ?? '1.0.0';
const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export function initialiseSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    release,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    enabled: environment === 'production' || Boolean(dsn),
    integrations: [Sentry.reactNativeTracingIntegration()],
  });
}

export { Sentry };
