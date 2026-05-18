import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
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

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
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
