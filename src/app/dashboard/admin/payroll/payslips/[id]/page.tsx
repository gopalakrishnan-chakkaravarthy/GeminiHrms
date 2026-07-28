import { getPayslipById } from "@/lib/data";
import { PayslipView } from "@/components/app/payslip-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default async function PayslipDetailsPage({ params }: { params: { id: string } }) {
  const payslip = await getPayslipById(params.id);

  if (!payslip) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payslip Not Found</AlertTitle>
            <AlertDescription>The requested payslip could not be found. It may have been deleted or the ID is incorrect.</AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Payslip Details</h1>
          <p className="text-muted-foreground">Payslip for {payslip.employeeName} for period {payslip.payPeriod}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/payroll/payslips/${params.id}/print`} target="_blank">
            <Printer className="mr-2 h-4 w-4" />
            Print Payslip
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-0">
          <PayslipView payslip={payslip} />
        </CardContent>
      </Card>
    </div>
  );
}
