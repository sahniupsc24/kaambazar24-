import 'reflect-metadata';
import { AppDataSource } from './config/data-source';

async function fixAndSync() {
  console.log('Initializing database connection...');
  try {
    await AppDataSource.initialize();
    console.log('Database connected!');
    
    console.log('Dropping database schema to clear enum conflicts...');
    await AppDataSource.dropDatabase();
    
    console.log('Synchronizing new schema...');
    await AppDataSource.synchronize(false);

    console.log('Phase 5 schema sync complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during schema sync:', error);
    process.exit(1);
  }
}

fixAndSync();
