"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  runPayrollAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import type { Employee } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Run Payroll
    </Button>
  );
}

export function RunPayrollForm({ employees }: { employees: Employee[] }) {
  const initialState: FormState = { message: "", success: false };
  const [state, dispatch] = useActionState(runPayrollAction, initialState);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [date, setDate] = useState<DateRange | undefined>();

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployees(checked ? employees.map((e) => e.id) : []);
  };

  return (
    <form action={dispatch}>
      <input
        type="hidden"
        name="employeeIds"
        value={selectedEmployees.join(",")}
      />
      {date?.from && (
        <input
          type="hidden"
          name="dateFrom"
          value={format(date.from, "yyyy-MM-dd")}
        />
      )}
      {date?.to && (
        <input
          type="hidden"
          name="dateTo"
          value={format(date.to, "yyyy-MM-dd")}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Employees</CardTitle>
          <CardDescription>
            Choose the employees to include in this payroll run.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4 border rounded-md">
          <div className="flex items-center space-x-2 col-span-full border-b pb-2 mb-2">
            <Checkbox
              id="select-all"
              checked={selectedEmployees.length === employees.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-bold text-base">
              Select All
            </Label>
          </div>
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center space-x-2">
              <Checkbox
                id={`emp-${employee.id}`}
                checked={selectedEmployees.includes(employee.id)}
                onCheckedChange={() => handleEmployeeToggle(employee.id)}
              />
              <Label htmlFor={`emp-${employee.id}`}>{employee.name}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Step 2: Select Pay Period</CardTitle>
          <CardDescription>
            Define the start and end date for this payroll run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full max-w-sm justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <SubmitButton />
          {state?.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              {state.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{state.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
