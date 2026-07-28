import { CompanyCalendar } from "@/components/app/company-calendar";
import { CreateHolidayDialog } from "@/components/app/create-holiday-dialog";
import { HolidaysTable } from "@/components/app/holidays-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllLeaveRequests, getHolidays, getAppUser, getFallbackUserId } from "@/lib/data";
import { auth } from "@clerk/nextjs/server";

export default async function CalendarPage() {
  const currentYear = new Date().getFullYear();
  let userId: string | null = null;
  try {
    const authObj = auth();
    userId = authObj?.userId || null;
  } catch {
    // ignore
  }

  if (!userId) {
    userId = await getFallbackUserId();
  }

  const [approvedLeaves, holidays, user] = await Promise.all([
    getAllLeaveRequests("Approved"),
    getHolidays(currentYear),
    getAppUser(userId),
  ]);

  const isAdmin = user?.roleName === "Administrator";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Company Calendar
          </h1>
          <p className="text-muted-foreground">
            A yearly overview of holidays and approved employee leaves.
          </p>
        </div>
        {isAdmin && <CreateHolidayDialog />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar {currentYear}</CardTitle>
            <CardDescription>
              View all company events at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyCalendar
              approvedLeaves={approvedLeaves}
              holidays={holidays}
            />
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Holidays</CardTitle>
              <CardDescription>
                Add or remove holidays for {currentYear}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HolidaysTable holidays={holidays} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
