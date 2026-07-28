import { Pool } from 'pg';

let db: Pool | undefined;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Only initialize the pool if the connection string is available
if (connectionString) {
  try {
    db = new Pool({
      connectionString,
    });

    db.on('error', (err) => {
      console.warn('Unexpected error on idle PG client:', err.message);
    });
  } catch (err) {
    console.warn('Failed to initialize Postgres Pool — fallback to mock data');
  }
}

// Export `db`. It will be undefined if POSTGRES_URL / DATABASE_URL is not set or failed to connect.
// The data access functions in `data.ts` are responsible for handling this case.
export { db };
