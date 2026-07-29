import { db } from "./db";
import { unstable_noStore as noStore } from "next/cache";
import * as mock from "./mock-data";
import { format } from "date-fns";

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
};

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
  employeeName: string;
  departmentName: string;
  roleName: string;
  payPeriod: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  details: PayslipDetailsItem[];
  createdAt: Date;
};

export type PopulatedPayslipSummary = {
  id: string;
  employeeName: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  netPay: number;
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
  if (!db) {
    console.warn("DATABASE NOT CONFIGURED: Using mock data for getDepartments");
    return toPlain(mock.allDepartments);
  }
  noStore();
  try {
    const data = await db.query(
      "SELECT id, name FROM departments ORDER BY name",
    );
    return toPlain(data.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
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
    const formattedMock = mock.allPayslips
      .map((p) => ({
        id: p.id,
        employeeName:
          mock.allEmployees.find((e) => e.id === p.employee_id)?.name ||
          "Unknown",
        payPeriodStart: p.pay_period_start,
        payPeriodEnd: p.pay_period_end,
        netPay: parseFloat(p.net_pay),
        createdAt: p.created_at,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return toPlain(formattedMock);
  }
  noStore();
  try {
    const data = await db.query(`
            SELECT 
                p.id,
                COALESCE(e.name, 'Former Employee') as "employeeName",
                p.pay_period_start as "payPeriodStart",
                p.pay_period_end as "payPeriodEnd",
                p.net_pay as "netPay",
                p.created_at as "createdAt"
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            ORDER BY p.created_at DESC
        `);
    const mapped = data.rows.map((row) => ({ ...row, netPay: parseFloat(row.netPay || 0) }));
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
      employeeName: employee.name,
      departmentName: employee.departmentName,
      roleName: employee.roleName,
      payPeriod: `${format(
        mockPayslip.pay_period_start,
        "MMM dd, yyyy",
      )} - ${format(mockPayslip.pay_period_end, "MMM dd, yyyy")}`,
      grossEarnings: parseFloat(mockPayslip.gross_earnings),
      totalDeductions: parseFloat(mockPayslip.total_deductions),
      netPay: parseFloat(mockPayslip.net_pay),
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
                COALESCE(e.name, 'Former Employee') AS "employeeName",
                COALESCE(d.name, 'No Department') AS "departmentName",
                COALESCE(r.name, 'No Role') AS "roleName",
                p.pay_period_start,
                p.pay_period_end,
                p.gross_earnings,
                p.total_deductions,
                p.net_pay,
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
      employeeName: row.employeeName,
      departmentName: row.departmentName,
      roleName: row.roleName,
      payPeriod: `${format(new Date(row.pay_period_start), "MMM dd, yyyy")} - ${format(
        new Date(row.pay_period_end),
        "MMM dd, yyyy",
      )}`,
      grossEarnings: parseFloat(row.gross_earnings || 0),
      totalDeductions: parseFloat(row.total_deductions || 0),
      netPay: parseFloat(row.net_pay || 0),
      details: row.details,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error("Database Error:", error);
    return null;
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
      const details = settingsByEmployee[employeeId];
      if (!details || details.length === 0) {
        console.warn(
          `No payroll settings for employee ${employeeId}. Skipping.`,
        );
        continue;
      }

      const grossEarnings = details
        .filter((d: any) => d.type === "Earning")
        .reduce((sum: any, d: any) => sum + d.value, 0);
      const totalDeductions = details
        .filter((d: any) => d.type === "Deduction")
        .reduce((sum: any, d: any) => sum + d.value, 0);
      const netPay = grossEarnings - totalDeductions;

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

export { db };
