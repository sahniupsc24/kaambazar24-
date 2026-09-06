import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { createApp } from './app';
import { env } from './config/env';
import { autoSeedOnStartup } from './scripts/autoSeed';

async function main() {
  try {
    await AppDataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Database connection established.');

    // Auto-run pending database migrations in production
    try {
      // eslint-disable-next-line no-console
      console.log('Running database migrations...');
      await AppDataSource.runMigrations();
      // eslint-disable-next-line no-console
      console.log('Database migrations completed.');
    } catch (migErr) {
      // eslint-disable-next-line no-console
      console.warn('Migration warning (continuing to seed & start server):', (migErr as Error)?.message || migErr);
    }

    // Auto-seed default Admin, Plans, Categories, and Locations
    await autoSeedOnStartup();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Kaam Bazar API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main();
