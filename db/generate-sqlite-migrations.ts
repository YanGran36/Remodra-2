import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../shared/schema-sqlite';

// Create a temporary database for migration generation
const sqlite = new Database(':memory:');
const db = drizzle(sqlite, { schema });

// This will create the tables in memory and generate migration files
// The actual migration files will be created by drizzle-kit
console.log('SQLite schema loaded successfully!');
console.log('Run "npx drizzle-kit generate" to generate migration files');

sqlite.close(); 