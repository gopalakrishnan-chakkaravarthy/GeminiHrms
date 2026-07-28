import { DepartmentsTable } from '@/components/app/departments-table';
import { CreateDepartmentDialog } from '@/components/app/departments-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDepartments } from '@/lib/data';

export default async function DepartmentsPage() {
  const allDepartments = await getDepartments();
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Department Management</h1>
                <p className="text-muted-foreground">Create, view, and manage company departments.</p>
            </div>
            <CreateDepartmentDialog />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Departments</CardTitle>
                <CardDescription>A list of all departments in your organization.</CardDescription>
            </CardHeader>
            <CardContent>
                <DepartmentsTable departments={allDepartments} />
            </CardContent>
        </Card>
    </div>
  );
}
