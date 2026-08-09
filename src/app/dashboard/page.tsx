import { LeaveBalanceCards } from "@/components/app/leave-balance-cards";
import { LeaveRequestsTable } from "@/components/app/leave-requests-table";
import { RequestLeaveDialog } from "@/components/app/request-leave-dialog";
import { AttendancePunchCard } from "@/components/app/attendance-punch-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getLeaveRequestsForCurrentUser,
  getAppUser,
  getDefaultScreenForUser,
  getLeaveTypes,
  getLeaveBalances,
  getYearlyLeaveBalances,
  getFallbackUserId,
  getTodayAttendanceLog,
  getDepartments,
} from "@/lib/data";
import { YearlyLeaveBalancesWidget } from "@/components/app/yearly-leave-balances-widget";
import { getAuthenticatedUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { runCarryForwardLogicForUser } from "./actions";
import { isPunchInEnabled } from "@/lib/feature-flags";

export default async function DashboardPage() {
  let userId: string | null = null;

  try {
    userId = await getAuthenticatedUserId();
  } catch {
    // ignore
  }

  if (!userId) {
    userId = await getFallbackUserId();
  }

  const defaultScreen = await getDefaultScreenForUser(userId);
  if (defaultScreen && defaultScreen !== "/dashboard") {
    redirect(defaultScreen);
  }

  const appUser = await getAppUser(userId);

  if (!appUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome to AbsenceAce!</CardTitle>
            <CardDescription>Your account is almost ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              It looks like your employee profile hasn't been set up in our
              system yet. Please contact your administrator to get access to
              your leave management dashboard.
            </p>
            <Button asChild>
              <Link href="/">Back to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    // Run carry-forward logic if needed
    await runCarryForwardLogicForUser(userId);
  }

  const currentYear = new Date().getFullYear();
  const [userRequests, leaveTypes, leaveBalances, yearlyBalances, todayLog, departments] = await Promise.all([
    getLeaveRequestsForCurrentUser(userId),
    getLeaveTypes(),
    getLeaveBalances(userId),
    getYearlyLeaveBalances({ year: currentYear, employeeId: userId }),
    getTodayAttendanceLog(userId),
    getDepartments(),
  ]);

  const userDept = departments.find((d) => d.id === appUser.departmentId) || departments[0];
  const displayName = appUser.name || "User";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {displayName}. Here's your attendance and leave summary.
          </p>
        </div>
        <RequestLeaveDialog
          user={appUser}
          leaveTypes={leaveTypes}
          leaveBalances={leaveBalances}
        />
      </div>

      {/* Attendance & Punch In Prompt */}
      {isPunchInEnabled() && userDept && (
        <AttendancePunchCard
          todayLog={todayLog}
          department={userDept}
        />
      )}

      <YearlyLeaveBalancesWidget
        initialData={yearlyBalances}
        variant="employee"
        currentUserId={userId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>
            A summary of your recent and upcoming time off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestsTable
            requests={userRequests}
            variant="user"
            currentUserId={userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
