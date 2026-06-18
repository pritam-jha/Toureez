import 'dotenv/config';
import { runStartupChecks } from './startup-checks';
runStartupChecks(); // exits the process if required env vars are missing
import { initialiseSentry, Sentry } from './lib/sentry';
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

// Sentry events are sent asynchronously over HTTP — process.exit() right
// after capture would kill the process before the request leaves, so flush
// (bounded by a timeout) before exiting.
const reportFatalAndExit = (err: unknown): void => {
  Sentry.captureException(err);
  void Sentry.flush(2000).finally(() => process.exit(1));
};

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  reportFatalAndExit(reason);
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  reportFatalAndExit(error);
});
