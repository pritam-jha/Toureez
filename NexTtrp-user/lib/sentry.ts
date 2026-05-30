/**
 * @file lib/sentry.ts
 * Sentry error monitoring — safe to import whether or not the native
 * plugin is linked. Set EXPO_PUBLIC_SENTRY_DSN in eas.json to activate.
 */

export function initialiseSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    Sentry.init({ dsn, tracesSampleRate: 0.2, enableAutoSessionTracking: true });
  } catch {
    // native module not linked — continue without Sentry
  }
}
