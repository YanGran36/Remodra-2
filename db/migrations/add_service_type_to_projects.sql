-- Add service_type column to projects table
ALTER TABLE projects ADD COLUMN service_type TEXT DEFAULT 'fence';

-- Update existing projects to have a default service type
UPDATE projects SET service_type = 'fence' WHERE service_type IS NULL; 