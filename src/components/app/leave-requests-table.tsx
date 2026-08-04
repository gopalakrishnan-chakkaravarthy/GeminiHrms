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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatLocalDate, parseLocalDate, cn } from "@/lib/utils";
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
  CheckCircle2,
  XCircle,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import type { LeaveRequest, Employee, LeaveType } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { ReviewLeaveRequestDialog } from "./review-leave-request-dialog";
import { withdrawLeaveRequestAction } from "@/app/dashboard/actions";
import {
  deleteLeaveRequestByManagerAction,
  addEventToGoogleCalendarAction,
  batchReviewLeaveRequestsAction,
} from "@/app/dashboard/admin/actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { CreateLeaveOnBehalfDialog } from "./create-leave-on-behalf-dialog";

type LeaveRequestsTableProps = {
  requests: LeaveRequest[];
  variant?: "user" | "admin" | "manager";
  currentUserId?: string;
  employees?: Employee[];
  leaveTypes?: LeaveType[];
  showCreateButton?: boolean;
};

export function LeaveRequestsTable({
  requests,
  variant = "user",
  currentUserId,
  employees,
  leaveTypes,
  showCreateButton = false,
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

  // Multi-select state for pending leaves
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isBatchRejectOpen, setIsBatchRejectOpen] = useState(false);
  const [batchRejectionReason, setBatchRejectionReason] = useState("");

  const isManagementView = variant === "admin" || variant === "manager";

  // Filter only pending leaves for batch selection
  const pendingRequests = requests.filter((req) => req.status === "Pending");
  const pendingIds = pendingRequests.map((req) => req.id);

  const isAllPendingSelected =
    pendingIds.length > 0 &&
    pendingIds.every((id) => selectedRequestIds.includes(id));

  const handleSelectAllPending = () => {
    if (isAllPendingSelected) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(pendingIds);
    }
  };

  const handleToggleRowSelection = (id: string, status: LeaveRequest["status"]) => {
    // Strictly enforce: Only allow to select pending leaves
    if (status !== "Pending") {
      toast({
        variant: "destructive",
        title: "Selection Error",
        description: "Only pending leaves can be selected for batch approval/rejection.",
      });
      return;
    }

    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedRequestIds.length === 0) return;

    startTransition(async () => {
      const result = await batchReviewLeaveRequestsAction(
        selectedRequestIds,
        "approve"
      );

      if (result.success) {
        toast({
          title: "Batch Action Completed",
          description: result.message,
        });
        setSelectedRequestIds([]);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  const handleConfirmBatchReject = () => {
    if (selectedRequestIds.length === 0) return;

    startTransition(async () => {
      const result = await batchReviewLeaveRequestsAction(
        selectedRequestIds,
        "reject",
        batchRejectionReason
      );

      if (result.success) {
        toast({
          title: "Batch Action Completed",
          description: result.message,
        });
        setSelectedRequestIds([]);
        setIsBatchRejectOpen(false);
        setBatchRejectionReason("");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return formatLocalDate(date, "MMM dd, yyyy");
  };

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200";
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
      {/* ACTION BAR & CREATE ON BEHALF HEADER */}
      <div className="space-y-3 mb-4">
        {showCreateButton && employees && leaveTypes && (
          <div className="flex justify-end">
            <CreateLeaveOnBehalfDialog
              employees={employees}
              leaveTypes={leaveTypes}
              triggerText="Request Leave for Employee"
            />
          </div>
        )}

        {/* BATCH ACTION BAR FOR PENDING LEAVES */}
        {isManagementView && selectedRequestIds.length > 0 && (
          <div className="bg-slate-900 text-white dark:bg-slate-800 p-3.5 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2.5">
              <Badge className="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 text-xs">
                {selectedRequestIds.length} Pending Selected
              </Badge>
              <span className="text-xs text-slate-300 hidden sm:inline">
                Batch approve or reject pending leave requests simultaneously
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={handleBatchApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold gap-1.5 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve Selected ({selectedRequestIds.length})
              </Button>

              <Button
                size="sm"
                disabled={isPending}
                variant="destructive"
                onClick={() => setIsBatchRejectOpen(true)}
                className="text-xs h-8 font-semibold gap-1.5 shadow-sm"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject Selected ({selectedRequestIds.length})
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedRequestIds([])}
                className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {/* MULTI-SELECT CHECKBOX COLUMN (ADMIN/MANAGER ONLY) */}
            {isManagementView && (
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllPendingSelected && pendingIds.length > 0}
                  onCheckedChange={handleSelectAllPending}
                  disabled={pendingIds.length === 0}
                  aria-label="Select all pending leave requests"
                  title={
                    pendingIds.length === 0
                      ? "No pending leaves to select"
                      : "Select all pending leaves"
                  }
                />
              </TableHead>
            )}
            {isManagementView && <TableHead>Employee</TableHead>}
            <TableHead>Leave Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead className="text-center">Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const isPendingRequest = request.status === "Pending";
            const isSelected = selectedRequestIds.includes(request.id);

            return (
              <TableRow
                key={request.id}
                className={cn(isSelected && "bg-slate-50 dark:bg-slate-900/50")}
              >
                {/* CHECKBOX CELL: Strictly allow selecting pending leaves only */}
                {isManagementView && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        handleToggleRowSelection(request.id, request.status)
                      }
                      disabled={!isPendingRequest}
                      aria-label={`Select leave request for ${request.employeeName}`}
                      className={cn(
                        !isPendingRequest && "opacity-40 cursor-not-allowed"
                      )}
                      title={
                        !isPendingRequest
                          ? "Only pending leaves can be selected"
                          : `Select ${request.employeeName}'s pending request`
                      }
                    />
                  </TableCell>
                )}

                {isManagementView && (
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
                      <div>
                        <span className="font-medium block">{request.employeeName}</span>
                        {request.employeeEmail && (
                          <span className="text-[11px] text-muted-foreground">
                            {request.employeeEmail}
                          </span>
                        )}
                      </div>
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
            );
          })}
        </TableBody>
      </Table>

      {/* SINGLE REQUEST REVIEW DIALOG */}
      {selectedRequest && (
        <ReviewLeaveRequestDialog
          request={selectedRequest}
          open={isReviewOpen}
          onOpenChange={onReviewDialogClose}
          currentUserId={currentUserId}
          variant={variant}
        />
      )}

      {/* BATCH REJECT CONFIRMATION DIALOG */}
      <Dialog open={isBatchRejectOpen} onOpenChange={setIsBatchRejectOpen}>
        <DialogContent className="sm:max-w-[420px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Batch Reject Selected Leaves
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              You are about to reject {selectedRequestIds.length} pending leave request(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="batchReason" className="text-xs font-medium">
              Rejection Reason (Optional)
            </Label>
            <Textarea
              id="batchReason"
              value={batchRejectionReason}
              onChange={(e) => setBatchRejectionReason(e.target.value)}
              placeholder="E.g., Operational constraints or insufficient team coverage."
              className="text-xs h-20"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleConfirmBatchReject}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Reject {selectedRequestIds.length} Requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SINGLE WITHDRAW & DELETE CONFIRMATIONS */}
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
