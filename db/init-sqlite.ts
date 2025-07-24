import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema-sqlite';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const sqlite = new Database('./dev.db');
const db = drizzle(sqlite, { schema });

// Run migrations
migrate(db, { migrationsFolder: './db/migrations' });

console.log('SQLite database initialized successfully!');
sqlite.close(); 