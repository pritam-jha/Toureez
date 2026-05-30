/**
 * @file lib/sentry.ts
 * @description Sentry error monitoring for the Node.js backend.
 *
 * Set SENTRY_DSN in your .env / deployment environment to enable.
 * Call initialiseSentry() BEFORE importing app.ts so all errors are captured.
 */

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV ?? 'development';

export function initialiseSentry(): void {
  if (!dsn) return; // Sentry disabled when DSN not configured

  Sentry.init({
    dsn,
    environment,
    release: process.env.npm_package_version ?? '1.0.0',
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Redact auth headers from HTTP breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'http') {
        const data = breadcrumb.data as Record<string, unknown> | undefined;
        if (data?.['authorization']) {
          data['authorization'] = '[REDACTED]';
        }
      }
      return breadcrumb;
    },
  });
}

export { Sentry };
