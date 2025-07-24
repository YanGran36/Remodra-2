import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "../shared/schema";
import * as sqliteSchema from "../shared/schema-sqlite";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use SQLite for local development, Neon for production
const isLocalDev = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL.includes('sqlite');

let db: any;
let pool: any;

if (isLocalDev) {
  // SQLite setup for local development
  const sqlite = new Database(process.env.DATABASE_URL.replace('sqlite://', ''));
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
  pool = null; // Not needed for SQLite
} else {
  // Neon setup for production
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };