import { PayslipsTable } from "@/components/app/payslips-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPayslips } from "@/lib/data";

export default async function PayslipsPage() {
  const allPayslips = await getPayslips();
  
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Historical Payslips</h1>
            <p className="text-muted-foreground">View and manage all previously generated payslips.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Payslips</CardTitle>
                <CardDescription>A record of all payslips generated in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <PayslipsTable payslips={allPayslips} />
            </CardContent>
        </Card>
    </div>
  );
}
