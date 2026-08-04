"use client";

import { useState, useEffect, useActionState, useTransition } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Calendar as CalendarIcon,
  Loader2,
  Building2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { createLeaveOnBehalfAction, type FormState } from "@/app/dashboard/admin/actions";
import type { Employee, LeaveType } from "@/lib/data";
import { cn, formatLocalDate } from "@/lib/utils";

type CreateLeaveOnBehalfDialogProps = {
  employees: Employee[];
  leaveTypes: LeaveType[];
  triggerText?: string;
  variant?: "default" | "outline" | "secondary";
};

export function CreateLeaveOnBehalfDialog({
  employees,
  leaveTypes,
  triggerText = "Request Leave for Employee",
  variant = "default",
}: CreateLeaveOnBehalfDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>("");
  const [statusOption, setStatusOption] = useState<string>("Approved");
  const [reason, setReason] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isFirstDayHalf, setIsFirstDayHalf] = useState<boolean>(false);
  const [isLastDayHalf, setIsLastDayHalf] = useState<boolean>(false);

  const initialState: FormState = { success: false, message: "" };
  const [formState, formAction] = useActionState(createLeaveOnBehalfAction, initialState);

  useEffect(() => {
    if (formState.message) {
      if (formState.success) {
        toast({ title: "Success", description: formState.message });
        setOpen(false);
        resetForm();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: formState.message,
        });
      }
    }
  }, [formState, toast]);

  const resetForm = () => {
    setSelectedEmployeeId("");
    setSelectedLeaveTypeId("");
    setStatusOption("Approved");
    setReason("");
    setDateRange(undefined);
    setIsFirstDayHalf(false);
    setIsLastDayHalf(false);
  };

  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={cn(variant === "default" && "bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm")}>
          <UserPlus className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] p-6 gap-5">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            Create Leave on Behalf of Employee
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Submit an official leave entry directly for any employee in the organization.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* EMPLOYEE SELECTION */}
          <div className="space-y-1.5">
            <Label htmlFor="employeeId" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Select Employee <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
              name="employeeId"
              required
            >
              <SelectTrigger id="employeeId" className="h-10 text-sm">
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2 text-left">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={emp.avatarUrl} />
                        <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{emp.name}</span>
                      <span className="text-xs text-slate-400">({emp.departmentName || "General"})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="employeeId" value={selectedEmployeeId} />
          </div>

          {/* LEAVE TYPE & INITIAL STATUS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leaveTypeId" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Leave Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedLeaveTypeId}
                onValueChange={setSelectedLeaveTypeId}
                name="leaveTypeId"
                required
              >
                <SelectTrigger id="leaveTypeId" className="h-9 text-xs">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id} className="text-xs">
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="leaveTypeId" value={selectedLeaveTypeId} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Initial Status
              </Label>
              <Select value={statusOption} onValueChange={setStatusOption} name="status">
                <SelectTrigger id="status" className="h-9 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved" className="text-xs text-emerald-700 font-semibold">
                    Approved (Direct Entry)
                  </SelectItem>
                  <SelectItem value="Pending" className="text-xs text-amber-700 font-semibold">
                    Pending (Requires Manager Review)
                  </SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={statusOption} />
            </div>
          </div>

          {/* DATE RANGE PICKER */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Leave Date Range <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 text-xs border-slate-200 dark:border-slate-800",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {formatLocalDate(dateRange.from, "MMM dd, yyyy")} -{" "}
                        {formatLocalDate(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      formatLocalDate(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick leave start and end dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <input
              type="hidden"
              name="dates.from"
              value={dateRange?.from ? formatLocalDate(dateRange.from, "yyyy-MM-dd") : ""}
            />
            <input
              type="hidden"
              name="dates.to"
              value={dateRange?.to ? formatLocalDate(dateRange.to, "yyyy-MM-dd") : dateRange?.from ? formatLocalDate(dateRange.from, "yyyy-MM-dd") : ""}
            />
          </div>

          {/* HALF DAY OPTIONS */}
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFirstDayHalf"
                checked={isFirstDayHalf}
                onCheckedChange={(checked) => setIsFirstDayHalf(!!checked)}
              />
              <Label htmlFor="isFirstDayHalf" className="text-xs text-slate-600 cursor-pointer">
                First day half day
              </Label>
              <input type="hidden" name="isFirstDayHalf" value={isFirstDayHalf ? "true" : "false"} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isLastDayHalf"
                checked={isLastDayHalf}
                onCheckedChange={(checked) => setIsLastDayHalf(!!checked)}
              />
              <Label htmlFor="isLastDayHalf" className="text-xs text-slate-600 cursor-pointer">
                Last day half day
              </Label>
              <input type="hidden" name="isLastDayHalf" value={isLastDayHalf ? "true" : "false"} />
            </div>
          </div>

          {/* REASON */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Reason / Notes
            </Label>
            <Textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for granting leave..."
              className="text-xs h-20"
            />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedEmployeeId || !selectedLeaveTypeId || !dateRange?.from}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Submit Leave Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
