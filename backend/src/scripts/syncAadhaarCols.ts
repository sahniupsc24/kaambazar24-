import { AppDataSource } from '../config/data-source';

async function main() {
  await AppDataSource.initialize();
  console.log('Database connected.');
  await AppDataSource.query(`
    ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS "aadhaarFrontUrl" text;
    ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS "aadhaarBackUrl" text;
    ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS "aadhaarStatus" varchar(20) DEFAULT 'UNSUBMITTED';
    ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS "aadhaarSubmittedAt" timestamptz;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarUrl" text;
  `);
  console.log('Successfully added Aadhaar columns to worker_profiles table.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
