import { PayslipsTable } from "@/components/app/payslips-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPayslips } from "@/lib/data";
import { StatCard } from "@/components/app/stat-card";
import { FileText, DollarSign, Receipt, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default async function PayslipsPage() {
  const allPayslips = await getPayslips();

  const now = new Date();
  const currentMonthName = format(now, "MMMM yyyy");
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month payslips (matching created date or pay period)
  const currentMonthPayslips = allPayslips.filter((p) => {
    const d = p.createdAt ? new Date(p.createdAt) : p.payPeriodStart ? new Date(p.payPeriodStart) : null;
    return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthCount = currentMonthPayslips.length;
  const currentMonthExpenditure = currentMonthPayslips.reduce(
    (acc, p) => acc + (p.netPay || 0),
    0
  );

  // All time metrics
  const totalCount = allPayslips.length;
  const totalExpenditure = allPayslips.reduce(
    (acc, p) => acc + (p.netPay || 0),
    0
  );

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Historical Payslips</h1>
        <p className="text-muted-foreground">View and manage all previously generated payslips.</p>
      </div>

      {/* SUMMARY METRICS WIDGET */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Processed"
          value={currentMonthCount}
          icon={Receipt}
          description={`Payslips generated in ${currentMonthName}`}
        />
        <StatCard
          title="Monthly Expenditure"
          value={formatCurrency(currentMonthExpenditure)}
          icon={DollarSign}
          description={`Net payout for ${currentMonthName}`}
        />
        <StatCard
          title="Total Processed"
          value={totalCount}
          icon={FileText}
          description="All-time historical payslip records"
        />
        <StatCard
          title="Total Expenditure"
          value={formatCurrency(totalExpenditure)}
          icon={CreditCard}
          description="Cumulative net payroll payout"
        />
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
