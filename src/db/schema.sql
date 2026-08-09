-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    sign_in_time VARCHAR(50) DEFAULT '09:00',
    grace_time_minutes INT DEFAULT 15,
    business_address TEXT DEFAULT '100 Tech Park Way, San Francisco, CA 94105',
    business_latitude NUMERIC(10, 7) DEFAULT 37.7749,
    business_longitude NUMERIC(10, 7) DEFAULT -122.4194,
    allowed_radius_meters INT DEFAULT 500
);

-- Ensure department columns exist on existing tables
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sign_in_time VARCHAR(50) DEFAULT '09:00';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS grace_time_minutes INT DEFAULT 15;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT '100 Tech Park Way, San Francisco, CA 94105';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS business_latitude NUMERIC(10, 7) DEFAULT 37.7749;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS business_longitude NUMERIC(10, 7) DEFAULT -122.4194;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS allowed_radius_meters INT DEFAULT 500;

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(255) PRIMARY KEY, -- Clerk User ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    data_ai_hint TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id VARCHAR(255) REFERENCES employees(id) ON DELETE SET NULL,
    leave_history TEXT,
    last_carry_forward_year INT,
    employee_id VARCHAR(255),
    phone_number VARCHAR(255),
    emergency_contact_number VARCHAR(255),
    blood_group VARCHAR(50)
);

-- Ensure employee columns exist on existing tables
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_carry_forward_year INT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(50);

-- Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL
);

-- Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- Leave Policies Table (linking roles to leave types and days)
CREATE TABLE IF NOT EXISTS leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    days_allowed INT NOT NULL CHECK (days_allowed >= 0),
    UNIQUE(role_id, leave_type_id)
);

-- Leave Balances Table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    balance INT NOT NULL,
    UNIQUE(employee_id, leave_type_id)
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    manager_id VARCHAR(255) REFERENCES employees(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days numeric(12,2) NOT NULL,
    reason TEXT,
    isFirstDayHalf boolean,
    isLastDayHalf boolean,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carry Forward Policies Table
CREATE TABLE IF NOT EXISTS carry_forward_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE UNIQUE,
    max_days INT NOT NULL,
    expiry_months INT NOT NULL
);

-- Payroll Components Table
CREATE TABLE IF NOT EXISTS payroll_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Earning' or 'Deduction'
    description TEXT
);

-- Employee Payroll Settings Table
CREATE TABLE IF NOT EXISTS employee_payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES payroll_components(id) ON DELETE CASCADE,
    value DECIMAL(10, 2) NOT NULL,
    UNIQUE(employee_id, component_id)
);

-- Statutory Payroll Settings Table
CREATE TABLE IF NOT EXISTS statutory_payroll_settings (
    id INT PRIMARY KEY DEFAULT 1,
    rules_json JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payslips Table
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_earnings DECIMAL(10, 2) NOT NULL,
    total_deductions DECIMAL(10, 2) NOT NULL,
    net_pay DECIMAL(10, 2) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    punch_in_time TIMESTAMP WITH TIME ZONE,
    punch_out_time TIMESTAMP WITH TIME ZONE,
    punch_in_lat NUMERIC(10, 7),
    punch_in_lng NUMERIC(10, 7),
    punch_in_photo TEXT,
    distance_meters NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PUNCHED_IN',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Screen Permissions Table
CREATE TABLE IF NOT EXISTS screen_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route VARCHAR(255) NOT NULL,
    permission_type VARCHAR(50) NOT NULL, -- 'employee', 'department', or 'role'
    target_id VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    UNIQUE(route, permission_type, target_id)
);

