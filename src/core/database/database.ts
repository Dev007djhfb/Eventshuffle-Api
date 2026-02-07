import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const createDatabaseConnection = (connectionString?: string) => {
  const pool = new Pool({
    connectionString:
      connectionString ||
      `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'eventshuffle'}`,
  });

  return drizzle(pool, { schema });
};

export type Database = ReturnType<typeof createDatabaseConnection>;
export { schema };
