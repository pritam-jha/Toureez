import 'dotenv/config';
import { app } from './app';
import { config } from './config';

const port = config.PORT;

const server = app.listen(port, () => {
  console.log(`XYZ API server listening on port ${port}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`${signal} received. Closing HTTP server.`);

  server.close((error) => {
    if (error !== undefined) {
      console.error('Error while closing HTTP server', error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error);
  process.exit(1);
});
