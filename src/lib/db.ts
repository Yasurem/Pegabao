import { Pool, type QueryResultRow } from "pg";

// Singleton: Next.js hot-reload re-evaluates modules in dev, so reuse one
// pool across reloads to avoid exhausting database connections.
const globalForDb = globalThis as unknown as { pool?: Pool };

// A local database connection (used in dev) needs no TLS; a hosted one
// (Supabase, used in production) requires it.
function isLocalConnection(connectionString?: string) {
  if (!connectionString) return true;
  try {
    const host = new URL(connectionString).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return (
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1")
    );
  }
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  return new Pool({
    connectionString,
    // Enable TLS for any non-local host (e.g. Supabase) regardless of whether
    // the URL carries sslmode=require. Supabase uses a cert chain node-postgres
    // won't verify by default, so opt out of verification.
    ssl: isLocalConnection(connectionString)
      ? undefined
      : { rejectUnauthorized: false },
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
