/**
 * @file middleware/requestLogger.ts
 * @description HTTP request/response logger using pino-http.
 *
 * Previously used Morgan (plain-text). Replaced with pino-http so all
 * HTTP logs are structured JSON in production, matching the service logs
 * from utils/logger.ts, and can be shipped to Datadog / CloudWatch / Logtail.
 */

import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

export const requestLogger = pinoHttp({
  // Share the same Pino instance so HTTP and service logs are interleaved
  // with the same configuration (level, redaction, transport).
  logger,

  // Customise the log level per status code.
  customLogLevel(_req, res, err) {
    if (err != null || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Strip noisy health-check polling from the log stream.
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/v1/health',
  },

  // Keep the serialised request object small.
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
