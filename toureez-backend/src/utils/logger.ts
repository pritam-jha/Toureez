/**
 * @file utils/logger.ts
 * @description Shared Pino logger instance for the entire backend.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info({ userId }, 'User created');
 *   logger.error({ err }, 'DB query failed');
 *
 * Outputs JSON in production (ready for Datadog / CloudWatch / Logtail).
 * Outputs pretty-printed coloured text in development via pino-pretty.
 *
 * Environment variables:
 *   LOG_LEVEL  — pino log level (trace|debug|info|warn|error|fatal). Default: 'info'.
 *   NODE_ENV   — 'production' enables JSON mode; anything else uses pino-pretty.
 */

import pino from 'pino';

const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
const level = process.env.LOG_LEVEL ?? 'info';

export const logger = pino(
  {
    level,
    // Add a timestamp in ISO-8601 format to every log line.
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields from logs before they leave the process.
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      censor: '[REDACTED]',
    },
    // Consistent base fields on every log record.
    base: { service: 'toureez-backend' },
  },
  isProduction
    ? undefined // plain JSON to stdout — let your log shipper handle it
    : pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,service',
        },
      }),
);
