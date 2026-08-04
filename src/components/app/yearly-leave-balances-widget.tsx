"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  User,
  Plane,
  HeartPulse,
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Users,
  PieChart,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getYearlyLeaveBalancesAction } from "@/app/dashboard/actions";
import type { EmployeeYearlyLeaveBalance } from "@/lib/data";
import { cn } from "@/lib/utils";

const iconMap: { [key: string]: any } = {
  Plane,
  HeartPulse,
  User,
  Heart,
};

type YearlyLeaveBalancesWidgetProps = {
  initialData: EmployeeYearlyLeaveBalance[];
  variant?: "admin" | "manager" | "employee";
  currentUserId?: string;
};

export function YearlyLeaveBalancesWidget({
  initialData,
  variant = "admin",
  currentUserId,
}: YearlyLeaveBalancesWidgetProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<EmployeeYearlyLeaveBalance[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const availableYears = useMemo(() => {
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }, [currentYear]);

  const handleYearChange = (yearStr: string) => {
    const yearNum = Number(yearStr);
    setSelectedYear(yearNum);
    startTransition(async () => {
      const updated = await getYearlyLeaveBalancesAction({
        year: yearNum,
        managerId: variant === "manager" ? currentUserId : undefined,
      });
      setData(updated);
    });
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return data.filter((emp) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        emp.employeeName.toLowerCase().includes(query) ||
        emp.employeeEmail.toLowerCase().includes(query) ||
        emp.departmentName.toLowerCase().includes(query) ||
        emp.roleName.toLowerCase().includes(query);

      const matchesEmp =
        selectedEmployeeId === "all" || emp.employeeId === selectedEmployeeId;

      return matchesSearch && matchesEmp;
    });
  }, [data, searchQuery, selectedEmployeeId]);

  // Combined totals across filtered set
  const summaryTotals = useMemo(() => {
    let allocated = 0;
    let used = 0;
    let pending = 0;
    let available = 0;

    const leaveTypeBreakdown: {
      [key: string]: {
        allocated: number;
        used: number;
        pending: number;
        available: number;
      };
    } = {};

    filteredEmployees.forEach((emp) => {
      allocated += emp.totalAllocated;
      used += emp.totalUsed;
      pending += emp.totalPending;
      available += emp.totalAvailable;

      emp.balances.forEach((b) => {
        if (!leaveTypeBreakdown[b.leaveTypeName]) {
          leaveTypeBreakdown[b.leaveTypeName] = {
            allocated: 0,
            used: 0,
            pending: 0,
            available: 0,
          };
        }
        leaveTypeBreakdown[b.leaveTypeName].allocated += b.allocatedDays;
        leaveTypeBreakdown[b.leaveTypeName].used += b.usedDays;
        leaveTypeBreakdown[b.leaveTypeName].pending += b.pendingDays;
        leaveTypeBreakdown[b.leaveTypeName].available += b.availableDays;
      });
    });

    return {
      allocated,
      used,
      pending,
      available,
      leaveTypeBreakdown,
    };
  }, [filteredEmployees]);

  // Single focused employee if one selected
  const focusedEmployee = useMemo(() => {
    if (selectedEmployeeId === "all") return filteredEmployees[0] || null;
    return data.find((e) => e.employeeId === selectedEmployeeId) || null;
  }, [data, selectedEmployeeId, filteredEmployees]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Employee Name",
      "Email",
      "Department",
      "Role",
      "Year",
      "Leave Type",
      "Allocated Days",
      "Used Days",
      "Pending Days",
      "Available Days",
    ];

    const rows: string[][] = [];

    filteredEmployees.forEach((emp) => {
      emp.balances.forEach((b) => {
        rows.push([
          `"${emp.employeeName}"`,
          `"${emp.employeeEmail}"`,
          `"${emp.departmentName}"`,
          `"${emp.roleName}"`,
          `"${selectedYear}"`,
          `"${b.leaveTypeName}"`,
          `"${b.allocatedDays}"`,
          `"${b.usedDays}"`,
          `"${b.pendingDays}"`,
          `"${b.availableDays}"`,
        ]);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `yearly_leave_balances_${selectedYear}_${variant}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border shadow-xs bg-card overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Available Leave Balances ({selectedYear})
              </CardTitle>
              {isPending && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <CardDescription className="text-xs pt-1">
              {variant === "admin"
                ? "Yearly breakdown of allocated, used, and remaining leave balances for all employees."
                : variant === "manager"
                ? "View available leave balances for your team members for the selected year."
                : "Your yearly leave allowance, usage, and remaining available days."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-md border text-xs font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground mr-1">Year:</span>
              <Select
                value={selectedYear.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-7 w-28 border-0 p-0 text-xs font-bold focus:ring-0">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent align="end">
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-xs">
                      {y} {y === currentYear ? "(Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Selector (Admin / Manager) */}
            {variant !== "employee" && data.length > 0 && (
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger className="h-9 w-44 text-xs bg-white dark:bg-slate-950">
                  <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all" className="text-xs font-semibold">
                    All Employees ({data.length})
                  </SelectItem>
                  {data.map((emp) => (
                    <SelectItem
                      key={emp.employeeId}
                      value={emp.employeeId}
                      className="text-xs"
                    >
                      {emp.employeeName} ({emp.departmentName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleExportCSV}
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* KPI Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
              Total Allocated
            </span>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-900 dark:text-slate-100">
              {summaryTotals.allocated} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Year {selectedYear} total allowance</p>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium uppercase tracking-wider block">
              Leave Taken / Used
            </span>
            <div className="text-2xl font-bold font-mono mt-1 text-blue-900 dark:text-blue-200">
              {summaryTotals.used} <span className="text-xs font-normal text-blue-600/70">days</span>
            </div>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-0.5">Approved requests in {selectedYear}</p>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium uppercase tracking-wider block">
              Pending Requests
            </span>
            <div className="text-2xl font-bold font-mono mt-1 text-amber-900 dark:text-amber-200">
              {summaryTotals.pending} <span className="text-xs font-normal text-amber-600/70">days</span>
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400 mt-0.5">Awaiting manager approval</p>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="text-2xl font-bold font-mono mt-1 text-emerald-900 dark:text-emerald-200">
              {summaryTotals.available} <span className="text-xs font-normal text-emerald-600/70">days</span>
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">Remaining for {selectedYear}</p>
          </div>
        </div>

        <Tabs defaultValue="breakdown" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b">
            <TabsList className="h-9">
              <TabsTrigger value="breakdown" className="text-xs">
                Leave Type Breakdown
              </TabsTrigger>
              {variant !== "employee" && (
                <TabsTrigger value="table" className="text-xs">
                  Employee Table ({filteredEmployees.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Search Input for Table / Cards */}
            {variant !== "employee" && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filter by name or dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            )}
          </div>

          {/* TAB 1: BREAKDOWN CARDS */}
          <TabsContent value="breakdown" className="pt-4 space-y-4">
            {focusedEmployee && selectedEmployeeId !== "all" && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border text-xs mb-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {focusedEmployee.employeeName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {focusedEmployee.employeeName} ({focusedEmployee.roleName})
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Department: {focusedEmployee.departmentName} | Email: {focusedEmployee.employeeEmail}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(summaryTotals.leaveTypeBreakdown).map(
                ([typeName, stats]) => {
                  const Icon = iconMap[typeName] || User;
                  const pctUsed =
                    stats.allocated > 0
                      ? Math.min(100, Math.round((stats.used / stats.allocated) * 100))
                      : 0;
                  const pctRemaining = 100 - pctUsed;

                  let badgeColor =
                    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
                  let badgeText = "Healthy Balance";

                  if (stats.available <= 2) {
                    badgeColor =
                      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300";
                    badgeText = "Low / Exhausted";
                  } else if (pctUsed > 70) {
                    badgeColor =
                      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
                    badgeText = "Over 70% Used";
                  }

                  return (
                    <Card
                      key={typeName}
                      className="border shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-primary" />
                          {typeName}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0.5", badgeColor)}
                        >
                          {badgeText}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-2">
                        <div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                              {stats.available}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              / {stats.allocated} days allocated
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            Available in {selectedYear}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{stats.used} days used ({pctUsed}%)</span>
                            {stats.pending > 0 && (
                              <span className="text-amber-600 font-medium">
                                {stats.pending} pending
                              </span>
                            )}
                          </div>
                          <Progress
                            value={pctUsed}
                            className="h-2 bg-slate-100 dark:bg-slate-800"
                          />
                        </div>

                        <div className="pt-2 border-t grid grid-cols-3 text-center text-[11px]">
                          <div>
                            <span className="text-muted-foreground block">Allocated</span>
                            <span className="font-semibold font-mono">{stats.allocated}d</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Used</span>
                            <span className="font-semibold font-mono text-blue-600">{stats.used}d</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Left</span>
                            <span className="font-semibold font-mono text-emerald-600">{stats.available}d</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </TabsContent>

          {/* TAB 2: EMPLOYEE TABLE */}
          {variant !== "employee" && (
            <TabsContent value="table" className="pt-4">
              <div className="rounded-md border overflow-x-auto bg-white dark:bg-slate-950">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead className="w-[200px]">Employee</TableHead>
                      <TableHead>Department / Role</TableHead>
                      <TableHead className="text-center">Vacation Left</TableHead>
                      <TableHead className="text-center">Sick Left</TableHead>
                      <TableHead className="text-center">Personal Left</TableHead>
                      <TableHead className="text-right font-bold">
                        Total Available ({selectedYear})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const vacation =
                          emp.balances.find((b) => b.leaveTypeName === "Vacation") ||
                          emp.balances[0];
                        const sick =
                          emp.balances.find((b) => b.leaveTypeName === "Sick Leave") ||
                          emp.balances[1];
                        const personal =
                          emp.balances.find((b) => b.leaveTypeName === "Personal Day") ||
                          emp.balances[2];

                        return (
                          <TableRow key={emp.employeeId}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {emp.employeeName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {emp.employeeEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div>{emp.departmentName}</div>
                              <div className="text-muted-foreground">{emp.roleName}</div>
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              <span className="font-semibold">
                                {vacation ? vacation.availableDays : 0}d
                              </span>{" "}
                              <span className="text-muted-foreground text-[10px]">
                                / {vacation ? vacation.allocatedDays : 0}d
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              <span className="font-semibold">
                                {sick ? sick.availableDays : 0}d
                              </span>{" "}
                              <span className="text-muted-foreground text-[10px]">
                                / {sick ? sick.allocatedDays : 0}d
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              <span className="font-semibold">
                                {personal ? personal.availableDays : 0}d
                              </span>{" "}
                              <span className="text-muted-foreground text-[10px]">
                                / {personal ? personal.allocatedDays : 0}d
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono font-bold text-xs px-2.5 py-1",
                                  emp.totalAvailable <= 3
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}
                              >
                                {emp.totalAvailable} Days Left
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No employee balances found for the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
