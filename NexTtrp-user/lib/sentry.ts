/**
 * @file lib/sentry.ts
 * @description Sentry error monitoring initialisation for the traveller app.
 *
 * Set EXPO_PUBLIC_SENTRY_DSN in your .env files and eas.json to enable.
 * Without a DSN, Sentry is silently disabled — no crashes, no false positive logs.
 *
 * Docs: https://docs.sentry.io/platforms/react-native/
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const release = Constants.expoConfig?.version ?? '1.0.0';
const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export function initialiseSentry(): void {
  if (!dsn) return; // Sentry disabled — no DSN configured

  Sentry.init({
    dsn,
    release,
    environment,
    // Capture 100% of transactions in production; reduce for high-traffic apps
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    // Do not send events in development unless DSN is explicitly set
    enabled: environment === 'production' || Boolean(dsn),
    // Redact sensitive headers before they leave the device
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
  });
}

export { Sentry };
