import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema-sqlite';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql } from 'drizzle-orm';

const sqlite = new Database('./dev.db');
const db = drizzle(sqlite, { schema });

// Create all tables
async function setupDatabase() {
  try {
    // Use the introspect function to create tables
    await db.run(sql`CREATE TABLE IF NOT EXISTS contractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      phone TEXT,
      website TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      country TEXT DEFAULT 'USA',
      role TEXT DEFAULT 'contractor' NOT NULL,
      plan TEXT DEFAULT 'basic' NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT DEFAULT 'active' NOT NULL,
      plan_start_date INTEGER,
      plan_end_date INTEGER,
      current_client_count INTEGER DEFAULT 0 NOT NULL,
      ai_usage_this_month INTEGER DEFAULT 0 NOT NULL,
      ai_usage_reset_date INTEGER NOT NULL,
      settings TEXT DEFAULT '{}',
      language TEXT DEFAULT 'en' NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      notes TEXT,
      cancellation_history TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' NOT NULL,
      start_date INTEGER,
      end_date INTEGER,
      budget REAL,
      notes TEXT,
      worker_instructions TEXT,
      worker_notes TEXT,
      materials_needed TEXT DEFAULT '[]',
      safety_requirements TEXT,
      ai_project_summary TEXT,
      ai_analysis TEXT DEFAULT '{}',
      ai_generated_description TEXT,
      ai_sharing_settings TEXT DEFAULT '{"installers": false, "clients": true, "estimators": true}',
      last_ai_update INTEGER,
      position INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      project_id INTEGER,
      agent_id INTEGER,
      estimate_number TEXT NOT NULL,
      issue_date INTEGER NOT NULL,
      expiry_date INTEGER,
      status TEXT DEFAULT 'draft' NOT NULL,
      estimate_type TEXT DEFAULT 'agent' NOT NULL,
      appointment_date INTEGER,
      appointment_duration INTEGER DEFAULT 60,
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0 NOT NULL,
      discount REAL DEFAULT 0 NOT NULL,
      total REAL NOT NULL,
      terms TEXT,
      notes TEXT,
      client_signature TEXT,
      contractor_signature TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS estimate_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (estimate_id) REFERENCES estimates(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      project_id INTEGER,
      estimate_id INTEGER,
      invoice_number TEXT NOT NULL,
      issue_date INTEGER NOT NULL,
      due_date INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0 NOT NULL,
      discount REAL DEFAULT 0 NOT NULL,
      total REAL NOT NULL,
      amount_paid REAL DEFAULT 0 NOT NULL,
      terms TEXT,
      notes TEXT,
      client_signature TEXT,
      contractor_signature TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      client_id INTEGER,
      project_id INTEGER,
      agent_id INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      project_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      unit TEXT NOT NULL,
      cost REAL NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      employee_id TEXT,
      role TEXT DEFAULT 'field_agent' NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      specialties TEXT DEFAULT '[]',
      color_code TEXT DEFAULT '#3B82F6',
      hourly_rate REAL,
      commission_rate REAL,
      hire_date INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS session (
      sid TEXT PRIMARY KEY NOT NULL,
      sess BLOB NOT NULL,
      expire INTEGER NOT NULL
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      estimate_id INTEGER,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      scheduled_date INTEGER NOT NULL,
      completed_date INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      criteria TEXT NOT NULL,
      points INTEGER DEFAULT 0 NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS contractor_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      earned_at INTEGER NOT NULL,
      progress INTEGER DEFAULT 0 NOT NULL,
      is_completed INTEGER DEFAULT 0 NOT NULL,
      notified INTEGER DEFAULT 0 NOT NULL,
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS achievement_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      achievement_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      value REAL NOT NULL,
      duration INTEGER,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS contractor_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_activity_date INTEGER NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      next_level_xp INTEGER NOT NULL DEFAULT 100,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS timeclock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      employee_name TEXT NOT NULL,
      job_type TEXT,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      clock_in_entry_id INTEGER,
      hours_worked TEXT,
      viewer_role TEXT DEFAULT 'all',
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS client_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'sent' NOT NULL,
      sent_at INTEGER NOT NULL,
      read_at INTEGER,
      FOREIGN KEY (contractor_id) REFERENCES contractors(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS client_portal_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      client_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS message_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      message_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      reply TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES client_messages(id),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      feature TEXT NOT NULL,
      tokens_used INTEGER NOT NULL,
      cost REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      interval TEXT NOT NULL,
      features TEXT NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS service_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      labor_rate REAL NOT NULL,
      unit TEXT DEFAULT 'ft' NOT NULL,
      labor_calculation_method TEXT DEFAULT 'by_length' NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contractor_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
      FOREIGN KEY (contractor_id) REFERENCES contractors(id)
    )`);

    await db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY NOT NULL,
      sess BLOB NOT NULL,
      expire INTEGER NOT NULL
    )`);

    console.log('SQLite database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    sqlite.close();
  }
}

setupDatabase(); 