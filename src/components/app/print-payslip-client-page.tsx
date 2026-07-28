"use client";

import type { PopulatedPayslip } from "@/lib/data";
import { PayslipView } from "@/components/app/payslip-view";

type PrintPayslipClientPageProps = {
    payslip: PopulatedPayslip;
}

export function PrintPayslipClientPage({ payslip }: PrintPayslipClientPageProps) {
    return (
        <div className="max-w-4xl mx-auto p-8 print:p-0">
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                }
            `}</style>
            <PayslipView payslip={payslip} />
        </div>
    );
}
