import { PermissionsTable } from '@/components/app/permissions-table';
import { CreatePermissionDialog } from '@/components/app/permissions-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getScreenPermissions, getAppRoutes, getEmployees, getDepartments, getRoles } from '@/lib/data';

export default async function PermissionsPage() {
  const allPermissions = await getScreenPermissions();
  const allRoutes = getAppRoutes();
  const allEmployees = await getEmployees();
  const allDepartments = await getDepartments();
  const allRoles = await getRoles();
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Screen Permissions</h1>
                <p className="text-muted-foreground">Manage which users, departments, or roles can access specific screens.</p>
            </div>
            <CreatePermissionDialog
                routes={allRoutes}
                employees={allEmployees}
                departments={allDepartments}
                roles={allRoles}
            />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Screen Permissions</CardTitle>
                <CardDescription>A list of all screen access rules in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <PermissionsTable 
                    permissions={allPermissions}
                    routes={allRoutes}
                    employees={allEmployees}
                    departments={allDepartments}
                    roles={allRoles}
                />
            </CardContent>
        </Card>
    </div>
  );
}
