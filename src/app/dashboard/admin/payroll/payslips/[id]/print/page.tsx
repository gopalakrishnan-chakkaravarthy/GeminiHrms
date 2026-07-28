import { getPayslipById } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { PrintPayslipClientPage } from "@/components/app/print-payslip-client-page";

export default async function PrintPayslipPage({ params }: { params: { id: string } }) {
  const payslip = await getPayslipById(params.id);

  if (!payslip) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payslip Not Found</AlertTitle>
        </Alert>
    )
  }

  return <PrintPayslipClientPage payslip={payslip} />;
}
