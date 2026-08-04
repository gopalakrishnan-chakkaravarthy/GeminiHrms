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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Filter,
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
import { format } from "date-fns";

type LeaveRequestsTableProps = {
  requests: LeaveRequest[];
  variant?: "user" | "admin" | "manager";
  currentUserId?: string;
  employees?: Employee[];
  leaveTypes?: LeaveType[];
  showCreateButton?: boolean;
  showFilters?: boolean;
};

export function LeaveRequestsTable({
  requests,
  variant = "user",
  currentUserId,
  employees,
  leaveTypes,
  showCreateButton = false,
  showFilters = true,
}: LeaveRequestsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("all");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Multi-select state for pending leaves
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isBatchRejectOpen, setIsBatchRejectOpen] = useState(false);
  const [batchRejectionReason, setBatchRejectionReason] = useState("");

  const isManagementView = variant === "admin" || variant === "manager";

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return formatLocalDate(date, "MMM dd, yyyy");
  };

  // Filtered requests computation
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        req.employeeName.toLowerCase().includes(q) ||
        (req.employeeEmail && req.employeeEmail.toLowerCase().includes(q)) ||
        req.leaveType.toLowerCase().includes(q) ||
        (req.reason && req.reason.toLowerCase().includes(q));

      const matchesStatus =
        selectedStatus === "all" ||
        req.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesLeaveType =
        selectedLeaveType === "all" ||
        req.leaveType.toLowerCase() === selectedLeaveType.toLowerCase();

      return matchesSearch && matchesStatus && matchesLeaveType;
    });
  }, [requests, searchQuery, selectedStatus, selectedLeaveType]);

  const hasActiveFilters =
    searchQuery !== "" || selectedStatus !== "all" || selectedLeaveType !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedLeaveType("all");
  };

  // Filter only pending leaves within the visible/filtered items for batch selection
  const pendingRequests = filteredRequests.filter((req) => req.status === "Pending");
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

  // Export CSV / Excel
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There are no leave requests in the current view to export.",
      });
      return;
    }

    const headers = [
      "Leave ID",
      "Employee Name",
      "Employee Email",
      "Leave Type",
      "Start Date",
      "End Date",
      "Total Days",
      "Status",
      "Reason",
    ];

    const rows = filteredRequests.map((r) => [
      `"${r.id}"`,
      `"${(r.employeeName || "").replace(/"/g, '""')}"`,
      `"${(r.employeeEmail || "").replace(/"/g, '""')}"`,
      `"${(r.leaveType || "").replace(/"/g, '""')}"`,
      `"${formatDate(r.startDate)}"`,
      `"${formatDate(r.endDate)}"`,
      `"${r.days}"`,
      `"${r.status}"`,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
    ]);

    // Include UTF-8 BOM so Microsoft Excel parses formatting correctly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = format(new Date(), "yyyy-MM-dd");
    link.setAttribute("href", url);
    link.setAttribute("download", `leave-requests-report-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Excel/CSV Exported",
      description: `Successfully exported ${filteredRequests.length} leave request records.`,
    });
  };

  const handlePrintPdfReport = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
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

  // Derive unique leave types for filter
  const availableLeaveTypeNames = useMemo(() => {
    if (leaveTypes && leaveTypes.length > 0) {
      return leaveTypes.map((lt) => lt.name);
    }
    const set = new Set<string>();
    requests.forEach((r) => set.add(r.leaveType));
    return Array.from(set);
  }, [leaveTypes, requests]);

  return (
    <>
      {/* GLOBAL PRINT STYLES FOR LEAVE PDF REPORT MODAL */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #leave-pdf-report-container, #leave-pdf-report-container * {
            visibility: visible;
          }
          #leave-pdf-report-container {
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

      {/* TOOLBAR FOR SEARCH, FILTER, EXPORT & CREATE */}
      <div className="space-y-3 mb-4">
        {showFilters && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search employee, email, or reason..."
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

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-white dark:bg-slate-950">
                  <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="pending" className="text-xs">
                    Pending
                  </SelectItem>
                  <SelectItem value="approved" className="text-xs">
                    Approved
                  </SelectItem>
                  <SelectItem value="rejected" className="text-xs">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Leave Type Filter */}
              {availableLeaveTypeNames.length > 0 && (
                <Select
                  value={selectedLeaveType}
                  onValueChange={setSelectedLeaveType}
                >
                  <SelectTrigger className="w-full sm:w-40 h-9 text-xs bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Leave Types
                    </SelectItem>
                    {availableLeaveTypeNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs h-9 text-slate-500 hover:text-slate-900"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Reset Filters
                </Button>
              )}
            </div>

            {/* EXPORT BUTTON & CREATE ON BEHALF */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 font-medium gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-600" />
                    Export Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleExportCSV}
                    className="text-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                    Export to Excel (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsPdfModalOpen(true)}
                    className="text-xs cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-600" />
                    Print / Save PDF Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {showCreateButton && employees && leaveTypes && (
                <CreateLeaveOnBehalfDialog
                  employees={employees}
                  leaveTypes={leaveTypes}
                  triggerText="Request Leave"
                />
              )}
            </div>
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

      {/* TABLE */}
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
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const isPendingRequest = request.status === "Pending";
              const isSelected = selectedRequestIds.includes(request.id);

              return (
                <TableRow
                  key={request.id}
                  className={cn(isSelected && "bg-slate-50 dark:bg-slate-900/50")}
                >
                  {/* CHECKBOX CELL */}
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
                  <TableCell className="text-center font-medium">{request.days}</TableCell>
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
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={isManagementView ? 7 : 6}
                className="text-center py-8 text-muted-foreground"
              >
                No leave requests found matching your filter criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* PDF REPORT MODAL FOR LEAVE REQUESTS */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="no-print border-b pb-3">
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>Employee Leave Requests Report</span>
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
              A print-ready leave report of the currently filtered view.
            </DialogDescription>
          </DialogHeader>

          {/* REPORT PREVIEW CONTAINER */}
          <div id="leave-pdf-report-container" className="space-y-6 pt-2">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                  Leave Requests Audit Report
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Confidential HR Record • Generated on {format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <span className="font-semibold block text-slate-900">Report Scope:</span>
                <span>Status Filter: {selectedStatus.toUpperCase()}</span>
                <span className="block">Search: {searchQuery || "All Employees"}</span>
              </div>
            </div>

            {/* METRICS SUMMARY */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total</span>
                <span className="text-base font-extrabold text-slate-900">{filteredRequests.length}</span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending</span>
                <span className="text-base font-extrabold text-amber-700">
                  {filteredRequests.filter((r) => r.status === "Pending").length}
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Approved</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {filteredRequests.filter((r) => r.status === "Approved").length}
                </span>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Rejected</span>
                <span className="text-base font-extrabold text-rose-700">
                  {filteredRequests.filter((r) => r.status === "Rejected").length}
                </span>
              </div>
            </div>

            {/* LEAVE RECORDS TABLE */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Employee</th>
                    <th className="p-2.5">Leave Type</th>
                    <th className="p-2.5">Dates</th>
                    <th className="p-2.5 text-center">Days</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRequests.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="p-2.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {r.employeeName}
                        {r.employeeEmail && (
                          <span className="block text-[10px] font-normal text-slate-500">
                            {r.employeeEmail}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-medium">{r.leaveType}</td>
                      <td className="p-2.5 text-slate-600">
                        {formatDate(r.startDate)} - {formatDate(r.endDate)}
                      </td>
                      <td className="p-2.5 text-center font-bold">{r.days}</td>
                      <td className="p-2.5 font-semibold">{r.status}</td>
                      <td className="p-2.5 text-slate-500 max-w-[150px] truncate">{r.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 text-[10px] text-slate-400 flex justify-between italic">
              <span>AbsenceAce HRMS Leave Report • Confidential</span>
              <span>Total Items: {filteredRequests.length}</span>
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
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
