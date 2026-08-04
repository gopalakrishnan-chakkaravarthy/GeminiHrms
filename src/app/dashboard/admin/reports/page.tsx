import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getLeaveReportByPeriod,
  getAllLeaveRequests,
  getEmployees,
  getLeaveTypes,
  getLeaveReportByDepartment,
  getLeaveReportByEmployee,
} from "@/lib/data";
import { ReportsChart } from "@/components/app/reports-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/app/stat-card";
import { LeaveRequestsTable } from "@/components/app/leave-requests-table";
import { Hourglass, CheckCircle2, XCircle, Calendar, BarChart3, Users, Building2 } from "lucide-react";

export default async function ReportsPage() {
  const allLeaveRequests = await getAllLeaveRequests();
  const allEmployees = await getEmployees();
  const allLeaveTypes = await getLeaveTypes();

  const weeklyData = await getLeaveReportByPeriod("week");
  const monthlyData = await getLeaveReportByPeriod("month");
  const yearlyData = await getLeaveReportByPeriod("year");
  const departmentReport = await getLeaveReportByDepartment();
  const employeeReport = await getLeaveReportByEmployee();

  const pendingRequests = allLeaveRequests.filter((r) => r.status === "Pending");
  const approvedRequests = allLeaveRequests.filter((r) => r.status === "Approved");
  const rejectedRequests = allLeaveRequests.filter((r) => r.status === "Rejected");

  const totalLeaveDays = allLeaveRequests.reduce((acc, r) => acc + (r.days || 0), 0);
  const pendingLeaveDays = pendingRequests.reduce((acc, r) => acc + (r.days || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Leave Reports & Export Hub
        </h1>
        <p className="text-muted-foreground">
          View, audit, and export leave records across all employees.
        </p>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          icon={Hourglass}
          description={`${pendingLeaveDays} total days pending approval`}
        />
        <StatCard
          title="Approved Requests"
          value={approvedRequests.length}
          icon={CheckCircle2}
          description="Total leave requests approved"
        />
        <StatCard
          title="Rejected Requests"
          value={rejectedRequests.length}
          icon={XCircle}
          description="Total leave requests rejected"
        />
        <StatCard
          title="Total Leave Days"
          value={totalLeaveDays}
          icon={Calendar}
          description="Cumulative requested leave days"
        />
      </div>

      {/* MAIN TABBED LEAVE MANAGEMENT & EXPORT */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Reports</CardTitle>
          <CardDescription>
            Filter leave records by status, employee, or leave type and export to Excel or PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="all">
                All Leaves ({allLeaveRequests.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                Trends & Analytics
              </TabsTrigger>
            </TabsList>

            {/* ALL LEAVES TAB */}
            <TabsContent value="all" className="space-y-4">
              <LeaveRequestsTable
                requests={allLeaveRequests}
                variant="admin"
                employees={allEmployees}
                leaveTypes={allLeaveTypes}
                showCreateButton={true}
              />
            </TabsContent>

            {/* PENDING LEAVES TAB */}
            <TabsContent value="pending" className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>
                  Showing all <strong>{pendingRequests.length}</strong> pending leave requests needing administrator action.
                </span>
              </div>
              <LeaveRequestsTable
                requests={pendingRequests}
                variant="admin"
                employees={allEmployees}
                leaveTypes={allLeaveTypes}
              />
            </TabsContent>

            {/* APPROVED LEAVES TAB */}
            <TabsContent value="approved" className="space-y-4">
              <LeaveRequestsTable
                requests={approvedRequests}
                variant="admin"
                employees={allEmployees}
                leaveTypes={allLeaveTypes}
              />
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-6 pt-2">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Leaves by Department
                    </CardTitle>
                    <CardDescription>
                      Approved leave requests count per department.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReportsChart data={departmentReport} dataKey="department" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Top Employees by Leave
                    </CardTitle>
                    <CardDescription>
                      Employees with the most approved leave requests.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReportsChart data={employeeReport} dataKey="employee" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Leave Requests Over Time
                  </CardTitle>
                  <CardDescription>
                    Historical trend analysis by week, month, or year.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="month">
                    <TabsList className="mb-4">
                      <TabsTrigger value="week">Weekly</TabsTrigger>
                      <TabsTrigger value="month">Monthly</TabsTrigger>
                      <TabsTrigger value="year">Yearly</TabsTrigger>
                    </TabsList>
                    <TabsContent value="week">
                      <ReportsChart data={weeklyData} dataKey="week" />
                    </TabsContent>
                    <TabsContent value="month">
                      <ReportsChart data={monthlyData} dataKey="month" />
                    </TabsContent>
                    <TabsContent value="year">
                      <ReportsChart data={yearlyData} dataKey="year" />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
