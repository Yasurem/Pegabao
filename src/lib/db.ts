import { Pool, type QueryResultRow } from "pg";

// Singleton: Next.js hot-reload re-evaluates modules in dev, so reuse one
// pool across reloads to avoid exhausting database connections.
const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  return new Pool({
    connectionString,
    // Hosted Postgres (Supabase) requires TLS but uses a cert chain that
    // node-postgres won't verify by default — opt out of verification when
    // the URL asks for SSL. Local connections stay non-SSL.
    ssl: connectionString?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params as never[]);
}
