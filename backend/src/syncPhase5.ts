import 'reflect-metadata';
import { AppDataSource } from './config/data-source';

async function syncPhase5() {
  console.log('Initializing database connection...');
  try {
    await AppDataSource.initialize();
    console.log('Database connected!');
    
    // We are syncing the schema for Phase 5.
    // In production, migrations should be used. This is safe for dev since synchronize: false in data-source.
    // We will just run synchronize explicitly here to add the new tables/columns.
    await AppDataSource.synchronize(false);
    console.log('Phase 5 schema sync complete: Messages, Disputes, and WorkEntry GPS fields added.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during schema sync:', error);
    process.exit(1);
  }
}

syncPhase5();
