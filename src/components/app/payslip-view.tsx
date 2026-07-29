"use client";

import type { PopulatedPayslip } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Leaf, Building2, User, Calendar, CreditCard, ShieldCheck, FileCheck2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type PayslipViewProps = {
  payslip: PopulatedPayslip;
};

export function PayslipView({ payslip }: PayslipViewProps) {
  const [formattedCreatedAt, setFormattedCreatedAt] = useState<string | null>(null);
  const [paySlipRef, setPaySlipRef] = useState<string>("");

  useEffect(() => {
    setFormattedCreatedAt(
      new Date(payslip.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setPaySlipRef(`PAY-${payslip.id.slice(0, 8).toUpperCase()}`);
  }, [payslip.createdAt, payslip.id]);

  const earnings = payslip.details.filter((d) => d.type === "Earning");
  const deductions = payslip.details.filter((d) => d.type === "Deduction");

  return (
    <div className="bg-white text-slate-900 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none max-w-4xl mx-auto font-sans leading-relaxed">
      
      {/* PROFESSIONAL COMPANY HEADER WITH BRANDING */}
      <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-200 print:pb-4 break-inside-avoid print:break-inside-avoid">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm print:bg-emerald-600 print:text-white shrink-0">
            <Leaf className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
                AbsenceAce Inc.
              </h1>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 print:bg-emerald-50 print:text-emerald-700">
                Official Document
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Human Resources & Payroll Administration
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              123 Corporate Blvd, Suite 500 • San Francisco, CA 94105 • EIN: 12-3456789
            </p>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 w-full sm:w-auto flex flex-col sm:items-end">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md print:bg-emerald-50 print:text-emerald-700 inline-block w-fit">
            PAYSLIP STATEMENT
          </span>
          <p className="text-xs font-mono font-medium text-slate-500 mt-1.5">
            Ref: <span className="text-slate-800 font-bold">{paySlipRef || "PAY-XXXXXX"}</span>
          </p>
        </div>
      </header>

      {/* METADATA GRID LAYOUT (Print-Optimized) */}
      <section className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 my-6 break-inside-avoid print:break-inside-avoid">
        {/* Employee Info Card */}
        <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200/80 print:bg-slate-50 print:border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2.5">
            <User className="h-3.5 w-3.5 text-emerald-600" />
            <span>Employee Information</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-slate-500">Name:</span>{" "}
              <span className="font-semibold text-slate-900">{payslip.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-500">Department:</span>{" "}
              <span className="font-medium text-slate-800">{payslip.departmentName}</span>
            </div>
            <div>
              <span className="text-slate-500">Role:</span>{" "}
              <span className="font-medium text-slate-800">{payslip.roleName}</span>
            </div>
          </div>
        </div>

        {/* Pay Period Card */}
        <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200/80 print:bg-slate-50 print:border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span>Pay Period & Date</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-slate-500">Pay Period:</span>{" "}
              <span className="font-semibold text-slate-900">{payslip.payPeriod}</span>
            </div>
            <div>
              <span className="text-slate-500">Issue Date:</span>{" "}
              {formattedCreatedAt ? (
                <span className="font-medium text-slate-800">{formattedCreatedAt}</span>
              ) : (
                <Skeleton className="h-4 w-24 inline-block align-middle" />
              )}
            </div>
            <div>
              <span className="text-slate-500">Frequency:</span>{" "}
              <span className="font-medium text-slate-800">Monthly</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200/80 print:bg-slate-50 print:border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2.5">
            <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
            <span>Disbursement Details</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-slate-500">Payment Status:</span>{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded text-[11px] print:bg-emerald-100">
                <FileCheck2 className="h-3 w-3" /> Processed
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payment Method:</span>{" "}
              <span className="font-medium text-slate-800">Direct Deposit (ACH)</span>
            </div>
            <div>
              <span className="text-slate-500">Currency:</span>{" "}
              <span className="font-medium text-slate-800">USD ($)</span>
            </div>
          </div>
        </div>
      </section>

      {/* EARNINGS & DEDUCTIONS PRINT GRID LAYOUT */}
      <section className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 my-6 break-inside-avoid print:break-inside-avoid">
        {/* Earnings Column */}
        <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="bg-emerald-700 text-white px-4 py-2.5 flex justify-between items-center print:bg-emerald-800">
              <h3 className="text-xs font-bold uppercase tracking-wider">Earnings</h3>
              <span className="text-[11px] font-medium opacity-90">Amount ($)</span>
            </div>
            <div className="p-3 divide-y divide-slate-100">
              {earnings.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 italic text-center">No earnings detailed</p>
              ) : (
                earnings.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex justify-between items-center py-2 text-xs"
                  >
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="font-mono font-medium text-slate-900">${item.value.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-emerald-50/70 border-t border-emerald-100 p-3 flex justify-between items-center text-xs font-bold text-emerald-950 print:bg-emerald-50">
            <span>Total Gross Earnings</span>
            <span className="font-mono text-emerald-700 text-sm">${payslip.grossEarnings.toFixed(2)}</span>
          </div>
        </div>

        {/* Deductions Column */}
        <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between print:border-slate-300">
          <div>
            <div className="bg-slate-700 text-white px-4 py-2.5 flex justify-between items-center print:bg-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider">Deductions</h3>
              <span className="text-[11px] font-medium opacity-90">Amount ($)</span>
            </div>
            <div className="p-3 divide-y divide-slate-100">
              {deductions.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 italic text-center">No deductions applied</p>
              ) : (
                deductions.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex justify-between items-center py-2 text-xs"
                  >
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="font-mono font-medium text-rose-700">-${item.value.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-slate-100/70 border-t border-slate-200 p-3 flex justify-between items-center text-xs font-bold text-slate-900 print:bg-slate-100">
            <span>Total Deductions</span>
            <span className="font-mono text-rose-700 text-sm">-${payslip.totalDeductions.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* NET PAY HIGHLIGHT SUMMARY */}
      <section className="bg-emerald-900 text-white p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6 print:bg-emerald-900 print:text-white print:rounded-lg break-inside-avoid print:break-inside-avoid">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-100">
              Net Payable Amount
            </h3>
          </div>
          <p className="text-xs text-emerald-200/90 mt-1">
            Total take-home pay credited for period {payslip.payPeriod}
          </p>
        </div>
        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-800 w-full sm:w-auto">
          <p className="text-3xl font-extrabold font-mono text-white tracking-tight">
            ${payslip.netPay.toFixed(2)}
          </p>
          <p className="text-[10px] text-emerald-300 mt-0.5 uppercase tracking-widest font-semibold">
            US Dollars
          </p>
        </div>
      </section>

      {/* SIGNATURES & OFFICIAL FOOTER */}
      <footer className="mt-8 pt-6 border-t border-slate-200 break-inside-avoid print:break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 mb-6 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700 mb-8">Authorized Employer Representative</p>
            <div className="border-b border-dashed border-slate-400 w-4/5 pb-1">
              <span className="text-[10px] text-slate-400 italic">Signature / Digital Verification</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-1">AbsenceAce Payroll Department</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="font-semibold text-slate-700 mb-8">Employee Acknowledgement</p>
            <div className="border-b border-dashed border-slate-400 w-4/5 pb-1">
              <span className="text-[10px] text-slate-400 italic">Signature</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-1">{payslip.employeeName}</p>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>This statement is computer-generated by AbsenceAce HRMS and constitutes an official record of earnings and tax withholdings.</p>
          <p className="font-mono text-[10px]">Document Hash: {payslip.id} • Generated on {formattedCreatedAt || "N/A"}</p>
        </div>
      </footer>
    </div>
  );
}
