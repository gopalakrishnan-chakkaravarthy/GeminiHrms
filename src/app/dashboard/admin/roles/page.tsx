import { RolesTable } from '@/components/app/roles-table';
import { CreateRoleDialog } from '@/components/app/create-role-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getRoles } from '@/lib/data';

export default async function RolesPage() {
  const allRoles = await getRoles();

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Role Management</h1>
                <p className="text-muted-foreground">Create, view, and manage employee roles.</p>
            </div>
            <CreateRoleDialog />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Roles</CardTitle>
                <CardDescription>A list of all roles in your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <RolesTable roles={allRoles} />
            </CardContent>
        </Card>
    </div>
  );
}
