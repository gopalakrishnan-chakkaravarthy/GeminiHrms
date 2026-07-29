"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Loader2,
  Eye,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import type { LeaveRequest } from "@/lib/data";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ReviewLeaveRequestDialog } from "./review-leave-request-dialog";
import {
  withdrawLeaveRequestAction,
} from "@/app/dashboard/actions";
import {
  deleteLeaveRequestByManagerAction,
  addEventToGoogleCalendarAction,
} from "@/app/dashboard/admin/actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

type LeaveRequestsTableProps = {
  requests: LeaveRequest[];
  variant?: "user" | "admin" | "manager";
  currentUserId?: string;
};

export function LeaveRequestsTable({
  requests,
  variant = "user",
  currentUserId,
}: LeaveRequestsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<string | null>(
    null
  );

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return formatLocalDate(date, "MMM dd, yyyy");
  };

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const handleReviewClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setReviewOpen(true);
  };

  const handleWithdrawClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setWithdrawOpen(true);
  };

  const handleDeleteClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDeleteOpen(true);
  };

  const onReviewDialogClose = () => {
    setReviewOpen(false);
    setSelectedRequest(null);
  };

  const confirmWithdraw = async () => {
    if (!selectedRequest) return;
    startTransition(async () => {
      const result = await withdrawLeaveRequestAction(selectedRequest.id);
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setWithdrawOpen(false);
      setSelectedRequest(null);
    });
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    startTransition(async () => {
      const result = await deleteLeaveRequestByManagerAction(
        selectedRequest.id
      );
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setDeleteOpen(false);
      setSelectedRequest(null);
    });
  };

  const handleAddToCalendar = (request: LeaveRequest) => {
    startTransition(async () => {
      setIsAddingToCalendar(request.id);
      const startD = parseLocalDate(request.startDate);
      const endD = parseLocalDate(request.endDate);
      endD.setDate(endD.getDate() + 1);

      const result = await addEventToGoogleCalendarAction(
        `Leave: ${request.employeeName} (${request.leaveType})`,
        formatLocalDate(startD, "yyyy-MM-dd"),
        formatLocalDate(endD, "yyyy-MM-dd")
      );

      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setIsAddingToCalendar(null);
    });
  };

  const canWithdraw = (request: LeaveRequest) => {
    return (
      variant === "user" &&
      request.employeeId === currentUserId &&
      request.status === "Pending"
    );
  };

  const canDelete = (request: LeaveRequest) => {
    return variant === "manager" || variant === "admin";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {(variant === "admin" || variant === "manager") && (
              <TableHead>Employee</TableHead>
            )}
            <TableHead>Leave Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead className="text-center">Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              {(variant === "admin" || variant === "manager") && (
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={request.employeeAvatar}
                        data-ai-hint="person portrait"
                      />
                      <AvatarFallback>
                        {request.employeeName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{request.employeeName}</span>
                  </div>
                </TableCell>
              )}
              <TableCell>{request.leaveType}</TableCell>
              <TableCell>
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </TableCell>
              <TableCell className="text-center">{request.days}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusBadge(request.status)}
                >
                  {request.status}
                </Badge>
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
                    <DropdownMenuItem
                      onClick={() => handleReviewClick(request)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Review
                    </DropdownMenuItem>

                    {request.status === "Approved" && (
                      <DropdownMenuItem
                        onClick={() => handleAddToCalendar(request)}
                        disabled={isAddingToCalendar === request.id}
                      >
                        {isAddingToCalendar === request.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarPlus className="mr-2 h-4 w-4" />
                        )}
                        Add to Calendar
                      </DropdownMenuItem>
                    )}

                    {canWithdraw(request) && (
                      <DropdownMenuItem
                        onClick={() => handleWithdrawClick(request)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Withdraw
                      </DropdownMenuItem>
                    )}

                    {canDelete(request) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(request)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Request
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedRequest && (
        <ReviewLeaveRequestDialog
          request={selectedRequest}
          open={isReviewOpen}
          onOpenChange={onReviewDialogClose}
          currentUserId={currentUserId}
          variant={variant}
        />
      )}
      <DeleteConfirmationDialog
        open={isWithdrawOpen}
        onOpenChange={setWithdrawOpen}
        onConfirm={confirmWithdraw}
        title="Are you sure you want to withdraw this request?"
        description="This action cannot be undone. This will permanently withdraw your leave request."
        isPending={isPending}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete this leave request?"
        description="This action is permanent and cannot be undone."
        isPending={isPending}
      />
    </>
  );
}
