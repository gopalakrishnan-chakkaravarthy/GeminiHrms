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
  signInTime?: string;
  graceTimeMinutes?: number;
  businessAddress?: string;
  businessLatitude?: number;
  businessLongitude?: number;
  allowedRadiusMeters?: number;
};

export type AttendanceLog = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  departmentName?: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInLat: number | null;
  punchInLng: number | null;
  punchInPhoto: string | null;
  distanceMeters: number | null;
  status: 'PUNCHED_IN' | 'PUNCHED_OUT' | 'LATE_PUNCH_IN' | 'DAY_OFF' | 'ABSENT';
  createdAt?: string;
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
  status?: string;
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
  {
    id: "dept-1",
    name: "Engineering",
    signInTime: "09:00",
    graceTimeMinutes: 15,
    businessAddress: "100 Tech Park Way, San Francisco, CA 94105",
    businessLatitude: 37.7749,
    businessLongitude: -122.4194,
    allowedRadiusMeters: 500,
  },
  {
    id: "dept-2",
    name: "Product",
    signInTime: "09:30",
    graceTimeMinutes: 20,
    businessAddress: "200 Silicon Avenue, San Jose, CA 95113",
    businessLatitude: 37.3382,
    businessLongitude: -121.8863,
    allowedRadiusMeters: 500,
  },
  {
    id: "dept-3",
    name: "Design",
    signInTime: "09:00",
    graceTimeMinutes: 15,
    businessAddress: "300 Creative Studio Blvd, Los Angeles, CA 90012",
    businessLatitude: 34.0522,
    businessLongitude: -118.2437,
    allowedRadiusMeters: 500,
  },
  {
    id: "dept-4",
    name: "Human Resources",
    signInTime: "08:30",
    graceTimeMinutes: 15,
    businessAddress: "400 Corporate Plaza, San Francisco, CA 94105",
    businessLatitude: 37.7749,
    businessLongitude: -122.4194,
    allowedRadiusMeters: 500,
  },
];

export const allAttendanceLogs: AttendanceLog[] = [
  {
    id: "att-1",
    employeeId: "user-1",
    employeeName: "Alice Johnson",
    employeeEmail: "alice@example.com",
    departmentName: "Engineering",
    date: new Date().toISOString().split("T")[0],
    punchInTime: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    punchInLat: 37.7750,
    punchInLng: -122.4190,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%2310b981'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>Alice Verified</text></svg>",
    distanceMeters: 42,
    status: "PUNCHED_OUT",
    createdAt: new Date().toISOString(),
  },
  {
    id: "att-2",
    employeeId: "user-2",
    employeeName: "Bob Smith",
    employeeEmail: "bob@example.com",
    departmentName: "Product",
    date: new Date().toISOString().split("T")[0],
    punchInTime: new Date(new Date().setHours(9, 45, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date().setHours(20, 15, 0, 0)).toISOString(),
    punchInLat: 37.3385,
    punchInLng: -121.8860,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%233b82f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>Bob Verified</text></svg>",
    distanceMeters: 65,
    status: "LATE_PUNCH_IN",
    createdAt: new Date().toISOString(),
  },
  {
    id: "att-3",
    employeeId: "user-3",
    employeeName: "Carol Danvers",
    employeeEmail: "carol@example.com",
    departmentName: "Design",
    date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0], // Yesterday
    punchInTime: new Date(new Date(Date.now() - 86400000 * 1).setHours(8, 0, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date(Date.now() - 86400000 * 1).setHours(21, 10, 0, 0)).toISOString(),
    punchInLat: 34.0525,
    punchInLng: -118.2430,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%238b5cf6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>Carol Verified</text></svg>",
    distanceMeters: 18,
    status: "PUNCHED_OUT",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "att-4",
    employeeId: "user-4",
    employeeName: "David Lee",
    employeeEmail: "david@example.com",
    departmentName: "Human Resources",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    punchInTime: new Date(new Date(Date.now() - 86400000 * 2).setHours(9, 25, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date(Date.now() - 86400000 * 2).setHours(17, 0, 0, 0)).toISOString(),
    punchInLat: 37.7752,
    punchInLng: -122.4192,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f59e0b'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>David Verified</text></svg>",
    distanceMeters: 30,
    status: "LATE_PUNCH_IN",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "att-5",
    employeeId: "user-1",
    employeeName: "Alice Johnson",
    employeeEmail: "alice@example.com",
    departmentName: "Engineering",
    date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    punchInTime: new Date(new Date(Date.now() - 86400000 * 3).setHours(8, 5, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date(Date.now() - 86400000 * 3).setHours(19, 45, 0, 0)).toISOString(),
    punchInLat: 37.7749,
    punchInLng: -122.4194,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%2310b981'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>Alice Verified</text></svg>",
    distanceMeters: 10,
    status: "PUNCHED_OUT",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "att-6",
    employeeId: "user-5",
    employeeName: "Emma Watson",
    employeeEmail: "emma@example.com",
    departmentName: "Engineering",
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    punchInTime: new Date(new Date(Date.now() - 86400000 * 5).setHours(7, 50, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date(Date.now() - 86400000 * 5).setHours(17, 0, 0, 0)).toISOString(),
    punchInLat: 37.7748,
    punchInLng: -122.4195,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23ec4899'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>Emma Verified</text></svg>",
    distanceMeters: 12,
    status: "PUNCHED_OUT",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "att-7",
    employeeId: "user-2",
    employeeName: "Bob Smith",
    employeeEmail: "bob@example.com",
    departmentName: "Product",
    date: new Date(Date.now() - 86400000 * 6).toISOString().split("T")[0],
    punchInTime: new Date(new Date(Date.now() - 86400000 * 6).setHours(9, 35, 0, 0)).toISOString(),
    punchOutTime: new Date(new Date(Date.now() - 86400000 * 6).setHours(21, 45, 0, 0)).toISOString(),
    punchInLat: 37.3382,
    punchInLng: -121.8863,
    punchInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%233b82f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='sans-serif'>Bob Verified</text></svg>",
    distanceMeters: 5,
    status: "PUNCHED_OUT",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
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
    description: "The base salary component.",
  },
  {
    id: "pc-2",
    name: "Housing Allowance",
    type: "Earning",
    description: "Allowance for housing (HRA).",
  },
  {
    id: "pc-pf",
    name: "Provident Fund (PF)",
    type: "Deduction",
    description: "Statutory 12% PF contribution on Basic Salary.",
  },
  {
    id: "pc-esi",
    name: "Employee State Insurance (ESI/ESU)",
    type: "Deduction",
    description: "Statutory 0.75% ESI/ESU contribution on Gross Salary.",
  },
  {
    id: "pc-tds",
    name: "Tax Deducted at Source (TDS)",
    type: "Deduction",
    description: "Statutory TDS withheld according to income tax slabs.",
  },
  {
    id: "pc-3",
    name: "Income Tax",
    type: "Deduction",
    description: "Statutory tax withholding.",
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
