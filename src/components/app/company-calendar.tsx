"use client";

import * as React from "react";
import { eachDayOfInterval, format } from "date-fns";
import type { Holiday, LeaveRequest } from "@/lib/data";
import { parseLocalDate } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DayProps } from "react-day-picker";

type CompanyCalendarProps = {
  holidays: Holiday[];
  approvedLeaves: LeaveRequest[];
};

export function CompanyCalendar({
  holidays,
  approvedLeaves,
}: CompanyCalendarProps) {
  const [month, setMonth] = React.useState<Date | undefined>();

  React.useEffect(() => {
    setMonth(new Date());
  }, []);

  const holidaysByDate = React.useMemo(() => {
    return (holidays || []).reduce(
      (acc, holiday) => {
        if (!holiday?.date) return acc;
        const d = parseLocalDate(holiday.date);
        if (isNaN(d.getTime())) return acc;
        const dateKey = format(d, "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push({ type: "holiday", name: holiday.name });
        return acc;
      },
      {} as Record<string, { type: "holiday"; name: string }[]>
    );
  }, [holidays]);

  const leavesByDate = React.useMemo(() => {
    return (approvedLeaves || []).reduce(
      (acc, leave) => {
        if (!leave?.startDate || !leave?.endDate) return acc;
        const start = parseLocalDate(leave.startDate);
        const end = parseLocalDate(leave.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return acc;
        try {
          const interval = eachDayOfInterval({ start, end });
          interval.forEach((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push({
              type: "leave",
              name: `${leave.employeeName} (${leave.leaveType})`,
            });
          });
        } catch {
          // ignore invalid interval
        }
        return acc;
      },
      {} as Record<string, { type: "leave"; name: string }[]>
    );
  }, [approvedLeaves]);

  const eventsByDate = React.useMemo(() => {
    const allEvents: Record<string, ({ type: "holiday" | "leave"; name: string })[]> = {};
    Object.keys(holidaysByDate).forEach((dateKey) => {
      allEvents[dateKey] = [...holidaysByDate[dateKey]];
    });
    Object.keys(leavesByDate).forEach((dateKey) => {
      if (!allEvents[dateKey]) {
        allEvents[dateKey] = [];
      }
      allEvents[dateKey] = [...allEvents[dateKey], ...leavesByDate[dateKey]];
    });
    return allEvents;
  }, [holidaysByDate, leavesByDate]);

  const modifiers = React.useMemo(() => {
    const validHolidays = (holidays || [])
      .map((h) => (h?.date ? parseLocalDate(h.date) : null))
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

    const validLeaves = (approvedLeaves || []).flatMap((l) => {
      if (!l?.startDate || !l?.endDate) return [];
      const start = parseLocalDate(l.startDate);
      const end = parseLocalDate(l.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
      try {
        return eachDayOfInterval({ start, end });
      } catch {
        return [];
      }
    });

    return {
      holiday: validHolidays,
      leave: validLeaves,
    };
  }, [holidays, approvedLeaves]);

  const modifierStyles = {
    holiday: {
      backgroundColor: "hsl(var(--chart-2))",
      color: "hsl(var(--primary-foreground))",
    },
    leave: {
      backgroundColor: "hsl(var(--chart-1))",
      color: "hsl(var(--primary-foreground))",
    },
  };

  const DayWithEvents = React.useCallback(
    (props: DayProps) => {
      const day = props.date;
      const dateKey = format(day, "yyyy-MM-dd");
      const events = eventsByDate[dateKey] || [];

      const originalDay = (
        <div className="relative w-full h-full flex items-center justify-center">
          {format(day, "d")}
        </div>
      );

      if (events.length > 0) {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative w-full h-full flex items-center justify-center cursor-pointer">
                {format(day, "d")}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">
                    {format(day, "MMMM d, yyyy")}
                  </h4>
                  <div className="grid gap-2">
                    {events.map((event, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge
                          variant={
                            event.type === "holiday" ? "secondary" : "default"
                          }
                          className={
                            event.type === "holiday"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {event.type === "holiday" ? "Holiday" : "Leave"}
                        </Badge>
                        <span className="text-sm">{event.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      }

      return originalDay;
    },
    [eventsByDate]
  );

  if (!month) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  return (
    <Calendar
      mode="single"
      month={month}
      onMonthChange={setMonth}
      modifiers={modifiers}
      modifiersStyles={modifierStyles}
      components={{
        Day: DayWithEvents,
      }}
      className="p-0"
    />
  );
}
