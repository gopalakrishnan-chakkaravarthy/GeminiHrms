"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { format, getQuarter, isWithinInterval } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn, formatLocalDate, parseLocalDate } from "@/lib/utils";
import {
  createHolidayAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle,
  Loader2,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Holiday
    </Button>
  );
}

// Preset holiday definition generator based on fiscal year
function getPresetHolidays(year: number) {
  return [
    { name: "New Year's Day", date: new Date(year, 0, 1), icon: "🎆" },
    { name: "Memorial Day", date: new Date(year, 4, 25), icon: "🎖️" }, // Late May
    { name: "Independence Day", date: new Date(year, 6, 4), icon: "🎆" },
    { name: "Labor Day", date: new Date(year, 8, 7), icon: "🛠️" }, // Early Sep
    { name: "Thanksgiving Day", date: new Date(year, 10, 26), icon: "🦃" }, // Late Nov
    { name: "Christmas Day", date: new Date(year, 11, 25), icon: "🎄" },
  ];
}

export function CreateHolidayDialog() {
  const [open, setOpen] = useState(false);
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(createHolidayAction, initialState);
  const { toast } = useToast();

  const currentCalendarYear = new Date().getFullYear();
  const [fiscalYear, setFiscalYear] = useState<number>(currentCalendarYear);
  const [holidayName, setHolidayName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(currentCalendarYear, 6, 4) // Default to July 4th of current fiscal year
  );
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Active Fiscal Year interval bounds (Jan 1 - Dec 31 of fiscal year)
  const fyStart = useMemo(() => new Date(fiscalYear, 0, 1), [fiscalYear]);
  const fyEnd = useMemo(() => new Date(fiscalYear, 11, 31), [fiscalYear]);

  // Check if selected date is inside active fiscal year
  const isDateInFiscalYear = useMemo(() => {
    if (!selectedDate) return false;
    return isWithinInterval(selectedDate, { start: fyStart, end: fyEnd });
  }, [selectedDate, fyStart, fyEnd]);

  // Selected date quarter calculation
  const dateQuarter = useMemo(() => {
    if (!selectedDate) return null;
    return `Q${getQuarter(selectedDate)}`;
  }, [selectedDate]);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Holiday Created",
        description: state.message,
      });
      setOpen(false);
      setHolidayName("");
    } else if (state.message) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: state.message,
      });
    }
  }, [state, toast]);

  // When Fiscal Year dropdown changes, adjust selected date if needed
  const handleFiscalYearChange = (newFyStr: string) => {
    const newFy = parseInt(newFyStr, 10);
    setFiscalYear(newFy);
    if (selectedDate) {
      // Shift date to new fiscal year maintaining month/day
      const updatedDate = new Date(
        newFy,
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setSelectedDate(updatedDate);
    } else {
      setSelectedDate(new Date(newFy, 0, 1));
    }
  };

  const handleApplyPreset = (preset: { name: string; date: Date }) => {
    setHolidayName(preset.name);
    setSelectedDate(preset.date);
    toast({
      description: `Preset applied: ${preset.name} (${format(preset.date, "MMM dd, yyyy")})`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Holiday
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] p-6 gap-5">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Create Organization Holiday
            </DialogTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              FY {fiscalYear}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Add official company holidays. Dates are mapped and validated against the organization fiscal calendar.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="space-y-4">
          {/* FISCAL YEAR SELECTION BAR */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-600" />
                Active Organization Fiscal Period
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {format(fyStart, "MMM d")} – {format(fyEnd, "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="fiscalYear" className="text-xs text-slate-500 whitespace-nowrap">
                Fiscal Year:
              </Label>
              <Select
                value={fiscalYear.toString()}
                onValueChange={handleFiscalYearChange}
              >
                <SelectTrigger id="fiscalYear" className="h-8 text-xs bg-white dark:bg-slate-950 font-medium">
                  <SelectValue placeholder="Select Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={(currentCalendarYear - 1).toString()}>
                    FY {currentCalendarYear - 1} (Previous Year)
                  </SelectItem>
                  <SelectItem value={currentCalendarYear.toString()}>
                    FY {currentCalendarYear} (Current Fiscal Year)
                  </SelectItem>
                  <SelectItem value={(currentCalendarYear + 1).toString()}>
                    FY {currentCalendarYear + 1} (Upcoming Fiscal Year)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* HOLIDAY NAME INPUT */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Holiday Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="e.g. Independence Day, Founder's Day"
              className="h-9 text-sm"
              required
            />
            {state.errors?.name && (
              <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
            )}
          </div>

          {/* QUICK PRESETS */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Quick Common Holiday Presets (FY {fiscalYear})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getPresetHolidays(fiscalYear).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md transition-colors"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SPECIALIZED FISCAL YEAR DATE PICKER */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Holiday Date <span className="text-red-500">*</span>
            </Label>

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className={cn(
                    "w-full justify-between text-left font-normal h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-7 w-7 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {selectedDate
                          ? formatLocalDate(selectedDate, "EEEE, MMMM d, yyyy")
                          : "Select holiday date"}
                      </span>
                      {selectedDate && (
                        <span className="text-[10px] text-slate-500">
                          Fiscal Period: FY {fiscalYear} • {dateQuarter}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedDate && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 shrink-0",
                        isDateInFiscalYear
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      )}
                    >
                      {isDateInFiscalYear ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Valid FY{fiscalYear}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          Outside FY{fiscalYear}
                        </span>
                      )}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0 border border-slate-200 dark:border-slate-800 shadow-lg" align="start">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
                    Fiscal Calendar FY {fiscalYear}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        const midYear = new Date(fiscalYear, 6, 1);
                        setSelectedDate(midYear);
                      }}
                    >
                      Mid-Year
                    </Button>
                  </div>
                </div>

                <div className="p-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (d) {
                        setSelectedDate(d);
                        setPopoverOpen(false);
                      }
                    }}
                    defaultMonth={selectedDate || fyStart}
                    disabled={(date) =>
                      date < fyStart || date > fyEnd
                    }
                    initialFocus
                    className="p-1"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Allowed Range: Jan 1 – Dec 31, {fiscalYear}</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-[11px] text-emerald-600 font-semibold"
                    onClick={() => {
                      setSelectedDate(new Date(fiscalYear, 0, 1));
                    }}
                  >
                    Reset to FY Start
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* HIDDEN FORM INPUT WITH ISO/LOCAL FORMAT */}
            {selectedDate && (
              <input
                type="hidden"
                name="date"
                value={formatLocalDate(selectedDate, "yyyy-MM-dd")}
              />
            )}

            {!isDateInFiscalYear && selectedDate && (
              <p className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Note: Selected date falls outside Organization Fiscal Year {fiscalYear}. Please select a date within FY {fiscalYear}.
              </p>
            )}

            {state.errors?.date && (
              <p className="text-red-500 text-xs mt-1">{state.errors.date[0]}</p>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
