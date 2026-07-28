"use client";

import { useState, useEffect, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isSameDay, isValid } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Bot,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  Loader2,
} from "lucide-react";

import { getLeaveInsightsAction } from "@/app/dashboard/actions";
import {
  createLeaveRequestAction,
  type FormState,
} from "@/app/dashboard/actions";
import type { LeaveInsightsOutput } from "@/ai/flows/leave-insights";
import type {
  User,
  LeaveType as LeaveTypeData,
  LeaveBalance,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  leaveTypeId: z.string({ required_error: "Please select a leave type." }),
  dates: z.object(
    {
      from: z.date({ required_error: "A start date is required." }),
      to: z.date({ required_error: "An end date is required." }).optional(),
    },
    { required_error: "Please select a date range." },
  ),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters.")
    .optional(),
  isFirstDayHalf: z.boolean().default(false),
  isLastDayHalf: z.boolean().default(false),
});

type RequestLeaveDialogProps = {
  user: User;
  leaveTypes: LeaveTypeData[];
  leaveBalances: LeaveBalance[];
};

const enableAIFeatures = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === "true";

export function RequestLeaveDialog({
  user,
  leaveTypes,
  leaveBalances,
}: RequestLeaveDialogProps) {
  const [open, setOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<LeaveInsightsOutput | null>(
    null,
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFirstDayHalf: false,
      isLastDayHalf: false,
    },
  });

  const initialState: FormState = { success: false, message: "" };
  const [formState, formAction] = useActionState(
    createLeaveRequestAction,
    initialState,
  );

  useEffect(() => {
    if (formState.message) {
      if (formState.success) {
        toast({ title: "Success", description: formState.message });
        setOpen(false);
        form.reset();
        setAiInsights(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: formState.message,
        });
      }
    }
  }, [formState, toast, form]);

  const selectedDates = form.watch("dates");
  const selectedLeaveTypeId = form.watch("leaveTypeId");

  const selectedLeaveType = leaveTypes.find(
    (lt) => lt.id === selectedLeaveTypeId,
  );
  const selectedLeaveBalance = leaveBalances.find(
    (lb) => lb.leaveType === selectedLeaveType?.name,
  );

  const handleGetAiInsights = async () => {
    if (!selectedDates?.from || !selectedDates?.to || !user.roleName) {
      setAiError(
        "Please select a date range first. Employee role must also be set.",
      );
      return;
    }
    setIsAiLoading(true);
    setAiError(null);
    setAiInsights(null);

    const input = {
      employeeRole: user.roleName,
      leaveHistory: user.leaveHistory,
      proposedStartDate: format(selectedDates.from, "yyyy-MM-dd"),
      proposedEndDate: format(selectedDates.to, "yyyy-MM-dd"),
    };

    const result = await getLeaveInsightsAction(input);
    if (result.success && result.data) {
      setAiInsights(result.data);
    } else {
      setAiError(result.error || "An unknown error occurred.");
    }
    setIsAiLoading(false);
  };

  const onFormSubmit = (formData: FormData) => {
    // Ensure 'dates.to' is present for single day leaves
    const from = formData.get("dates.from");
    const to = formData.get("dates.to");
    if (from && !to) {
      formData.set("dates.to", from);
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Request Leave</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-headline">New Leave Request</DialogTitle>
          <DialogDescription>
            Fill out the form below to request time off.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form action={onFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leaveTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      name={field.name}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>
                            {lt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedLeaveBalance && (
                      <p className="text-xs text-muted-foreground pt-1">
                        You have{" "}
                        <span className="font-semibold text-primary">
                          {selectedLeaveBalance.balance} days
                        </span>{" "}
                        remaining.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Range</FormLabel>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          className="flex-1"
                          value={
                            field.value?.from
                              ? format(field.value.from, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) => {
                            const newDate = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            field.onChange({ ...field.value, from: newDate });
                          }}
                        />
                        <Input
                          type="date"
                          className="flex-1"
                          value={
                            field.value?.to
                              ? format(field.value.to, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) => {
                            const newDate = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            field.onChange({ ...field.value, to: newDate });
                          }}
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon">
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={field.value?.from}
                              selected={field.value as DateRange}
                              onSelect={field.onChange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <FormMessage />
                    {field.value?.from && isValid(field.value.from) && (
                      <input
                        type="hidden"
                        name="dates.from"
                        value={field.value.from.toISOString()}
                      />
                    )}
                    {field.value?.to && isValid(field.value.to) && (
                      <input
                        type="hidden"
                        name="dates.to"
                        value={field.value.to.toISOString()}
                      />
                    )}
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isFirstDayHalf"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (!selectedDates?.from) {
                            toast({
                              variant: "destructive",
                              title: "Date Required",
                              description:
                                "Please select a start date before choosing half-day options.",
                            });
                            return;
                          }
                          field.onChange(checked);
                        }}
                        name={field.name}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>First day is half-day</FormLabel>
                      <FormDescription>
                        Subtracts 0.5 days from the total.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isLastDayHalf"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (!selectedDates?.from || !selectedDates?.to) {
                            toast({
                              variant: "destructive",
                              title: "Date Range Required",
                              description:
                                "Please select both start and end dates first.",
                            });
                            return;
                          }

                          if (
                            checked &&
                            isSameDay(selectedDates.from, selectedDates.to)
                          ) {
                            toast({
                              variant: "destructive",
                              title: "Range Required",
                              description:
                                "Please select a second date for a range or use only the first half-day option for single day leave.",
                            });
                            // Alert user to select second date and uncheck first half as requested
                            form.setValue("isFirstDayHalf", false);
                            return;
                          }

                          field.onChange(checked);
                        }}
                        name={field.name}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Last day is half-day</FormLabel>
                      <FormDescription>
                        Only applied if start and end dates differ.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Family vacation"
                      {...field}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {enableAIFeatures && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Bot className="h-5 w-5" />
                    AI-Powered Insights
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetAiInsights}
                    disabled={
                      isAiLoading || !selectedDates?.from || !selectedDates?.to
                    }
                  >
                    {isAiLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get Insights
                  </Button>
                </div>

                {isAiLoading && (
                  <div className="text-sm text-muted-foreground">
                    Generating insights...
                  </div>
                )}

                {aiError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{aiError}</AlertDescription>
                  </Alert>
                )}

                {aiInsights && (
                  <div className="space-y-3">
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>Best Timing Suggestion</AlertTitle>
                      <AlertDescription>
                        {aiInsights.bestTimingSuggestion}
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Potential Impact Assessment</AlertTitle>
                      <AlertDescription>
                        {aiInsights.potentialImpactAssessment}
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>Overall Recommendation</AlertTitle>
                      <AlertDescription>
                        {aiInsights.overallRecommendation}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
