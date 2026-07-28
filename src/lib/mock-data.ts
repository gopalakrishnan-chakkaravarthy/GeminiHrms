import { PayslipDetailsItem, PopulatedScreenPermission, Holiday } from "./data";

export type LeaveRequest = {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  employeeAvatar: string;
  leaveType: "Vacation" | "Sick" | "Personal";
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  managerId: string | null;
};

export type Role = {
  id: string;
  name: string;
};

export type Department = {
  id: string;
  name: string;
};

export type Employee = {
  id: string;
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

export type LeaveType = {
  id: string;
  name: string;
  description: string;
};

export type LeaveGroup = {
  id: string;
  roleId: string;
  leaveTypeId: string;
  daysAllowed: number;
};

export type CarryForwardPolicy = {
  id: string;
  leaveTypeId: string;
  maxDays: number;
  expiryMonths: number;
};

export type PayrollComponent = {
  id: string;
  name: string;
  type: "Earning" | "Deduction";
  description: string;
};

export type EmployeePayrollSetting = {
  id: string;
  employeeId: string;
  componentId: string;
  value: number;
};

export type MockPayslip = {
  id: string;
  employee_id: string;
  pay_period_start: Date;
  pay_period_end: Date;
  gross_earnings: string;
  total_deductions: string;
  net_pay: string;
  details: PayslipDetailsItem[];
  created_at: Date;
};

export const allRoles: Role[] = [
  { id: "role-1", name: "Senior Software Engineer" },
  { id: "role-2", name: "Product Manager" },
  { id: "role-3", name: "UX Designer" },
  { id: "role-4", name: "Junior Developer" },
  { id: "role-5", name: "Administrator" },
];

export const allDepartments: Department[] = [
  { id: "dept-1", name: "Engineering" },
  { id: "dept-2", name: "Product" },
  { id: "dept-3", name: "Design" },
  { id: "dept-4", name: "Human Resources" },
];

export const allLeaveTypes: LeaveType[] = [
  {
    id: "lt-1",
    name: "Vacation",
    description: "Annual paid time off for rest and relaxation.",
  },
  {
    id: "lt-2",
    name: "Sick Leave",
    description: "For personal illness or injury.",
  },
  {
    id: "lt-3",
    name: "Personal Day",
    description: "For personal matters and appointments.",
  },
  {
    id: "lt-4",
    name: "Bereavement",
    description: "For time off following the death of a loved one.",
  },
];

export const allHolidays: Holiday[] = [
  {
    id: "h-1",
    name: "New Year's Day",
    date: new Date(new Date().getFullYear(), 0, 1),
  },
  {
    id: "h-2",
    name: "Memorial Day",
    date: new Date(new Date().getFullYear(), 4, 27),
  },
  {
    id: "h-3",
    name: "Independence Day",
    date: new Date(new Date().getFullYear(), 6, 4),
  },
  {
    id: "h-4",
    name: "Labor Day",
    date: new Date(new Date().getFullYear(), 8, 2),
  },
  {
    id: "h-5",
    name: "Thanksgiving Day",
    date: new Date(new Date().getFullYear(), 10, 28),
  },
  {
    id: "h-6",
    name: "Christmas Day",
    date: new Date(new Date().getFullYear(), 11, 25),
  },
];

export const allLeaveGroups: LeaveGroup[] = [
  { id: "lg-1", roleId: "role-1", leaveTypeId: "lt-1", daysAllowed: 25 },
  { id: "lg-2", roleId: "role-1", leaveTypeId: "lt-2", daysAllowed: 10 },
  { id: "lg-3", roleId: "role-2", leaveTypeId: "lt-1", daysAllowed: 20 },
  { id: "lg-4", roleId: "role-3", leaveTypeId: "lt-1", daysAllowed: 20 },
  { id: "lg-5", roleId: "role-4", leaveTypeId: "lt-1", daysAllowed: 15 },
  { id: "lg-6", roleId: "role-2", leaveTypeId: "lt-3", daysAllowed: 5 },
  { id: "lg-7", roleId: "role-1", leaveTypeId: "lt-3", daysAllowed: 5 },
];

export const allCarryForwardPolicies: CarryForwardPolicy[] = [
  { id: "cfp-1", leaveTypeId: "lt-1", maxDays: 5, expiryMonths: 3 },
  { id: "cfp-2", leaveTypeId: "lt-3", maxDays: 2, expiryMonths: 12 },
];

export const leaveBalances = {
  vacation: 12,
  sick: 5,
  personal: 3,
};

export const currentUser = {
  id: "user_2fAbcDef123Example",
  name: "Mariah Wilson",
  email: "mariah.wilson@example.com",
  avatarUrl: "https://placehold.co/100x100.png",
  dataAiHint: "person portrait",
  roleId: "role-1",
  roleName: "Senior Software Engineer",
  departmentId: "dept-1",
  departmentName: "Engineering",
  managerId: "user_2fGhiJkl456Example",
  leaveHistory:
    "Took 2 weeks of vacation 6 months ago for a family trip. Used 3 sick days over the past year. No personal days taken.",
  lastCarryForwardYear: new Date().getFullYear() - 1,
  employeeId: "asddf",
  phoneNumber: "123-456-7890",
  emergencyContactNumber: "987-654-3210",
  bloodGroup: "O+",
};

const today = new Date();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const allEmployees: Employee[] = [
  {
    id: "user_2fAbcDef123Example",
    name: "Mariah Wilson",
    email: "mariah.wilson@example.com",
    avatarUrl: "https://placehold.co/100x100.png",
    roleId: "role-1",
    roleName: "Senior Software Engineer",
    departmentId: "dept-1",
    departmentName: "Engineering",
    managerId: "user_2fGhiJkl456Example",
    lastCarryForwardYear: new Date().getFullYear() - 1,
    employeeId: "asddf",
    phoneNumber: "123-456-7890",
    emergencyContactNumber: "987-654-3210",
    bloodGroup: "O+",
  },
  {
    id: "user_2fGhiJkl456Example",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    avatarUrl: "https://placehold.co/100x100.png",
    roleId: "role-2",
    roleName: "Product Manager",
    departmentId: "dept-2",
    departmentName: "Product",
    managerId: null,
    lastCarryForwardYear: new Date().getFullYear() - 1,
    employeeId: "asddf",
    phoneNumber: "123-456-7890",
    emergencyContactNumber: "987-654-3210",
    bloodGroup: "O+",
  },
];

export const allLeaveRequests: LeaveRequest[] = [
  {
    id: "req001",
    employeeName: "Alex Johnson",
    employeeId: "emp002",
    employeeEmail: "alex.johnson@example.com",
    employeeAvatar: "https://placehold.co/100x100.png",
    leaveType: "Vacation",
    startDate: addDays(today, 10),
    endDate: addDays(today, 15),
    days: 5,
    reason: "Family vacation to the Grand Canyon.",
    status: "Pending",
    managerId: "user_2fGhiJkl456Example",
  },
  {
    id: "req002",
    employeeName: "Samantha Green",
    employeeId: "emp003",
    employeeEmail: "samantha.green@example.com",
    employeeAvatar: "https://placehold.co/100x100.png",
    leaveType: "Personal",
    startDate: addDays(today, 2),
    endDate: addDays(today, 3),
    days: 2,
    reason: "Attending a family wedding.",
    status: "Approved",
    managerId: "user_2fGhiJkl456Example",
  },
  {
    id: "req003",
    employeeName: "David Chen",
    employeeId: "emp004",
    employeeEmail: "david.chen@example.com",
    employeeAvatar: "https://placehold.co/100x100.png",
    leaveType: "Sick",
    startDate: addDays(today, -1),
    endDate: addDays(today, -1),
    days: 1,
    reason: "Flu symptoms.",
    status: "Approved",
    managerId: "user_2fGhiJkl456Example",
  },
  {
    id: "req004",
    employeeName: "Mariah Wilson",
    employeeId: "user_2fAbcDef123Example", // Match mock user ID
    employeeEmail: "mariah.wilson@example.com",
    employeeAvatar: "https://placehold.co/100x100.png",
    leaveType: "Vacation",
    startDate: addDays(today, 30),
    endDate: addDays(today, 35),
    days: 5,
    reason: "Annual leave.",
    status: "Pending",
    managerId: "user_2fGhiJkl456Example",
  },
  {
    id: "req005",
    employeeName: "Ben Carter",
    employeeId: "emp005",
    employeeEmail: "ben.carter@example.com",
    employeeAvatar: "https://placehold.co/100x100.png",
    leaveType: "Vacation",
    startDate: addDays(today, 5),
    endDate: addDays(today, 7),
    days: 3,
    reason: "Short trip.",
    status: "Rejected",
    managerId: "user_2fGhiJkl456Example",
  },
  {
    id: "req006",
    employeeName: "Olivia Martinez",
    employeeId: "emp006",
    employeeEmail: "olivia.martinez@example.com",
    employeeAvatar: "https://placehold.co/100x100.png",
    leaveType: "Sick",
    startDate: addDays(today, -2),
    endDate: addDays(today, -2),
    days: 1,
    reason: "Migraine.",
    status: "Approved",
    managerId: "user_2fGhiJkl456Example",
  },
];

export const reportData = {
  week: [
    { week: "2024-05-06", requests: 5 },
    { week: "2024-05-13", requests: 8 },
    { week: "2024-05-20", requests: 3 },
    { week: "2024-05-27", requests: 7 },
  ],
  month: [
    { month: "2024-01-01", requests: 20 },
    { month: "2024-02-01", requests: 15 },
    { month: "2024-03-01", requests: 25 },
    { month: "2024-04-01", requests: 30 },
    { month: "2024-05-01", requests: 22 },
  ],
  year: [
    { year: "2022-01-01", requests: 150 },
    { year: "2023-01-01", requests: 200 },
    { year: "2024-01-01", requests: 180 },
  ],
  byDepartment: [
    { department: "Engineering", requests: 45 },
    { department: "Product", requests: 30 },
    { department: "Design", requests: 25 },
    { department: "Human Resources", requests: 10 },
  ],
  byEmployee: [
    { employee: "Mariah Wilson", requests: 12 },
    { employee: "Alex Johnson", requests: 10 },
    { employee: "Samantha Green", requests: 8 },
    { employee: "David Chen", requests: 7 },
    { employee: "Ben Carter", requests: 5 },
  ],
};

// --- PAYROLL MOCK DATA ---
export const allPayrollComponents: PayrollComponent[] = [
  {
    id: "pc-1",
    name: "Basic Salary",
    type: "Earning",
    description: "The base salary.",
  },
  {
    id: "pc-2",
    name: "Housing Allowance",
    type: "Earning",
    description: "Allowance for housing.",
  },
  {
    id: "pc-3",
    name: "Income Tax",
    type: "Deduction",
    description: "Statutory tax.",
  },
  {
    id: "pc-4",
    name: "Health Insurance",
    type: "Deduction",
    description: "Health premium.",
  },
];

export const employeePayrollSettings: EmployeePayrollSetting[] = [
  {
    id: "eps-1",
    employeeId: "user_2fAbcDef123Example",
    componentId: "pc-1",
    value: 5000,
  },
  {
    id: "eps-2",
    employeeId: "user_2fAbcDef123Example",
    componentId: "pc-2",
    value: 1000,
  },
  {
    id: "eps-3",
    employeeId: "user_2fAbcDef123Example",
    componentId: "pc-3",
    value: 750,
  },
  {
    id: "eps-4",
    employeeId: "user_2fAbcDef123Example",
    componentId: "pc-4",
    value: 150,
  },
  {
    id: "eps-5",
    employeeId: "user_2fGhiJkl456Example",
    componentId: "pc-1",
    value: 6000,
  },
];

export const populatedEmployeePayrollSettings = employeePayrollSettings.map(
  (s) => {
    const emp = allEmployees.find((e) => e.id === s.employeeId);
    const comp = allPayrollComponents.find((c) => c.id === s.componentId);
    return {
      id: s.id,
      employeeName: emp?.name || "Unknown",
      componentName: comp?.name || "Unknown",
      componentType: comp?.type || "Earning",
      value: s.value,
    };
  }
);

const payslip1Details: PayslipDetailsItem[] = [
  { name: "Basic Salary", type: "Earning", value: 5000 },
  { name: "Housing Allowance", type: "Earning", value: 1000 },
  { name: "Income Tax", type: "Deduction", value: 750 },
  { name: "Health Insurance", type: "Deduction", value: 150 },
];

export const allPayslips: MockPayslip[] = [
  {
    id: "ps-1",
    employee_id: "user_2fAbcDef123Example",
    pay_period_start: new Date("2024-05-01"),
    pay_period_end: new Date("2024-05-31"),
    gross_earnings: "6000.00",
    total_deductions: "900.00",
    net_pay: "5100.00",
    details: payslip1Details,
    created_at: new Date("2024-06-01"),
  },
];

// --- PERMISSIONS MOCK DATA ---
// This is now managed in the database.
// This array is kept to avoid breaking other mock data dependencies if any.
export const allScreenPermissions: PopulatedScreenPermission[] = [];
