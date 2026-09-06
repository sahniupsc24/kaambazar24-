import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import * as entities from '../entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  // SSL is required on Railway/cloud Postgres. Disabled for local dev.
  ssl: (env.db as any).ssl ? { rejectUnauthorized: false } : false,
  // Migrations only — never true in any environment. Schema changes must
  // go through the migrations/ directory (spec rule 35/36).
  synchronize: false,
  logging: env.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  entities: Object.values(entities).filter(
    (e) => typeof e === 'function'
  ) as any[],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  subscribers: [],
});

