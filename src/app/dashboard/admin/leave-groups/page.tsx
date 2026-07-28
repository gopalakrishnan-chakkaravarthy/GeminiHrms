import { LeaveGroupsTable } from '@/components/app/leave-groups-table';
import { CreateLeaveGroupDialog } from '@/components/app/create-leave-group-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getLeaveGroups, getRoles, getLeaveTypes } from '@/lib/data';

export default async function LeaveGroupsPage() {
  const populatedLeaveGroups = await getLeaveGroups();
  const allRoles = await getRoles();
  const allLeaveTypes = await getLeaveTypes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Leave Policy Management</h1>
                <p className="text-muted-foreground">Assign leave types and day allowances to roles.</p>
            </div>
            <CreateLeaveGroupDialog roles={allRoles} leaveTypes={allLeaveTypes} />
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Policies</CardTitle>
          <CardDescription>A list of all leave entitlement policies.</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveGroupsTable leaveGroups={populatedLeaveGroups} roles={allRoles} leaveTypes={allLeaveTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
