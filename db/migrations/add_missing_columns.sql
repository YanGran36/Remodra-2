-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN service_type TEXT DEFAULT 'fence';

-- Add missing columns to estimates table  
ALTER TABLE estimates ADD COLUMN service_type TEXT DEFAULT 'fence';

-- Add missing columns to timeclock_entries table
ALTER TABLE timeclock_entries ADD COLUMN employee_name TEXT;
ALTER TABLE timeclock_entries ADD COLUMN job_type TEXT;
ALTER TABLE timeclock_entries ADD COLUMN viewer_role TEXT DEFAULT 'all'; 