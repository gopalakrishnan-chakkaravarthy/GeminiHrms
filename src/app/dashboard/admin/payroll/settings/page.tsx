import { EmployeePayrollSettingsTable } from "@/components/app/employee-payroll-settings-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getPopulatedEmployeePayrollSettings,
  getEmployees,
  getPayrollComponents,
} from "@/lib/data";
import { AssignPayrollComponentTrigger } from "@/components/app/assign-payroll-component-trigger";

export default async function PayrollSettingsPage() {
  const allSettings = await getPopulatedEmployeePayrollSettings();
  const allEmployees = await getEmployees();
  const allComponents = await getPayrollComponents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
            Employee Payroll Settings
          </h1>
          <p className="text-muted-foreground">
            Assign payroll components and their values to individual employees.
          </p>
        </div>
        <AssignPayrollComponentTrigger
          employees={allEmployees}
          components={allComponents}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employee Settings</CardTitle>
          <CardDescription>
            A list of all employee-specific payroll configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeePayrollSettingsTable
            settings={allSettings}
            employees={allEmployees}
            components={allComponents}
          />
        </CardContent>
      </Card>
    </div>
  );
}
