"use client";

import type { PopulatedPayslip } from "@/lib/data";
import { PayslipView } from "@/components/app/payslip-view";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";

type PrintPayslipClientPageProps = {
  payslip: PopulatedPayslip;
};

export function PrintPayslipClientPage({ payslip }: PrintPayslipClientPageProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:py-0">
      {/* GLOBAL PRINT-SPECIFIC CSS RULES */}
      <style jsx global>{`
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          .no-print {
            display: none !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* SCREEN ACTION TOOLBAR (Hidden in Print View) */}
      <div className="max-w-4xl mx-auto mb-6 no-print print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/payroll/payslips/${payslip.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Link>
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Payslip Print Preview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {payslip.employeeName} • {payslip.payPeriod}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            <Printer className="mr-2 h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* PAYSLIP DOCUMENT CONTAINER */}
      <main className="max-w-4xl mx-auto print:max-w-none">
        <PayslipView payslip={payslip} />
      </main>
    </div>
  );
}
