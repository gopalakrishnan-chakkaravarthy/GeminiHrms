import { db } from "./db";
import { unstable_noStore as noStore } from "next/cache";
import * as mock from "./mock-data";
import { format } from "date-fns";
import {
  DEFAULT_STATUTORY_RULES,
  calculateStatutoryBreakdown,
  type StatutoryRules,
  type StatutoryCalculationResult,
} from "./statutory";

// --- CONSTANTS ---
export const APP_ROUTES = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dashboard/manager", label: "Manager View" },
  { path: "/dashboard/calendar", label: "Calendar" },
  { path: "/dashboard/admin", label: "Admin Panel" },
  { path: "/dashboard/admin/employees", label: "Employees" },
  { path: "/dashboard/admin/departments", label: "Departments" },
  { path: "/dashboard/admin/roles", label: "Roles" },
  { path: "/dashboard/admin/reports", label: "Reports" },
  { path: "/dashboard/admin/leave-types", label: "Leave Types" },
  { path: "/dashboard/admin/leave-groups", label: "Leave Policies" },
  { path: "/dashboard/admin/carry-forward", label: "Carry-Forward" },
  { path: "/dashboard/admin/payroll", label: "Payroll" },
  { path: "/dashboard/admin/payroll/components", label: "Payroll Components" },
  { path: "/dashboard/admin/payroll/settings", label: "Payroll Settings" },
  { path: "/dashboard/admin/payroll/statutory", label: "Statutory Rules (PF, ESI, TDS)" },
  { path: "/dashboard/admin/payroll/run", label: "Run Payroll" },
  { path: "/dashboard/admin/payroll/payslips", label: "Payslips" },
  { path: "/dashboard/admin/permissions", label: "Screen Permissions" },
];

export function getAppRoutes() {
  return APP_ROUTES;
}

// --- TYPE DEFINITIONS ---
export type Role = {
  id: string;
  name: string;
};

export type Department = {
  id: string;
  name: string;
  signInTime?: string;
  graceTimeMinutes?: number;
  businessAddress?: string;
  businessLatitude?: number;
  businessLongitude?: number;
  allowedRadiusMeters?: number;
};

export type AttendanceLog = mock.AttendanceLog;

export type LeaveType = {
  id: string;
  name: string;
  description: string;
};

export type Holiday = {
  id: string;
  name: string;
  date: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  dataAiHint: string;
  roleId: string | null;
  roleName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  managerId: string | null;
  leaveHistory: string;
  lastCarryForwardYear: number | null;
  employeeId: string | null;
  phoneNumber: string | null;
  emergencyContactNumber: string | null;
  bloodGroup: string | null;
};

export type Employee = {
  id: string; // Clerk ID
  name: string;
  email: string;
  avatarUrl: string;
  roleId: string;
  roleName: string;
  departmentId: string;
  departmentName: string;
  managerId: string | null;
  lastCarryForwardYear: number | null;
  employeeId: string | null;
  phoneNumber: string | null;
  emergencyContactNumber: string | null;
  bloodGroup: string | null;
};

export type LeaveBalance = {
  leaveType: string;
  balance: number;
  icon: "Plane" | "HeartPulse" | "User";
};

export type LeaveRequest = {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  employeeAvatar: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason: string | null;
  managerId: string | null;
};

export type PopulatedLeaveGroup = {
  id: string;
  roleName: string;
  leaveTypeName: string;
  daysAllowed: number;
};

export type PopulatedCarryForwardPolicy = {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  maxDays: number;
  expiryMonths: number;
};

export type ReportDataPoint = {
  period: string;
  requests: number;
};

export type AdminDashboardStats = {
  employeeCount: number;
  departmentCount: number;
  roleCount: number;
  pendingRequestsCount: number;
};

export type PayrollComponent = {
  id: string;
  name: string;
  type: "Earning" | "Deduction";
  description: string;
};

export type PopulatedEmployeePayrollSetting = {
  id: string;
  employeeName: string;
  componentName: string;
  componentType: "Earning" | "Deduction";
  value: number;
};

export type PayslipDetailsItem = {
  name: string;
  type: "Earning" | "Deduction";
  value: number;
};

export type PopulatedPayslip = {
  id: string;
  employeeId?: string;
  employeeName: string;
  employeeEmail?: string;
  departmentName: string;
  roleName: string;
  payPeriod: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status?: string;
  details: PayslipDetailsItem[];
  createdAt: Date;
};

export type PopulatedPayslipSummary = {
  id: string;
  employeeId?: string;
  employeeName: string;
  employeeEmail?: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  grossEarnings?: number;
  totalDeductions?: number;
  netPay: number;
  status?: string;
  createdAt: Date;
};

export type RouteInfo = {
  path: string;
  label: string;
};

export type ScreenPermission = {
  id: string;
  route: string;
  permission_type: "employee" | "department" | "role";
  target_id: string;
  is_default: boolean;
};

export type PopulatedScreenPermission = {
  id: string;
  route: string;
  permissionType: "employee" | "department" | "role";
  targetId: string;
  targetName: string;
  isDefault: boolean;
};

// --- HELPER FOR NEXT.JS RSC SERIALIZATION ---
function toPlain<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

export async function getFallbackUserId(): Promise<string> {
  if (!db) return mock.currentUser.id;
  try {
    const data = await db.query(`SELECT id FROM employees ORDER BY created_at ASC LIMIT 1`);
    if (data.rows.length > 0) return data.rows[0].id;
  } catch {
    // fallback
  }
  return "emp-101";
}

// --- USER & EMPLOYEE FUNCTIONS ---

export async function getAppUser(userId: string): Promise<User | null> {
  if (!userId) return null;
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getAppUser");
    if (mock.currentUser.id === userId || true) {
      return toPlain({
        ...mock.currentUser,
        employeeId: mock.currentUser.employeeId || null,
        phoneNumber: mock.currentUser.phoneNumber || null,
        emergencyContactNumber: mock.currentUser.emergencyContactNumber || null,
        bloodGroup: mock.currentUser.bloodGroup || null,
      });
    }
    return null;
  }
  noStore();
  try {
    const data = await db.query(
      `
      SELECT 
        e.id, 
        e.name, 
        e.email, 
        e.avatar_url AS "avatarUrl", 
        e.data_ai_hint AS "dataAiHint", 
        r.id as "roleId",
        r.name as "roleName",
        d.id as "departmentId",
        d.name as "departmentName",
        e.manager_id as "managerId",
        e.leave_history as "leaveHistory",
        e.last_carry_forward_year as "lastCarryForwardYear",
        e.employee_id as "employeeId",
        e.phone_number as "phoneNumber",
        e.emergency_contact_number as "emergencyContactNumber",
        e.blood_group as "bloodGroup"
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `,
      [userId],
    );

    if (data.rows.length === 0) {
      console.warn(
        `No employee profile found in DB for Clerk user ID: ${userId}`,
      );
      return null;
    }

    return toPlain(data.rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

export async function getEmployees(): Promise<Employee[]> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getEmployees");
    return toPlain(mock.allEmployees);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.email,
                e.avatar_url as "avatarUrl",
                e.role_id as "roleId",
                COALESCE(r.name, 'No Role') as "roleName",
                e.department_id as "departmentId",
                COALESCE(d.name, 'No Department') as "departmentName",
                e.manager_id as "managerId",
                m.name as "managerName",
                e.last_carry_forward_year as "lastCarryForwardYear",
                e.employee_id as "employeeId",
                e.phone_number as "phoneNumber",
                e.emergency_contact_number as "emergencyContactNumber",
                e.blood_group as "bloodGroup"
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN employees m ON e.manager_id = m.id
            ORDER BY e.name
        `);
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

// --- LEAVE & POLICY FUNCTIONS ---

export async function getLeaveBalances(
  userId: string,
): Promise<LeaveBalance[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getLeaveBalances",
    );
    if (userId === mock.currentUser.id || true) {
      return toPlain([
        {
          leaveType: "Vacation",
          balance: mock.leaveBalances.vacation,
          icon: "Plane",
        },
        {
          leaveType: "Sick Leave",
          balance: mock.leaveBalances.sick,
          icon: "HeartPulse",
        },
        {
          leaveType: "Personal Day",
          balance: mock.leaveBalances.personal,
          icon: "User",
        },
      ]);
    }
    return [];
  }

  noStore();
  try {
    const data = await db.query(
      `SELECT lt.name as "leaveType", lp.days_allowed - COALESCE((SELECT SUM(days) FROM LEAVE_REQUESTS 
        WHERE EMPLOYEE_ID = ee.id AND leave_type_id = lp.leave_type_id AND status = 'Approved' ), 0) as "balance" 
      FROM leave_policies lp
      JOIN employees ee ON lp.role_id = ee.role_id
      JOIN leave_types lt ON lt.id = lp.leave_type_id
      WHERE ee.id = $1
      `,
      [userId],
    );

    const iconMap: { [key: string]: LeaveBalance["icon"] } = {
      Vacation: "Plane",
      "Sick Leave": "HeartPulse",
      "Personal Day": "User",
    };

    const formatted = data.rows.map((row) => ({
      ...row,
      balance: parseFloat(row.balance || 0),
      icon: iconMap[row.leaveType] || "User",
    }));
    return toPlain(formatted);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

async function getLeaveRequests(
  whereClause: string,
  params: any[],
): Promise<LeaveRequest[]> {
  noStore();
  try {
    const query = `
      SELECT 
        lr.id, 
        COALESCE(e.name, 'Former Employee') as "employeeName", 
        COALESCE(e.email, '') as "employeeEmail", 
        lr.employee_id as "employeeId", 
        COALESCE(e.avatar_url, '') as "employeeAvatar", 
        COALESCE(lt.name, 'Leave') as "leaveType", 
        TO_CHAR(lr.start_date, 'YYYY-MM-DD') as "startDate", 
        TO_CHAR(lr.end_date, 'YYYY-MM-DD') as "endDate", 
        lr.days, 
        COALESCE(lr.reason, '') as reason, 
        lr.status,
        lr.rejection_reason as "rejectionReason",
        lr.manager_id as "managerId"
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      ${whereClause}
      ORDER BY lr.start_date DESC
    `;
    const data = await db.query(query, params);
    const mapped = data.rows.map((row) => ({
      ...row,
      days: parseFloat(row.days || 0),
      employeeName: row.employeeName || 'Former Employee',
    }));
    return toPlain(mapped);
  } catch (error) {
    console.error("Database Error getting leave requests:", error);
    return [];
  }
}

export async function getAllLeaveRequests(
  status?: "Approved",
): Promise<LeaveRequest[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getAllLeaveRequests",
    );
    return []; //mock.allLeaveRequests;
  }
  if (status) {
    return getLeaveRequests("WHERE lr.status = $1", [status]);
  }
  return getLeaveRequests("", []);
}

export async function getLeaveRequestsForCurrentUser(
  userId: string,
): Promise<LeaveRequest[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getLeaveRequestsForCurrentUser",
    );
    return [];
  }
  return getLeaveRequests("WHERE lr.employee_id = $1", [userId]);
}

export async function getLeaveRequestsForManager(
  managerId: string,
): Promise<LeaveRequest[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getLeaveRequestsForManager",
    );
    return [];
  }
  return getLeaveRequests(
    "WHERE lr.manager_id = $1 OR lr.employee_id IN (SELECT id FROM employees WHERE manager_id = $1)",
    [managerId]
  );
}

export async function getHolidays(year: number): Promise<Holiday[]> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getHolidays");
    return toPlain(mock.allHolidays);
  }
  noStore();
  try {
    const data = await db.query(
      `SELECT id, name, date FROM holidays WHERE EXTRACT(YEAR FROM date) = $1 ORDER BY date`,
      [year],
    );
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error getting holidays:", error);
    if (error instanceof Error && (error as any).code === "42P01") {
      console.log("Holidays table not found, attempting to create it.");
      try {
        await db.query(`
          CREATE TABLE holidays (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            date DATE NOT NULL
          );
        `);
        console.log("Holidays table created successfully.");
        return [];
      } catch (creationError) {
        console.error("Failed to create holidays table:", creationError);
      }
    }
    return [];
  }
}

// --- ADMIN & MANAGEMENT FUNCTIONS ---

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getAdminDashboardStats",
    );
    return toPlain({
      employeeCount: mock.allEmployees.length,
      departmentCount: mock.allDepartments.length,
      roleCount: mock.allRoles.length,
      pendingRequestsCount: mock.allLeaveRequests.filter(
        (r) => r.status === "Pending",
      ).length,
    });
  }
  noStore();
  try {
    const data = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM employees)::int AS "employeeCount",
        (SELECT COUNT(*) FROM departments)::int AS "departmentCount",
        (SELECT COUNT(*) FROM roles)::int AS "roleCount",
        (SELECT COUNT(*) FROM leave_requests WHERE status = 'Pending')::int AS "pendingRequestsCount"
    `);
    return toPlain(data.rows[0] || { employeeCount: 0, departmentCount: 0, roleCount: 0, pendingRequestsCount: 0 });
  } catch (error) {
    console.error("Database Error:", error);
    return {
      employeeCount: 0,
      departmentCount: 0,
      roleCount: 0,
      pendingRequestsCount: 0,
    };
  }
}

export async function getRoles(): Promise<Role[]> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getRoles");
    return toPlain(mock.allRoles);
  }
  noStore();
  try {
    const data = await db.query("SELECT id, name FROM roles ORDER BY name");
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getDepartments(): Promise<Department[]> {
  await ensureAttendanceTablesExist();
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getDepartments");
    return toPlain(mock.allDepartments);
  }
  noStore();
  try {
    const data = await db.query(
      `SELECT 
        id, 
        name, 
        COALESCE(sign_in_time, '09:00') AS "signInTime", 
        COALESCE(grace_time_minutes, 15) AS "graceTimeMinutes", 
        COALESCE(business_address, '100 Tech Park Way, San Francisco, CA 94105') AS "businessAddress", 
        COALESCE(business_latitude, 37.7749) AS "businessLatitude", 
        COALESCE(business_longitude, -122.4194) AS "businessLongitude", 
        COALESCE(allowed_radius_meters, 500) AS "allowedRadiusMeters" 
       FROM departments ORDER BY name`
    );
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return toPlain(mock.allDepartments);
  }
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getLeaveTypes");
    return toPlain(mock.allLeaveTypes);
  }
  noStore();
  try {
    const data = await db.query(
      "SELECT id, name, description FROM leave_types ORDER BY name",
    );
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getLeaveGroups(): Promise<PopulatedLeaveGroup[]> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getLeaveGroups");
    return toPlain(mock.allLeaveGroups.map((lg) => ({
      id: lg.id,
      roleName:
        mock.allRoles.find((r) => r.id === lg.roleId)?.name ?? "Unknown",
      leaveTypeName:
        mock.allLeaveTypes.find((lt) => lt.id === lg.leaveTypeId)?.name ??
        "Unknown",
      daysAllowed: lg.daysAllowed,
    })));
  }
  noStore();
  try {
    const data = await db.query(`
        SELECT lp.id, COALESCE(r.name, 'No Role') as "roleName", COALESCE(lt.name, 'Leave') as "leaveTypeName", lp.days_allowed as "daysAllowed" 
        FROM leave_policies lp 
        LEFT JOIN roles r ON lp.role_id = r.id 
        LEFT JOIN leave_types lt ON lp.leave_type_id = lt.id
        ORDER BY r.name, lt.name
    `);
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getCarryForwardPolicies(): Promise<
  PopulatedCarryForwardPolicy[]
> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getCarryForwardPolicies",
    );
    return toPlain(mock.allCarryForwardPolicies.map((p) => ({
      id: p.id,
      leaveTypeId: p.leaveTypeId,
      leaveTypeName:
        mock.allLeaveTypes.find((lt) => lt.id === p.leaveTypeId)?.name ??
        "Unknown",
      maxDays: p.maxDays,
      expiryMonths: p.expiryMonths,
    })));
  }
  noStore();
  try {
    const data = await db.query(`
        SELECT cfp.id, cfp.leave_type_id as "leaveTypeId", COALESCE(lt.name, 'Leave') as "leaveTypeName", cfp.max_days as "maxDays", cfp.expiry_months as "expiryMonths" 
        FROM carry_forward_policies cfp 
        LEFT JOIN leave_types lt ON cfp.leave_type_id = lt.id
        ORDER BY lt.name
    `);
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

// --- REPORTING FUNCTIONS ---
export async function getLeaveReportByPeriod(
  period: "week" | "month" | "year",
): Promise<any[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getLeaveReportByPeriod",
    );
    return toPlain(mock.reportData[period]);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT
                TO_CHAR(DATE_TRUNC('${period}', start_date), 'YYYY-MM-DD') AS period,
                COUNT(id)::int AS requests
            FROM leave_requests
            WHERE status = 'Approved'
            GROUP BY period
            ORDER BY period;
        `);
    const mapped = data.rows.map((row) => ({
      [period]: row.period,
      requests: parseInt(row.requests || 0, 10),
    }));
    return toPlain(mapped);
  } catch (error) {
    console.error(`Database Error fetching ${period} report:`, error);
    return [];
  }
}

export async function getLeaveReportByDepartment(): Promise<any[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getLeaveReportByDepartment",
    );
    return toPlain(mock.reportData.byDepartment);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT
                COALESCE(d.name, 'Unassigned') AS department,
                COUNT(lr.id)::int AS requests
            FROM leave_requests lr
            LEFT JOIN employees e ON lr.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE lr.status = 'Approved'
            GROUP BY d.name
            ORDER BY requests DESC;
        `);
    return toPlain(data.rows);
  } catch (error) {
    console.error(`Database Error fetching department report:`, error);
    return [];
  }
}

export async function getLeaveReportByEmployee(): Promise<any[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getLeaveReportByEmployee",
    );
    return toPlain(mock.reportData.byEmployee);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT
                COALESCE(e.name, 'Former Employee') AS employee,
                COUNT(lr.id)::int AS requests
            FROM leave_requests lr
            LEFT JOIN employees e ON lr.employee_id = e.id
            WHERE lr.status = 'Approved'
            GROUP BY e.name
            ORDER BY requests DESC
            LIMIT 10;
        `);
    return toPlain(data.rows);
  } catch (error) {
    console.error(`Database Error fetching employee report:`, error);
    return [];
  }
}

// --- PAYROLL FUNCTIONS ---

export async function getPayrollComponents(): Promise<PayrollComponent[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getPayrollComponents",
    );
    return toPlain(mock.allPayrollComponents);
  }
  noStore();
  try {
    const data = await db.query(
      "SELECT id, name, type, description FROM payroll_components ORDER BY type, name",
    );
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getPopulatedEmployeePayrollSettings(): Promise<
  PopulatedEmployeePayrollSetting[]
> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getPopulatedEmployeePayrollSettings",
    );
    return toPlain(mock.populatedEmployeePayrollSettings);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT
                eps.id,
                COALESCE(e.name, 'Former Employee') as "employeeName",
                COALESCE(pc.name, 'Unknown') as "componentName",
                COALESCE(pc.type, 'Earning') as "componentType",
                eps.value
            FROM employee_payroll_settings eps
            LEFT JOIN employees e ON eps.employee_id = e.id
            LEFT JOIN payroll_components pc ON eps.component_id = pc.id
            ORDER BY e.name, pc.name
        `);
    const mapped = data.rows.map((row) => ({ ...row, value: parseFloat(row.value || 0) }));
    return toPlain(mapped);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getPayslips(): Promise<PopulatedPayslipSummary[]> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getPayslips");
    const statuses = ["Sent", "Processed", "Draft"];
    const formattedMock = mock.allPayslips
      .map((p, idx) => {
        const emp = mock.allEmployees.find((e) => e.id === p.employee_id);
        return {
          id: p.id,
          employeeId: p.employee_id,
          employeeName: emp?.name || "Unknown",
          employeeEmail: emp?.email || "employee@company.com",
          payPeriodStart: p.pay_period_start,
          payPeriodEnd: p.pay_period_end,
          grossEarnings: parseFloat(p.gross_earnings || "0"),
          totalDeductions: parseFloat(p.total_deductions || "0"),
          netPay: parseFloat(p.net_pay),
          status: p.status || statuses[idx % statuses.length],
          createdAt: p.created_at,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return toPlain(formattedMock);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT 
                p.id,
                p.employee_id as "employeeId",
                COALESCE(e.name, 'Former Employee') as "employeeName",
                COALESCE(e.email, 'employee@company.com') as "employeeEmail",
                p.pay_period_start as "payPeriodStart",
                p.pay_period_end as "payPeriodEnd",
                p.gross_earnings as "grossEarnings",
                p.total_deductions as "totalDeductions",
                p.net_pay as "netPay",
                COALESCE(p.status, 'Processed') as "status",
                p.created_at as "createdAt"
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            ORDER BY p.created_at DESC
        `);
    const mapped = data.rows.map((row) => ({
      ...row,
      grossEarnings: parseFloat(row.grossEarnings || 0),
      totalDeductions: parseFloat(row.totalDeductions || 0),
      netPay: parseFloat(row.netPay || 0),
      status: row.status || "Processed",
    }));
    return toPlain(mapped);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getPayslipById(
  id: string,
): Promise<PopulatedPayslip | null> {
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getPayslipById");
    const mockPayslip = mock.allPayslips.find((p) => p.id === id);
    if (!mockPayslip) return null;
    const employee = mock.allEmployees.find(
      (e) => e.id === mockPayslip.employee_id,
    );
    if (!employee) return null;

    return toPlain({
      id: mockPayslip.id,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      departmentName: employee.departmentName,
      roleName: employee.roleName,
      payPeriod: `${format(
        mockPayslip.pay_period_start,
        "MMM dd, yyyy",
      )} - ${format(mockPayslip.pay_period_end, "MMM dd, yyyy")}`,
      grossEarnings: parseFloat(mockPayslip.gross_earnings),
      totalDeductions: parseFloat(mockPayslip.total_deductions),
      netPay: parseFloat(mockPayslip.net_pay),
      status: mockPayslip.status || "Processed",
      details: mockPayslip.details,
      createdAt: mockPayslip.created_at,
    });
  }
  noStore();
  try {
    const data = await db.query(
      `
            SELECT
                p.id,
                p.employee_id AS "employeeId",
                COALESCE(e.name, 'Former Employee') AS "employeeName",
                COALESCE(e.email, 'employee@company.com') AS "employeeEmail",
                COALESCE(d.name, 'No Department') AS "departmentName",
                COALESCE(r.name, 'No Role') AS "roleName",
                p.pay_period_start,
                p.pay_period_end,
                p.gross_earnings,
                p.total_deductions,
                p.net_pay,
                COALESCE(p.status, 'Processed') AS "status",
                p.details,
                p.created_at
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN roles r ON e.role_id = r.id
            WHERE p.id = $1
        `,
      [id],
    );

    if (data.rows.length === 0) return null;
    const row = data.rows[0];
    return toPlain({
      id: row.id,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      employeeEmail: row.employeeEmail,
      departmentName: row.departmentName,
      roleName: row.roleName,
      payPeriod: `${format(new Date(row.pay_period_start), "MMM dd, yyyy")} - ${format(
        new Date(row.pay_period_end),
        "MMM dd, yyyy",
      )}`,
      grossEarnings: parseFloat(row.gross_earnings || 0),
      totalDeductions: parseFloat(row.total_deductions || 0),
      netPay: parseFloat(row.net_pay || 0),
      status: row.status || "Processed",
      details: row.details,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

// --- STATUTORY SETTINGS MANAGEMENT ---
let memoryStatutoryRules: StatutoryRules = { ...DEFAULT_STATUTORY_RULES };

export async function getStatutorySettings(): Promise<StatutoryRules> {
  if (!db) {
    return memoryStatutoryRules;
  }
  noStore();
  try {
    const res = await db.query(`SELECT rules_json FROM statutory_payroll_settings LIMIT 1`);
    if (res.rows.length > 0 && res.rows[0].rules_json) {
      const parsed = typeof res.rows[0].rules_json === "string" ? JSON.parse(res.rows[0].rules_json) : res.rows[0].rules_json;
      memoryStatutoryRules = { ...DEFAULT_STATUTORY_RULES, ...parsed };
      return memoryStatutoryRules;
    }
  } catch (err: any) {
    if (err?.code === "42P01") {
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS statutory_payroll_settings (
            id INT PRIMARY KEY DEFAULT 1,
            rules_json JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (tableErr) {
        console.error("Failed to create statutory_payroll_settings table:", tableErr);
      }
    }
  }
  return memoryStatutoryRules;
}

export async function updateStatutorySettings(newRules: StatutoryRules): Promise<boolean> {
  memoryStatutoryRules = { ...newRules };
  if (!db) return true;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS statutory_payroll_settings (
        id INT PRIMARY KEY DEFAULT 1,
        rules_json JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      INSERT INTO statutory_payroll_settings (id, rules_json, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET rules_json = EXCLUDED.rules_json, updated_at = NOW()
    `, [JSON.stringify(newRules)]);

    return true;
  } catch (err) {
    console.error("Error updating statutory rules in DB:", err);
    return true; // memory fallback
  }
}

export async function runPayrollForEmployees(
  employeeIds: string[],
  startDate: Date,
  endDate: Date,
) {
  if (!db) {
    throw new Error("Database not configured. Cannot run payroll.");
  }

  const statutoryRules = await getStatutorySettings();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const settingsQuery = await client.query(
      `
            SELECT 
                eps.employee_id, pc.name, pc.type, eps.value
            FROM employee_payroll_settings eps
            JOIN payroll_components pc ON eps.component_id = pc.id
            WHERE eps.employee_id = ANY($1::varchar[])
        `,
      [employeeIds],
    );

    const settingsByEmployee = settingsQuery.rows.reduce(
      (acc, row) => {
        if (!acc[row.employee_id]) {
          acc[row.employee_id] = [];
        }
        acc[row.employee_id].push({
          name: row.name,
          type: row.type,
          value: parseFloat(row.value),
        });
        return acc;
      },
      {} as Record<string, PayslipDetailsItem[]>,
    );

    let processedCount = 0;
    for (const employeeId of employeeIds) {
      let details = settingsByEmployee[employeeId] || [];
      if (!details || details.length === 0) {
        console.warn(
          `No payroll settings for employee ${employeeId}. Skipping.`,
        );
        continue;
      }

      // Calculate initial Gross
      const initialGross = details
        .filter((d) => d.type === "Earning")
        .reduce((sum, d) => sum + d.value, 0);

      // Find Basic Salary (or assume 50% of gross if not specified)
      const basicComp = details.find(
        (d) => d.type === "Earning" && d.name.toLowerCase().includes("basic")
      );
      const basicSalary = basicComp ? basicComp.value : initialGross * 0.5;

      // Calculate Statutory Deductions (PF, ESI/ESU, TDS)
      const statutory = calculateStatutoryBreakdown(basicSalary, initialGross, statutoryRules);

      // Inject PF if not manually added in settings
      const hasPf = details.some((d) => d.name.toLowerCase().includes("provident") || d.name.toLowerCase().includes("pf"));
      if (!hasPf && statutory.pfEmployee > 0) {
        details.push({
          name: `PF Contribution (${statutoryRules.employeePfRate}% Basic)`,
          type: "Deduction",
          value: statutory.pfEmployee,
        });
      }

      // Inject ESI / ESU if not manually added in settings
      const hasEsi = details.some((d) => d.name.toLowerCase().includes("esi") || d.name.toLowerCase().includes("esu") || d.name.toLowerCase().includes("insurance"));
      if (!hasEsi && statutory.esiEmployee > 0) {
        details.push({
          name: `ESI/ESU Contribution (${statutoryRules.employeeEsiRate}% Gross)`,
          type: "Deduction",
          value: statutory.esiEmployee,
        });
      }

      // Inject TDS if not manually added in settings
      const hasTds = details.some((d) => d.name.toLowerCase().includes("tds") || d.name.toLowerCase().includes("tax deducted"));
      if (!hasTds && statutory.tdsMonthly > 0) {
        details.push({
          name: `Tax Deducted at Source (TDS)`,
          type: "Deduction",
          value: statutory.tdsMonthly,
        });
      }

      const grossEarnings = details
        .filter((d: any) => d.type === "Earning")
        .reduce((sum: any, d: any) => sum + d.value, 0);
      const totalDeductions = details
        .filter((d: any) => d.type === "Deduction")
        .reduce((sum: any, d: any) => sum + d.value, 0);
      const netPay = Math.max(0, grossEarnings - totalDeductions);

      await client.query(
        `
                INSERT INTO payslips (employee_id, pay_period_start, pay_period_end, gross_earnings, total_deductions, net_pay, details)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
        [
          employeeId,
          startDate,
          endDate,
          grossEarnings,
          totalDeductions,
          netPay,
          JSON.stringify(details),
        ],
      );
      processedCount++;
    }

    await client.query("COMMIT");
    return { success: true, processedCount };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payroll Run DB Error:", error);
    throw new Error("Failed to run payroll and generate payslips.");
  } finally {
    client.release();
  }
}

// --- PERMISSIONS FUNCTIONS ---
export async function getScreenPermissions(): Promise<
  PopulatedScreenPermission[]
> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getScreenPermissions",
    );
    return toPlain(mock.allScreenPermissions);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT 
                sp.id,
                sp.route,
                sp.permission_type AS "permissionType",
                sp.target_id AS "targetId",
                sp.is_default AS "isDefault",
                CASE
                    WHEN sp.permission_type = 'employee' THEN e.name
                    WHEN sp.permission_type = 'department' THEN d.name
                    WHEN sp.permission_type = 'role' THEN r.name
                    ELSE 'Unknown'
                END AS "targetName"
            FROM screen_permissions sp
            LEFT JOIN employees e ON sp.target_id = e.id AND sp.permission_type = 'employee'
            LEFT JOIN departments d ON sp.target_id = d.id AND sp.permission_type = 'department'
            LEFT JOIN roles r ON sp.target_id = r.id AND sp.permission_type = 'role'
            ORDER BY sp.permission_type, "targetName", sp.route
        `);
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getDefaultScreenForUser(
  userId: string,
): Promise<string | null> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getDefaultScreenForUser",
    );
    return "/dashboard/admin"; // Mock default
  }
  noStore();
  try {
    const user = await getAppUser(userId);
    if (!user) return null;

    const { roleId, departmentId } = user;

    const query = `
            SELECT route FROM screen_permissions WHERE is_default = true AND 
            ((permission_type = 'employee' AND target_id = $1)
             OR (permission_type = 'role' AND target_id = $2)
             OR (permission_type = 'department' AND target_id = $3))
            ORDER BY
                CASE permission_type
                    WHEN 'employee' THEN 1
                    WHEN 'role' THEN 2
                    WHEN 'department' THEN 3
                    ELSE 4
                END
            LIMIT 1;
        `;
    const data = await db.query(query, [userId, roleId, departmentId]);
    return data.rows.length > 0 ? data.rows[0].route : null;
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

export async function getAllowedRoutesForUser(
  userId: string,
): Promise<string[]> {
  if (!db) {
    console.warn(
      "DATABASE NOT CONFIGURED: Using mock data for getAllowedRoutesForUser",
    );
    return APP_ROUTES.map((r) => r.path); // Mock: allow all
  }
  noStore();
  try {
    const user = await getAppUser(userId);
    const defaultRoutes = ["/dashboard", "/dashboard/calendar"];

    if (!user) {
      return defaultRoutes;
    }

    if (user.roleName === "Administrator") {
      return APP_ROUTES.map((r) => r.path);
    }

    const { roleId, departmentId } = user;

    const managerQuery = await db.query(
      "SELECT 1 FROM employees WHERE manager_id = $1 LIMIT 1",
      [userId],
    );
    if (managerQuery.rows.length > 0) {
      defaultRoutes.push("/dashboard/manager");
    }

    const query = `
            SELECT DISTINCT route FROM screen_permissions WHERE 
            (permission_type = 'employee' AND target_id = $1)
            OR (permission_type = 'role' AND target_id = $2)
            OR (permission_type = 'department' AND target_id = $3)
        `;
    const data = await db.query(query, [userId, roleId, departmentId]);

    const allowedRoutes = data.rows.map((row) => row.route);
    return [...new Set([...defaultRoutes, ...allowedRoutes])];
  } catch (error) {
    console.error("Database Error:", error);
    return ["/dashboard"];
  }
}

export type YearlyLeaveBalanceItem = {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  icon: string;
};

export type EmployeeYearlyLeaveBalance = {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  avatarUrl?: string;
  roleName: string;
  departmentName: string;
  managerId: string | null;
  year: number;
  balances: YearlyLeaveBalanceItem[];
  totalAllocated: number;
  totalUsed: number;
  totalPending: number;
  totalAvailable: number;
};

export async function getYearlyLeaveBalances(options?: {
  year?: number;
  employeeId?: string;
  managerId?: string;
}): Promise<EmployeeYearlyLeaveBalance[]> {
  const targetYear = options?.year || new Date().getFullYear();
  const iconMap: { [key: string]: string } = {
    Vacation: "Plane",
    "Sick Leave": "HeartPulse",
    "Personal Day": "User",
    Bereavement: "Heart",
  };

  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getYearlyLeaveBalances");
    let employees = mock.allEmployees;
    if (options?.employeeId) {
      employees = employees.filter((e) => e.id === options.employeeId);
    } else if (options?.managerId) {
      employees = employees.filter(
        (e) => e.managerId === options.managerId || e.id === options.managerId
      );
    }

    const defaultAllocations: { [key: string]: number } = {
      "lt-1": 25,
      "lt-2": 10,
      "lt-3": 5,
      "lt-4": 3,
    };

    const results: EmployeeYearlyLeaveBalance[] = employees.map((emp) => {
      const balances: YearlyLeaveBalanceItem[] = mock.allLeaveTypes.map((lt) => {
        const lg = mock.allLeaveGroups.find(
          (g) => g.roleId === emp.roleId && g.leaveTypeId === lt.id
        );
        const allocatedDays = lg ? lg.daysAllowed : defaultAllocations[lt.id] || 20;

        const empRequests = mock.allLeaveRequests.filter((r) => {
          if (r.employeeId !== emp.id) return false;
          if (r.leaveType !== lt.name && (r as any).leaveTypeId !== lt.id) return false;
          const reqYear = new Date(r.startDate).getFullYear();
          return reqYear === targetYear;
        });

        const usedDays = empRequests
          .filter((r) => r.status === "Approved")
          .reduce((acc, r) => acc + r.days, 0);

        const pendingDays = empRequests
          .filter((r) => r.status === "Pending")
          .reduce((acc, r) => acc + r.days, 0);

        const availableDays = Math.max(0, allocatedDays - usedDays);

        return {
          leaveTypeId: lt.id,
          leaveTypeName: lt.name,
          allocatedDays,
          usedDays,
          pendingDays,
          availableDays,
          icon: iconMap[lt.name] || "User",
        };
      });

      const totalAllocated = balances.reduce((a, b) => a + b.allocatedDays, 0);
      const totalUsed = balances.reduce((a, b) => a + b.usedDays, 0);
      const totalPending = balances.reduce((a, b) => a + b.pendingDays, 0);
      const totalAvailable = balances.reduce((a, b) => a + b.availableDays, 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeEmail: emp.email,
        avatarUrl: emp.avatarUrl,
        roleName: emp.roleName,
        departmentName: emp.departmentName,
        managerId: emp.managerId,
        year: targetYear,
        balances,
        totalAllocated,
        totalUsed,
        totalPending,
        totalAvailable,
      };
    });

    return toPlain(results);
  }

  noStore();
  try {
    let whereConditions: string[] = [];
    let queryParams: any[] = [targetYear];

    if (options?.employeeId) {
      queryParams.push(options.employeeId);
      whereConditions.push(`e.id = $${queryParams.length}`);
    } else if (options?.managerId) {
      queryParams.push(options.managerId);
      whereConditions.push(`(e.manager_id = $${queryParams.length} OR e.id = $${queryParams.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      SELECT 
        e.id as "employeeId",
        e.name as "employeeName",
        e.email as "employeeEmail",
        e.avatar_url as "avatarUrl",
        COALESCE(r.name, 'No Role') as "roleName",
        COALESCE(d.name, 'No Department') as "departmentName",
        e.manager_id as "managerId",
        lt.id as "leaveTypeId",
        lt.name as "leaveTypeName",
        COALESCE(lb.balance, lp.days_allowed, 0) as "allocatedDays",
        COALESCE((
          SELECT SUM(lr.days) 
          FROM leave_requests lr 
          WHERE lr.employee_id = e.id 
            AND lr.leave_type_id = lt.id 
            AND lr.status = 'Approved' 
            AND EXTRACT(YEAR FROM lr.start_date) = $1
        ), 0) as "usedDays",
        COALESCE((
          SELECT SUM(lr.days) 
          FROM leave_requests lr 
          WHERE lr.employee_id = e.id 
            AND lr.leave_type_id = lt.id 
            AND lr.status = 'Pending' 
            AND EXTRACT(YEAR FROM lr.start_date) = $1
        ), 0) as "pendingDays"
      FROM employees e
      CROSS JOIN leave_types lt
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN leave_policies lp ON lp.role_id = e.role_id AND lp.leave_type_id = lt.id
      LEFT JOIN leave_balances lb ON lb.employee_id = e.id AND lb.leave_type_id = lt.id AND (lb.year = $1 OR lb.year IS NULL)
      ${whereClause}
      ORDER BY e.name, lt.name
    `;

    const data = await db.query(query, queryParams);

    const employeeMap = new Map<string, EmployeeYearlyLeaveBalance>();

    for (const row of data.rows) {
      const empId = row.employeeId;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          employeeName: row.employeeName,
          employeeEmail: row.employeeEmail,
          avatarUrl: row.avatarUrl,
          roleName: row.roleName,
          departmentName: row.departmentName,
          managerId: row.managerId,
          year: targetYear,
          balances: [],
          totalAllocated: 0,
          totalUsed: 0,
          totalPending: 0,
          totalAvailable: 0,
        });
      }

      const empRecord = employeeMap.get(empId)!;
      const allocatedDays = parseFloat(row.allocatedDays || 0);
      const usedDays = parseFloat(row.usedDays || 0);
      const pendingDays = parseFloat(row.pendingDays || 0);
      const availableDays = Math.max(0, allocatedDays - usedDays);

      empRecord.balances.push({
        leaveTypeId: row.leaveTypeId,
        leaveTypeName: row.leaveTypeName,
        allocatedDays,
        usedDays,
        pendingDays,
        availableDays,
        icon: iconMap[row.leaveTypeName] || "User",
      });

      empRecord.totalAllocated += allocatedDays;
      empRecord.totalUsed += usedDays;
      empRecord.totalPending += pendingDays;
      empRecord.totalAvailable += availableDays;
    }

    return toPlain(Array.from(employeeMap.values()));
  } catch (error) {
    console.error("Database Error getting yearly leave balances:", error);
    return [];
  }
}

// --- ATTENDANCE & GEOLOCATION HELPERS ---

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

let attendanceTablesInitialized = false;

export async function ensureAttendanceTablesExist() {
  if (!db || attendanceTablesInitialized) return;
  try {
    await db.query(`
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS sign_in_time VARCHAR(50) DEFAULT '09:00';
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS grace_time_minutes INT DEFAULT 15;
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT '100 Tech Park Way, San Francisco, CA 94105';
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS business_latitude NUMERIC(10, 7) DEFAULT 37.7749;
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS business_longitude NUMERIC(10, 7) DEFAULT -122.4194;
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS allowed_radius_meters INT DEFAULT 500;

      ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_carry_forward_year INT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255);
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(255);
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(50);

      CREATE TABLE IF NOT EXISTS holidays (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS statutory_payroll_settings (
        id INT PRIMARY KEY DEFAULT 1,
        rules_json JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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
    `);
    attendanceTablesInitialized = true;
  } catch (err) {
    console.warn("ensureAttendanceTablesExist error:", err);
  }
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const depts = await getDepartments();
  return depts.find((d) => d.id === id) || null;
}

export async function getTodayAttendanceLog(employeeId: string): Promise<AttendanceLog | null> {
  await ensureAttendanceTablesExist();
  const todayStr = new Date().toISOString().split("T")[0];

  let log: AttendanceLog | null = null;

  if (!db) {
    const found = mock.allAttendanceLogs.find(
      (l) => l.employeeId === employeeId && l.date === todayStr
    );
    if (found) log = toPlain(found);
  } else {
    try {
      const res = await db.query(
        `SELECT 
          al.id,
          al.employee_id AS "employeeId",
          e.name AS "employeeName",
          e.email AS "employeeEmail",
          d.name AS "departmentName",
          al.date::text AS "date",
          al.punch_in_time AS "punchInTime",
          al.punch_out_time AS "punchOutTime",
          al.punch_in_lat AS "punchInLat",
          al.punch_in_lng AS "punchInLng",
          al.punch_in_photo AS "punchInPhoto",
          al.distance_meters AS "distanceMeters",
          al.status
         FROM attendance_logs al
         JOIN employees e ON al.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE al.employee_id = $1 AND al.date = $2`,
        [employeeId, todayStr]
      );
      if (res.rows.length > 0) {
        log = toPlain(res.rows[0]);
      }
    } catch (err) {
      console.error("Error fetching today attendance log:", err);
    }
  }

  if (log) return log;

  // If no log exists yet, check if employee missed department cutoff time
  const employee = await getAppUser(employeeId);
  const departments = await getDepartments();
  const dept = departments.find((d) => d.id === employee?.departmentId) || departments[0];

  if (dept) {
    const signInTimeStr = dept.signInTime || "09:00";
    const graceMins = dept.graceTimeMinutes ?? 15;
    const [hours, minutes] = signInTimeStr.split(":").map(Number);

    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(hours, minutes + graceMins, 0, 0);

    if (now > cutoffTime) {
      const dayOffLog: AttendanceLog = {
        id: `dayoff-${employeeId}-${todayStr}`,
        employeeId: employeeId,
        employeeName: employee?.name,
        employeeEmail: employee?.email,
        departmentName: dept.name,
        date: todayStr,
        punchInTime: null,
        punchOutTime: null,
        punchInLat: null,
        punchInLng: null,
        punchInPhoto: null,
        distanceMeters: null,
        status: "DAY_OFF",
        createdAt: new Date().toISOString(),
      };
      return dayOffLog;
    }
  }

  return null;
}

export async function getAllAttendanceLogs(): Promise<AttendanceLog[]> {
  await ensureAttendanceTablesExist();
  if (!db) {
    return toPlain(mock.allAttendanceLogs);
  }

  try {
    const res = await db.query(
      `SELECT 
        al.id,
        al.employee_id AS "employeeId",
        e.name AS "employeeName",
        e.email AS "employeeEmail",
        d.name AS "departmentName",
        al.date::text AS "date",
        al.punch_in_time AS "punchInTime",
        al.punch_out_time AS "punchOutTime",
        al.punch_in_lat AS "punchInLat",
        al.punch_in_lng AS "punchInLng",
        al.punch_in_photo AS "punchInPhoto",
        al.distance_meters AS "distanceMeters",
        al.status
       FROM attendance_logs al
       JOIN employees e ON al.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY al.date DESC, al.created_at DESC`
    );
    return toPlain(res.rows);
  } catch (err) {
    console.error("Error fetching all attendance logs:", err);
    return toPlain(mock.allAttendanceLogs);
  }
}

export async function savePunchInRecord(data: {
  employeeId: string;
  lat: number;
  lng: number;
  photo: string;
  distanceMeters: number;
}) {
  await ensureAttendanceTablesExist();
  const todayStr = new Date().toISOString().split("T")[0];
  const nowIso = new Date().toISOString();

  const employee = await getAppUser(data.employeeId);
  const departments = await getDepartments();
  const dept = departments.find((d) => d.id === employee?.departmentId) || departments[0];

  let isLate = false;
  if (dept) {
    const signInTimeStr = dept.signInTime || "09:00";
    const [hours, minutes] = signInTimeStr.split(":").map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (new Date() > scheduledTime) {
      isLate = true;
    }
  }

  const status = isLate ? "LATE_PUNCH_IN" : "PUNCHED_IN";

  if (!db) {
    const existingIndex = mock.allAttendanceLogs.findIndex(
      (l) => l.employeeId === data.employeeId && l.date === todayStr
    );
    const newRecord: mock.AttendanceLog = {
      id: `att-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: employee?.name,
      employeeEmail: employee?.email,
      departmentName: dept?.name || "Engineering",
      date: todayStr,
      punchInTime: nowIso,
      punchOutTime: null,
      punchInLat: data.lat,
      punchInLng: data.lng,
      punchInPhoto: data.photo,
      distanceMeters: data.distanceMeters,
      status: status,
      createdAt: nowIso,
    };
    if (existingIndex >= 0) {
      mock.allAttendanceLogs[existingIndex] = newRecord;
    } else {
      mock.allAttendanceLogs.unshift(newRecord);
    }
    return newRecord;
  }

  try {
    const query = `
      INSERT INTO attendance_logs 
        (employee_id, date, punch_in_time, punch_in_lat, punch_in_lng, punch_in_photo, distance_meters, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (employee_id, date) 
      DO UPDATE SET 
        punch_in_time = EXCLUDED.punch_in_time,
        punch_in_lat = EXCLUDED.punch_in_lat,
        punch_in_lng = EXCLUDED.punch_in_lng,
        punch_in_photo = EXCLUDED.punch_in_photo,
        distance_meters = EXCLUDED.distance_meters,
        status = EXCLUDED.status
      RETURNING id;
    `;
    await db.query(query, [
      data.employeeId,
      todayStr,
      nowIso,
      data.lat,
      data.lng,
      data.photo,
      data.distanceMeters,
      status,
    ]);
  } catch (err) {
    console.error("Error saving punch in DB record:", err);
  }
}

export async function savePunchOutRecord(employeeId: string) {
  await ensureAttendanceTablesExist();
  const todayStr = new Date().toISOString().split("T")[0];
  const nowIso = new Date().toISOString();

  if (!db) {
    const record = mock.allAttendanceLogs.find(
      (l) => l.employeeId === employeeId && l.date === todayStr
    );
    if (record) {
      record.punchOutTime = nowIso;
      record.status = "PUNCHED_OUT";
    }
    return;
  }

  try {
    await db.query(
      `UPDATE attendance_logs 
       SET punch_out_time = $1, status = 'PUNCHED_OUT' 
       WHERE employee_id = $2 AND date = $3`,
      [nowIso, employeeId, todayStr]
    );
  } catch (err) {
    console.error("Error saving punch out DB record:", err);
  }
}

export { db };
