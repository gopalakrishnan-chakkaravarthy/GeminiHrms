"use client";

import type { PopulatedPayslip } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type PayslipViewProps = {
  payslip: PopulatedPayslip;
};

export function PayslipView({ payslip }: PayslipViewProps) {
  const [formattedCreatedAt, setFormattedCreatedAt] = useState<string | null>(
    null
  );
  const [currentYear, setCurrentYear] = useState<string | null>(null);

  useEffect(() => {
    // This code runs only on the client, after hydration
    setFormattedCreatedAt(
      new Date(payslip.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setCurrentYear(new Date().getFullYear().toString());
  }, [payslip.createdAt]);

  const earnings = payslip.details.filter((d) => d.type === "Earning");
  const deductions = payslip.details.filter((d) => d.type === "Deduction");

  return (
    <div className="bg-white text-gray-800 p-8 border rounded-lg shadow-sm">
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-4xl font-bold font-headline text-primary">
            Payslip
          </h1>
          <p className="text-gray-500">For pay period: {payslip.payPeriod}</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <h2 className="text-2xl font-bold font-headline text-primary">
              AbsenceAce Inc.
            </h2>
            <p className="text-sm text-gray-500">
              123 Business Rd, Suite 100, Business City, USA
            </p>
          </div>
          <div className="bg-primary p-2 rounded-lg">
            <Leaf className="text-primary-foreground h-6 w-6" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 my-6">
        <div>
          <h3 className="font-semibold text-gray-600 mb-2">Employee Details</h3>
          <div className="text-gray-800 space-y-1">
            <p>
              <span className="font-medium">Name:</span> {payslip.employeeName}
            </p>
            <p>
              <span className="font-medium">Department:</span>{" "}
              {payslip.departmentName}
            </p>
            <p>
              <span className="font-medium">Role:</span> {payslip.roleName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="font-semibold text-gray-600 mb-2">Pay Date</h3>
          {formattedCreatedAt ? (
            <p className="text-gray-800">{formattedCreatedAt}</p>
          ) : (
            <Skeleton className="h-6 w-32 ml-auto" />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-8">
        {/* Earnings */}
        <div>
          <h3 className="text-lg font-semibold text-green-700 bg-green-50 p-3 rounded-t-lg border-b">
            Earnings
          </h3>
          <div className="p-3 bg-gray-50/50 rounded-b-lg">
            {earnings.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center py-2"
              >
                <span>{item.name}</span>
                <span>${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Deductions */}
        <div>
          <h3 className="text-lg font-semibold text-red-700 bg-red-50 p-3 rounded-t-lg border-b">
            Deductions
          </h3>
          <div className="p-3 bg-gray-50/50 rounded-b-lg">
            {deductions.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center py-2"
              >
                <span>{item.name}</span>
                <span>${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="my-6" />

      <section className="grid grid-cols-2 gap-8">
        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Gross Earnings:</span>
            <span className="font-semibold text-green-700">
              ${payslip.grossEarnings.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Deductions:</span>
            <span className="font-semibold text-red-700">
              ${payslip.totalDeductions.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Net Pay */}
        <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center">
          <h3 className="text-xl font-bold text-primary">Net Pay</h3>
          <p className="text-2xl font-bold text-primary">
            ${payslip.netPay.toFixed(2)}
          </p>
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
        <p>
          This is a computer-generated document and does not require a
          signature.
        </p>
        {currentYear ? (
          <p>AbsenceAce Inc. &copy; {currentYear}</p>
        ) : (
          <Skeleton className="h-5 w-40 mx-auto mt-1" />
        )}
      </footer>
    </div>
  );
}
