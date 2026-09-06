import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { createApp } from './app';
import { env } from './config/env';

async function main() {
  try {
    await AppDataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Database connection established.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Kaam Bazar API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main();
