import { LeaveTypesTable } from "@/components/app/leave-types-table";
import { CreateLeaveTypeDialog } from "@/components/app/create-leave-type-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getLeaveTypes } from "@/lib/data";

export default async function LeaveTypesPage() {
  const allLeaveTypes = await getLeaveTypes();
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Leave Type Management
          </h1>
          <p className="text-muted-foreground">
            Manage the types of leave available in your organization.
          </p>
        </div>
        <CreateLeaveTypeDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Leave Types</CardTitle>
          <CardDescription>
            A list of all available leave types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveTypesTable leaveTypes={allLeaveTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
