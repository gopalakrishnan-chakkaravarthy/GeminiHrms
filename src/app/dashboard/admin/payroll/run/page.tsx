import { RunPayrollForm } from "@/components/app/run-payroll-form";
import { getEmployees } from "@/lib/data";

export default async function RunPayrollPage() {
  const employees = await getEmployees();

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Run Payroll</h1>
            <p className="text-muted-foreground">Select employees and a pay period to generate payslips.</p>
        </div>
        <RunPayrollForm employees={employees} />
    </div>
  );
}
