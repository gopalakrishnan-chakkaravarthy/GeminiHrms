"use client";

import { useState, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Printer, Trash2 } from "lucide-react";
import Link from 'next/link';
import type { PopulatedPayslipSummary } from "@/lib/data";
import { format } from "date-fns";
import { deletePayslipAction } from '@/app/dashboard/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

type PayslipsTableProps = {
  payslips: PopulatedPayslipSummary[];
};

export function PayslipsTable({ payslips }: PayslipsTableProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PopulatedPayslipSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const formatDate = (date: Date | string) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "MMM dd, yyyy");
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
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setIsDeleteOpen(false);
      setSelectedPayslip(null);
    });
  };

  return (
    <>
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
          {payslips.map((payslip) => (
            <TableRow key={payslip.id}>
              <TableCell className="font-medium">{payslip.employeeName}</TableCell>
              <TableCell>{formatDate(payslip.payPeriodStart)} - {formatDate(payslip.payPeriodEnd)}</TableCell>
              <TableCell className="text-right font-semibold">${payslip.netPay.toFixed(2)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatDate(payslip.createdAt)}</TableCell>
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
                          <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/admin/payroll/payslips/${payslip.id}/print`} target="_blank">
                          <Printer className="mr-2 h-4 w-4" /> Print
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(payslip)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the payslip record."
      />
    </>
  );
}
