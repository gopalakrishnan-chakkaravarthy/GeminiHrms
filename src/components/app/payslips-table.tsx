"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Eye,
  Printer,
  Trash2,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Building2,
  Calendar,
  DollarSign,
  Filter,
} from "lucide-react";
import Link from "next/link";
import type { PopulatedPayslipSummary } from "@/lib/data";
import { format } from "date-fns";
import { deletePayslipAction } from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { formatLocalDate } from "@/lib/utils";

type PayslipsTableProps = {
  payslips: PopulatedPayslipSummary[];
};

export function PayslipsTable({ payslips }: PayslipsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] =
    useState<PopulatedPayslipSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return formatLocalDate(date, "MMM dd, yyyy");
  };

  // Derive available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    payslips.forEach((p) => {
      const year = new Date(p.payPeriodStart).getFullYear().toString();
      if (year && !isNaN(Number(year))) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [payslips]);

  // Filtered payslips based on search & year
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.employeeName.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query);

      const year = new Date(p.payPeriodStart).getFullYear().toString();
      const matchesYear = selectedYear === "all" || year === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [payslips, searchQuery, selectedYear]);

  // Calculate totals for filtered payslips
  const totals = useMemo(() => {
    return filteredPayslips.reduce(
      (acc, p) => {
        acc.gross += p.grossEarnings || 0;
        acc.deductions += p.totalDeductions || 0;
        acc.net += p.netPay || 0;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0 }
    );
  }, [filteredPayslips]);

  const hasActiveFilters = searchQuery !== "" || selectedYear !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedYear("all");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayslips.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There are no payslips in the current filtered view to export.",
      });
      return;
    }

    const headers = [
      "Payslip ID",
      "Employee Name",
      "Pay Period Start",
      "Pay Period End",
      "Gross Earnings ($)",
      "Total Deductions ($)",
      "Net Pay ($)",
      "Generated On",
    ];

    const rows = filteredPayslips.map((p) => [
      `"${p.id}"`,
      `"${p.employeeName.replace(/"/g, '""')}"`,
      `"${formatDate(p.payPeriodStart)}"`,
      `"${formatDate(p.payPeriodEnd)}"`,
      `"${(p.grossEarnings || 0).toFixed(2)}"`,
      `"${(p.totalDeductions || 0).toFixed(2)}"`,
      `"${p.netPay.toFixed(2)}"`,
      `"${formatDate(p.createdAt)}"`,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = format(new Date(), "yyyy-MM-dd");
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll-history-report-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported",
      description: `Successfully exported ${filteredPayslips.length} payslips.`,
    });
  };

  const handlePrintPdfReport = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDelete = (payslip: PopulatedPayslipSummary) => {
    setSelectedPayslip(payslip);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPayslip) return;

    startTransition(async () => {
      const result = await deletePayslipAction(selectedPayslip.id);
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setIsDeleteOpen(false);
      setSelectedPayslip(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* GLOBAL PRINT STYLES FOR PDF REPORT MODAL */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payroll-pdf-report-container, #payroll-pdf-report-container * {
            visibility: visible;
          }
          #payroll-pdf-report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* FILTER & EXPORT TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by employee or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-950"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Year Select Filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-white dark:bg-slate-950">
              <Calendar className="mr-2 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Pay Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Years
              </SelectItem>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={yr} className="text-xs">
                  Year {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-9 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* EXPORT REPORT BUTTON DROPDOWN */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 shadow-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Filtered View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleExportCSV}
                className="text-xs cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsPdfModalOpen(true)}
                className="text-xs cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4 text-blue-600" />
                Export / Print PDF Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* FILTER METRICS & STATS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground border-b pb-2">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{filteredPayslips.length}</strong> of{" "}
            {payslips.length} payslips
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              Filtered
            </Badge>
          )}
        </div>

        {filteredPayslips.length > 0 && (
          <div className="flex items-center gap-4 font-mono text-[11px]">
            {totals.gross > 0 && (
              <span>
                Total Gross:{" "}
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                  ${totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
            )}
            <span>
              Total Net Pay:{" "}
              <strong className="text-emerald-600 font-bold">
                ${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* PAYSLIPS TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Pay Period</TableHead>
            <TableHead className="text-right">Net Pay</TableHead>
            <TableHead className="text-right">Generated On</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayslips.length > 0 ? (
            filteredPayslips.map((payslip) => (
              <TableRow key={payslip.id}>
                <TableCell className="font-medium">{payslip.employeeName}</TableCell>
                <TableCell>
                  {formatDate(payslip.payPeriodStart)} - {formatDate(payslip.payPeriodEnd)}
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                  ${payslip.netPay.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDate(payslip.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/payroll/payslips/${payslip.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/admin/payroll/payslips/${payslip.id}/print`}
                          target="_blank"
                        >
                          <Printer className="mr-2 h-4 w-4" /> Print Payslip
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(payslip)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No payslips found matching your search filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* PDF REPORT GENERATION / PRINT MODAL */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="no-print border-b pb-3">
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>Payroll History PDF Report</span>
              <Button
                onClick={handlePrintPdfReport}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A formatted report preview of the currently filtered view. Click "Print / Save PDF" to save or print.
            </DialogDescription>
          </DialogHeader>

          {/* REPORT PREVIEW CONTAINER (Target for print) */}
          <div id="payroll-pdf-report-container" className="space-y-6 pt-2">
            {/* REPORT HEADER */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                  Payroll History Summary Report
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Official Record • Generated on {format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <span className="font-semibold block text-slate-900">Filter Applied:</span>
                <span>Search: {searchQuery || "All Employees"}</span>
                <span className="block">Year: {selectedYear === "all" ? "All Years" : selectedYear}</span>
              </div>
            </div>

            {/* METRICS SUMMARY BOXES */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Records
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  {filteredPayslips.length}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Gross Pay
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  ${totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Net Disbursement
                </span>
                <span className="text-lg font-extrabold text-emerald-700">
                  ${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* DETAILED REPORT TABLE */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Employee Name</th>
                    <th className="p-2.5">Pay Period</th>
                    <th className="p-2.5 text-right">Gross</th>
                    <th className="p-2.5 text-right">Deductions</th>
                    <th className="p-2.5 text-right">Net Pay</th>
                    <th className="p-2.5 text-right">Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayslips.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{p.employeeName}</td>
                      <td className="p-2.5 text-slate-600">
                        {formatDate(p.payPeriodStart)} - {formatDate(p.payPeriodEnd)}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        ${(p.grossEarnings || 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-500">
                        ${(p.totalDeductions || 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ${p.netPay.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500 font-mono text-[10px]">
                        {formatDate(p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER VERIFICATION */}
            <div className="border-t pt-3 text-[10px] text-slate-400 flex justify-between items-center italic">
              <span>Payroll History Summary Report • Confidential</span>
              <span>Total Items: {filteredPayslips.length}</span>
            </div>
          </div>

          <DialogFooter className="no-print pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPdfModalOpen(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrintPdfReport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print / Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the payslip record."
      />
    </div>
  );
}
