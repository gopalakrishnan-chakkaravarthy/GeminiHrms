import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

function createPool(): Pool | undefined {
  if (!connectionString) return undefined;
  try {
    const pool = new Pool({ connectionString });
    pool.on('error', (err) => {
      console.warn('Unexpected error on idle PG client:', err.message);
    });
    return pool;
  } catch (err) {
    console.warn('Failed to initialize Postgres Pool — fallback to mock data');
    return undefined;
  }
}

// `db` is a const — TypeScript can narrow Pool | undefined across module boundaries.
// It will be undefined if POSTGRES_URL / DATABASE_URL is not set or the pool failed to init.
export const db = createPool();
