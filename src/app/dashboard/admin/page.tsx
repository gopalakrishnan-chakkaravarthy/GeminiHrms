import { LeaveRequestsTable } from '@/components/app/leave-requests-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    getAllLeaveRequests, 
    getAdminDashboardStats, 
    getLeaveReportByDepartment, 
    getLeaveReportByEmployee,
    getEmployees,
    getLeaveTypes,
    getYearlyLeaveBalances,
} from '@/lib/data';
import { YearlyLeaveBalancesWidget } from '@/components/app/yearly-leave-balances-widget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, ShieldCheck, ClipboardList, UsersRound, Repeat, Users, Building2, BarChart3, Hourglass, Landmark, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/app/stat-card';
import { ReportsChart } from '@/components/app/reports-chart';
import { CreateLeaveOnBehalfDialog } from '@/components/app/create-leave-on-behalf-dialog';
import { isReportsEnabled } from '@/lib/feature-flags';


function ManagementCard({ title, description, href, icon: Icon }: { title: string, description: string, href: string, icon: React.ElementType }) {
    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl font-headline">{title}</CardTitle>
                        <CardDescription className="pt-1">{description}</CardDescription>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" size="sm">
                    <Link href={href}>
                        Manage <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default async function AdminPage() {
  const currentYear = new Date().getFullYear();
  const [
    allLeaveRequests,
    stats,
    departmentReport,
    employeeReport,
    allEmployees,
    allLeaveTypes,
    yearlyBalances,
  ] = await Promise.all([
    getAllLeaveRequests(),
    getAdminDashboardStats(),
    getLeaveReportByDepartment(),
    getLeaveReportByEmployee(),
    getEmployees(),
    getLeaveTypes(),
    getYearlyLeaveBalances({ year: currentYear }),
  ]);

  const pendingRequests = allLeaveRequests.filter(req => req.status === 'Pending');
  const approvedRequests = allLeaveRequests.filter(req => req.status === 'Approved');
  const rejectedRequests = allLeaveRequests.filter(req => req.status === 'Rejected');

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground">An overview of your entire leave management system.</p>
            </div>
            <CreateLeaveOnBehalfDialog employees={allEmployees} leaveTypes={allLeaveTypes} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Employees" value={stats.employeeCount} icon={Users} />
            <StatCard title="Total Departments" value={stats.departmentCount} icon={Building2} />
            <StatCard title="Total Roles" value={stats.roleCount} icon={ShieldCheck} />
            <StatCard title="Pending Requests" value={stats.pendingRequestsCount} icon={Hourglass} />
        </div>

        {/* Leave Balances Widget */}
        <YearlyLeaveBalancesWidget initialData={yearlyBalances} variant="admin" />

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Leaves by Department</CardTitle>
                    <CardDescription>Approved leave requests per department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportsChart data={departmentReport} dataKey="department" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Employees by Leave</CardTitle>
                    <CardDescription>Employees with the most approved leave requests.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ReportsChart data={employeeReport} dataKey="employee" />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Employee Requests</CardTitle>
                    <CardDescription>Review, approve, or reject pending requests.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                        <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending">
                        <LeaveRequestsTable requests={pendingRequests} variant="admin" employees={allEmployees} leaveTypes={allLeaveTypes} />
                    </TabsContent>
                    <TabsContent value="approved">
                        <LeaveRequestsTable requests={approvedRequests} variant="admin" employees={allEmployees} leaveTypes={allLeaveTypes} />
                    </TabsContent>
                    <TabsContent value="rejected">
                        <LeaveRequestsTable requests={rejectedRequests} variant="admin" employees={allEmployees} leaveTypes={allLeaveTypes} />
                    </TabsContent>
                    <TabsContent value="all">
                        <LeaveRequestsTable requests={allLeaveRequests} variant="admin" employees={allEmployees} leaveTypes={allLeaveTypes} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Management Sections</CardTitle>
                <CardDescription>Manage core components of the system.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 <ManagementCard 
                    title="Employees" 
                    description="View & manage employee details." 
                    href="/dashboard/admin/employees"
                    icon={Users}
                />
                <ManagementCard 
                    title="Departments" 
                    description="Create & manage departments." 
                    href="/dashboard/admin/departments"
                    icon={Building2}
                />
                 <ManagementCard 
                    title="Roles" 
                    description="Define & manage employee roles." 
                    href="/dashboard/admin/roles"
                    icon={ShieldCheck}
                />
                <ManagementCard 
                    title="Leave Types"
                    description="Configure available leave types." 
                    href="/dashboard/admin/leave-types"
                    icon={ClipboardList}
                />
                 <ManagementCard 
                    title="Leave Policies" 
                    description="Assign leave allowances to roles." 
                    href="/dashboard/admin/leave-groups"
                    icon={UsersRound}
                />
                <ManagementCard 
                    title="Carry-Forward"
                    description="Set rules for unused leave." 
                    href="/dashboard/admin/carry-forward"
                    icon={Repeat}
                />
                {isReportsEnabled() && (
                  <ManagementCard 
                      title="Reports"
                      description="View leave trend reports." 
                      href="/dashboard/admin/reports"
                      icon={BarChart3}
                  />
                )}
                <ManagementCard 
                    title="Payroll"
                    description="Manage payroll and payslips." 
                    href="/dashboard/admin/payroll"
                    icon={Landmark}
                />
                <ManagementCard 
                    title="Permissions"
                    description="Control user access to screens." 
                    href="/dashboard/admin/permissions"
                    icon={Lock}
                />
            </CardContent>
        </Card>
    </div>
  );
}
