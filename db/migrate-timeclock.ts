import { db } from "./index";
import { sql } from "drizzle-orm";

export async function migrateTimeclock() {
  try {
    // Add job_type column to existing timeclock_entries table
    await db.run(sql`ALTER TABLE timeclock_entries ADD COLUMN job_type TEXT`);
    console.log("✅ job_type column added to timeclock_entries table successfully");
  } catch (error) {
    console.error("❌ Error adding job_type column to timeclock_entries table:", error);
  }

  try {
    // Add viewer_role column for access control
    await db.run(sql`ALTER TABLE timeclock_entries ADD COLUMN viewer_role TEXT DEFAULT 'all'`);
    console.log("✅ viewer_role column added to timeclock_entries table successfully");
  } catch (error) {
    console.error("❌ Error adding viewer_role column to timeclock_entries table:", error);
  }
}

migrateTimeclock().catch(console.error);
