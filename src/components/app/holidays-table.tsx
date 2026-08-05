"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarPlus, Loader2 } from "lucide-react";
import type { Holiday } from "@/lib/data";
import { deleteHolidayAction } from "@/app/dashboard/admin/actions";
import { sendCalendarInviteAction } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateIcsContent } from "@/lib/calendar";
import { useUser } from "@clerk/nextjs";

type HolidaysTableProps = {
  holidays: Holiday[];
};

export function HolidaysTable({ holidays }: HolidaysTableProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  let userEmail: string | null = null;
  try {
    const clerk = useUser();
    userEmail = clerk?.user?.primaryEmailAddress?.emailAddress || null;
  } catch {
    // ignore
  }

  const handleDelete = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsDeleteOpen(true);
  };

  const handleAddToCalendar = (holiday: Holiday) => {
    if (!userEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find user email to send invite.",
      });
      return;
    }
    startTransition(async () => {
      setIsAddingToCalendar(holiday.id);
      const holidayDate = new Date(holiday.date);
      const icsContent = generateIcsContent({
        title: holiday.name,
        description: `Company holiday: ${holiday.name}`,
        startDate: holidayDate,
        endDate: holidayDate,
      });

      const result = await sendCalendarInviteAction({
        recipientEmail: userEmail,
        icsContent: icsContent,
        summary: `Holiday: ${holiday.name}`,
      });

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

  const confirmDelete = async () => {
    if (!selectedHoliday) return;

    startTransition(async () => {
      const result = await deleteHolidayAction(selectedHoliday.id);
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setIsDeleteOpen(false);
      setSelectedHoliday(null);
    });
  };

  return (
    <>
      <ScrollArea className="h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.map((holiday) => (
              <TableRow key={holiday.id}>
                <TableCell className="font-medium">{holiday.name}</TableCell>
                <TableCell>{format(new Date(holiday.date), "MMM dd, yyyy")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAddToCalendar(holiday)}
                    disabled={isPending || !user}
                    title="Send Calendar Invite"
                  >
                    {isAddingToCalendar === holiday.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarPlus className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send Calendar Invite</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(holiday)}
                    disabled={isPending}
                    title="Delete Holiday"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        isPending={isPending}
        title="Are you sure you want to delete this holiday?"
        description="This action cannot be undone and will permanently remove the holiday from the calendar."
      />
    </>
  );
}
