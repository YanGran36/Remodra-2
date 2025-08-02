-- 🗄️ Remodra Neon Database Setup Script
-- Run this in your Neon database console

-- Create contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    role VARCHAR(50) DEFAULT 'contractor',
    plan VARCHAR(50) DEFAULT 'basic',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'active',
    plan_start_date BIGINT,
    plan_end_date BIGINT,
    current_client_count INTEGER DEFAULT 0,
    ai_usage_this_month INTEGER DEFAULT 0,
    ai_usage_reset_date BIGINT,
    settings JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    budget DECIMAL(10,2),
    start_date BIGINT,
    end_date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Create estimates table
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    valid_until BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    due_date BIGINT,
    paid_date BIGINT,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time BIGINT NOT NULL,
    end_time BIGINT,
    location VARCHAR(255),
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50),
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Insert test contractor (business plan)
INSERT INTO contractors (
    email, 
    password, 
    username, 
    first_name, 
    last_name, 
    company_name, 
    phone, 
    address, 
    city, 
    state, 
    zip, 
    country, 
    role, 
    plan, 
    subscription_status, 
    created_at, 
    updated_at
) VALUES (
    'test@remodra.com',
    'b5aaf5a25213238fedccac4601fb934016797a773a8b44b7c227a09218de822fc1fd7bac4be962a1a397f99ac707ab1a7db21c4d5f4ad144707626fe8d068279.b0e434eecad3396e40d5901b1fcf92a8',
    'testuser',
    'Test',
    'User',
    'Test Company',
    '(555) 123-4567',
    '123 Test St',
    'Test City',
    'TS',
    '12345',
    'USA',
    'contractor',
    'business',
    'active',
    EXTRACT(EPOCH FROM NOW()) * 1000,
    EXTRACT(EPOCH FROM NOW()) * 1000
) ON CONFLICT (email) DO NOTHING;

-- Insert test clients
INSERT INTO clients (
    contractor_id,
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    created_at,
    updated_at
) VALUES 
(1, 'Sarah', 'Johnson', 'sarah.johnson@example.com', '(555) 123-4567', '1234 Oak Street', 'Springfield', 'IL', '62701', EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
(1, 'Mark', 'Taylor', 'mtaylor@example.com', '(555) 456-7890', '567 Maple Drive', 'Springfield', 'IL', '62701', EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT DO NOTHING;

-- Insert test projects
INSERT INTO projects (
    contractor_id,
    client_id,
    title,
    description,
    status,
    budget,
    created_at,
    updated_at
) VALUES 
(1, 1, 'Kitchen Remodel', 'Complete kitchen renovation project', 'in-progress', 25000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
(1, 2, 'Bathroom Update', 'Master bathroom renovation', 'planning', 15000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
(1, 1, 'Deck Construction', 'New outdoor deck and patio', 'completed', 8000, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contractors_email ON contractors(email);
CREATE INDEX IF NOT EXISTS idx_clients_contractor_id ON clients(contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_estimates_contractor_id ON estimates(contractor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contractor_id ON invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_events_contractor_id ON events(contractor_id);
CREATE INDEX IF NOT EXISTS idx_materials_contractor_id ON materials(contractor_id);

echo "✅ Database setup complete!"
echo "📊 Tables created and test data inserted"
echo "🔑 Test login: test@remodra.com / test123" 