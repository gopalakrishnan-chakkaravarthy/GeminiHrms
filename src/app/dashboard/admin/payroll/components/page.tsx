import { PayrollComponentsTable, CreatePayrollComponentDialog } from '@/components/app/payroll-components-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPayrollComponents } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function PayrollComponentsPage() {
  const allComponents = await getPayrollComponents();
  const earnings = allComponents.filter(c => c.type === 'Earning');
  const deductions = allComponents.filter(c => c.type === 'Deduction');
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Payroll Components</h1>
                <p className="text-muted-foreground">Manage the building blocks of your payroll, such as earnings and deductions.</p>
            </div>
            <CreatePayrollComponentDialog />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Payroll Components</CardTitle>
                <CardDescription>A list of all earnings and deductions defined in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="earnings">
                    <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
                        <TabsTrigger value="earnings">Earnings</TabsTrigger>
                        <TabsTrigger value="deductions">Deductions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="earnings">
                        <PayrollComponentsTable components={earnings} />
                    </TabsContent>
                    <TabsContent value="deductions">
                        <PayrollComponentsTable components={deductions} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
