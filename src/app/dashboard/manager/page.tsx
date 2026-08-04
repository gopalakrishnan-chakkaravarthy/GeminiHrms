import { getLeaveRequestsForManager, getAppUser, getFallbackUserId, getEmployees, getLeaveTypes } from '@/lib/data';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LeaveRequestsTable } from '@/components/app/leave-requests-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Briefcase } from 'lucide-react';
import { CreateLeaveOnBehalfDialog } from '@/components/app/create-leave-on-behalf-dialog';

export default async function ManagerPage() {
    let userId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj?.userId || null;
    } catch {
      // ignore
    }

    if (!userId) {
      userId = await getFallbackUserId();
    }

    const managerRequests = await getLeaveRequestsForManager(userId);
    const allEmployees = await getEmployees();
    const allLeaveTypes = await getLeaveTypes();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Manager Dashboard</h1>
                    <p className="text-muted-foreground">Review and manage leave requests for your direct reports.</p>
                </div>
                <CreateLeaveOnBehalfDialog employees={allEmployees} leaveTypes={allLeaveTypes} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Leave Requests</CardTitle>
                    <CardDescription>A list of pending and historical leave requests from your team.</CardDescription>
                </CardHeader>
                <CardContent>
                    {managerRequests.length > 0 ? (
                        <LeaveRequestsTable
                            requests={managerRequests}
                            variant="manager"
                            currentUserId={userId}
                            employees={allEmployees}
                            leaveTypes={allLeaveTypes}
                        />
                    ) : (
                        <Alert>
                            <Briefcase className="h-4 w-4" />
                            <AlertTitle>All Caught Up!</AlertTitle>
                            <AlertDescription>There are no pending leave requests from your team.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
