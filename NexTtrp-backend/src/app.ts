import compression from 'compression';
import cors, { type CorsOptions } from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import { AppError, ERROR_MESSAGES } from './constants/errors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiV1Router } from './routes';
import { notFound } from './utils/response';

const parseAllowedOrigins = (): string[] => {
  const rawOrigins = process.env.ALLOWED_ORIGINS;

  if (rawOrigins === undefined || rawOrigins.trim() === '') {
    return [];
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const allowedOrigins = parseAllowedOrigins();
const isDevelopment = (process.env.NODE_ENV ?? 'development') === 'development';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // In development, allow all origins so Expo Go on physical devices
    // (which sends exp://LAN_IP:PORT origins) is never blocked.
    if (isDevelopment) {
      callback(null, true);
      return;
    }

    // In production, undefined origin = same-origin / server-to-server — allow.
    if (origin === undefined) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError(ERROR_MESSAGES.CORS_NOT_ALLOWED, 403));
  },
};

/**
 * Express application configured with security, logging, CORS, routes, and global error handling.
 */
export const app = express();

// Trust the first proxy hop so express-rate-limit and IP logging work correctly
// behind Nginx, Railway, Render, Fly.io, or any reverse proxy.
app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(compression());
app.use(helmet());
app.use(cors(corsOptions));

// Attach a unique correlation ID to every request for distributed tracing.
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (Array.isArray(req.headers['x-request-id'])
      ? req.headers['x-request-id'][0]
      : req.headers['x-request-id']) ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);
  // Expose on req so route handlers and services can include it in logs.
  (req as Request & { requestId: string }).requestId = requestId;
  next();
});

// Razorpay webhook needs the raw request body for signature verification,
// so it must be excluded from JSON body parsing.
const jsonParser = express.json({ limit: '512kb' });
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/v1/payments/webhook/razorpay') {
    return next();
  }
  return jsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '512kb' }));
app.use(requestLogger);

app.use('/api/v1', apiV1Router);

app.use((req, res, next) => {
  try {
    return notFound(res, `Route ${req.method} ${req.originalUrl}`);
  } catch (caughtError) {
    return next(caughtError);
  }
});

app.use(errorHandler);
