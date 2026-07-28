-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Employees Table
CREATE TABLE employees (
    id VARCHAR(255) PRIMARY KEY, -- Clerk User ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    data_ai_hint TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id VARCHAR(255) REFERENCES employees(id) ON DELETE SET NULL,
    leave_history TEXT
);

-- Leave Types Table
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- Leave Policies Table (linking roles to leave types and days)
CREATE TABLE leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    days_allowed INT NOT NULL CHECK (days_allowed >= 0),
    UNIQUE(role_id, leave_type_id)
);

-- Leave Balances Table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    balance INT NOT NULL,
    UNIQUE(employee_id, leave_type_id)
);

-- Leave Requests Table
CREATE TABLE leave_requests (
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
CREATE TABLE carry_forward_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE UNIQUE,
    max_days INT NOT NULL,
    expiry_months INT NOT NULL
);

-- Payroll Components Table
CREATE TABLE payroll_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Earning' or 'Deduction'
    description TEXT
);

-- Employee Payroll Settings Table
CREATE TABLE employee_payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES payroll_components(id) ON DELETE CASCADE,
    value DECIMAL(10, 2) NOT NULL,
    UNIQUE(employee_id, component_id)
);

-- Payslips Table
CREATE TABLE payslips (
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

-- Screen Permissions Table
CREATE TABLE screen_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route VARCHAR(255) NOT NULL,
    permission_type VARCHAR(50) NOT NULL, -- 'employee', 'department', or 'role'
    target_id VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    UNIQUE(route, permission_type, target_id)
);
