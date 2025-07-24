import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Use SQLite for local development, PostgreSQL for production
const isLocalDev = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL.includes('sqlite');

export default defineConfig({
  out: "./db/migrations",
  schema: isLocalDev ? "./shared/schema-sqlite.ts" : "./shared/schema.ts",
  dialect: isLocalDev ? "sqlite" : "postgresql",
  dbCredentials: isLocalDev ? {
    url: process.env.DATABASE_URL.replace('sqlite://', ''),
  } : {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
});
