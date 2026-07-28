import { CarryForwardPoliciesTable } from '@/components/app/carry-forward-policies-table';
import { CreateCarryForwardPolicyDialog } from '@/components/app/create-carry-forward-policy-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCarryForwardPolicies, getLeaveTypes } from '@/lib/data';

export default async function CarryForwardPage() {
  const populatedPolicies = await getCarryForwardPolicies();
  const allLeaveTypes = await getLeaveTypes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Carry-Forward Policy</h1>
                <p className="text-muted-foreground">Manage rules for carrying unused leave to the next year.</p>
            </div>
            <CreateCarryForwardPolicyDialog leaveTypes={allLeaveTypes} />
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Carry-Forward Policies</CardTitle>
          <CardDescription>A list of all active carry-forward rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <CarryForwardPoliciesTable policies={populatedPolicies} leaveTypes={allLeaveTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
