import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __electionPool__: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const useSsl =
    process.env.PGSSLMODE !== "disable" &&
    (process.env.NODE_ENV === "production" || Boolean(connectionString));

  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined
    });
  }

  return new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || process.env.USER,
    password: process.env.PGPASSWORD || undefined,
    database: process.env.PGDATABASE || "tn_election_2026",
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  });
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  const existingPool = global.__electionPool__;

  if (existingPool) {
    return existingPool;
  }

  const pool = createPool();

  if (process.env.NODE_ENV !== "production") {
    global.__electionPool__ = pool;
  }

  return pool;
}
