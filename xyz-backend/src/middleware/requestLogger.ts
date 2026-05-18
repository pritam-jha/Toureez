import morgan from 'morgan';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Morgan request logger configured for concise development logs and rich production logs.
 */
export const requestLogger = morgan(isProduction ? 'combined' : 'dev');
