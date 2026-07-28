import { EmployeesTable } from '@/components/app/employees-table';
import { CreateEmployeeDialog } from '@/components/app/create-employee-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEmployees, getRoles, getDepartments } from '@/lib/data';

export default async function EmployeesPage() {
  const allEmployees = await getEmployees();
  const allRoles = await getRoles();
  const allDepartments = await getDepartments();
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Employee Management</h1>
                <p className="text-muted-foreground">View and manage employee details, roles, and departments.</p>
            </div>
            <CreateEmployeeDialog roles={allRoles} departments={allDepartments} employees={allEmployees} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Employees</CardTitle>
                <CardDescription>A list of all employees in your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <EmployeesTable employees={allEmployees} roles={allRoles} departments={allDepartments} />
            </CardContent>
        </Card>
    </div>
  );
}
