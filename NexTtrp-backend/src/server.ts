import 'dotenv/config';
import { initialiseSentry } from './lib/sentry';
initialiseSentry(); // must be first so all downstream errors are captured
import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const port = config.PORT;

const server = app.listen(port, () => {
  logger.info({ port }, `${config.APP_NAME} server listening`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info({ signal }, 'Signal received — closing HTTP server');

  server.close((error) => {
    if (error !== undefined) {
      logger.error({ err: error }, 'Error while closing HTTP server');
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});
