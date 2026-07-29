"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  reviewLeaveRequestAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRequest } from "@/lib/data";
import { formatLocalDate } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

type ReviewLeaveRequestDialogProps = {
  request: LeaveRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  variant: "user" | "admin" | "manager";
};

function SubmitButton({ action }: { action: "approve" | "reject" }) {
  const { pending } = useFormStatus();
  const isApprove = action === "approve";

  return (
    <Button
      type="submit"
      name="action"
      value={action}
      variant={isApprove ? "default" : "destructive"}
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isApprove ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <X className="mr-2 h-4 w-4" />
      )}
      {isApprove ? "Approve" : "Reject"}
    </Button>
  );
}

export function ReviewLeaveRequestDialog({
  request,
  open,
  onOpenChange,
  currentUserId,
  variant,
}: ReviewLeaveRequestDialogProps) {
  const { toast } = useToast();
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const initialState: FormState = { message: "", errors: {}, success: false };

  const [state, dispatch] = useActionState(
    reviewLeaveRequestAction,
    initialState
  );

  useEffect(() => {
    if (!open) {
      setShowRejectionInput(false);
    }
  }, [open]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: state.message,
        });
      }
    }
  }, [state, toast, onOpenChange]);

  const canReview =
    request.status === "Pending" &&
    (variant === "admin" ||
      (variant === "manager" && request.managerId === currentUserId));

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

  const handleRejectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowRejectionInput(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave Request Details</DialogTitle>
          <DialogDescription>From: {request.employeeName}</DialogDescription>
        </DialogHeader>

        <form action={dispatch}>
          <input type="hidden" name="requestId" value={request.id} />
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Status:</span>
              <Badge
                variant="outline"
                className={getStatusBadge(request.status)}
              >
                {request.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Type:</span>
              <span>{request.leaveType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Dates:</span>
              <span>
                {formatLocalDate(request.startDate, "MMM dd, yyyy")} -{" "}
                {formatLocalDate(request.endDate, "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total Days:</span>
              <span>{request.days}</span>
            </div>
            {request.reason && (
              <div className="space-y-1">
                <span className="font-semibold">Reason:</span>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  {request.reason}
                </p>
              </div>
            )}
            {request.status === "Rejected" && request.rejectionReason && (
              <div className="space-y-1">
                <span className="font-semibold text-destructive">
                  Rejection Reason:
                </span>
                <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-md">
                  {request.rejectionReason}
                </p>
              </div>
            )}

            {canReview && showRejectionInput && (
              <div className="space-y-2 pt-4">
                <Label htmlFor="rejectionReason" className="font-semibold">
                  Reason for Rejection
                </Label>
                <Textarea
                  id="rejectionReason"
                  name="rejectionReason"
                  placeholder="Provide a clear reason for rejecting this request..."
                />
                {state.errors?.rejectionReason && (
                  <p className="text-red-500 text-xs">
                    {state.errors.rejectionReason[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            {canReview ? (
              showRejectionInput ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRejectionInput(false)}
                  >
                    Cancel
                  </Button>
                  <SubmitButton action="reject" />
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRejectClick}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <SubmitButton action="approve" />
                </>
              )
            ) : (
              <Alert
                variant={
                  request.status === "Pending" && !canReview
                    ? "default"
                    : "default"
                }
                className="text-left"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {request.status === "Pending"
                    ? "Review not available"
                    : "Request Closed"}
                </AlertTitle>
                <AlertDescription>
                  {request.status === "Pending"
                    ? "You are not the assigned manager for this request."
                    : `This request was ${request.status.toLowerCase()} and can no longer be modified.`}
                </AlertDescription>
              </Alert>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
