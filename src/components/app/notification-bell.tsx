"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  Inbox,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatLocalDate } from "@/lib/utils";
import type { User, LeaveRequest } from "@/lib/data";

type NotificationBellProps = {
  user: User;
  pendingRequests: LeaveRequest[];
};

export function NotificationBell({ user, pendingRequests }: NotificationBellProps) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load read status from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("absenceace_read_notifications");
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveReadIds = (ids: string[]) => {
    setReadIds(ids);
    try {
      localStorage.setItem("absenceace_read_notifications", JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  };

  const markAllAsRead = () => {
    const allIds = pendingRequests.map((r) => r.id);
    saveReadIds(allIds);
  };

  const unreadRequests = pendingRequests.filter((r) => !readIds.includes(r.id));
  const unreadCount = unreadRequests.length;

  const isAdmin = user?.roleName === "Administrator" || user?.roleName === "Admin";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full border bg-background hover:bg-accent hover:text-accent-foreground"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 shadow-lg" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Content List */}
        <ScrollArea className="h-[320px]">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground text-sm">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No new employee leave requests pending review.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((request) => {
                const isUnread = !readIds.includes(request.id);
                const startDateStr = request.startDate
                  ? formatLocalDate(request.startDate, "MMM dd")
                  : "";
                const endDateStr = request.endDate
                  ? formatLocalDate(request.endDate, "MMM dd")
                  : "";

                return (
                  <div
                    key={request.id}
                    className={`p-3.5 transition-colors flex gap-3 items-start hover:bg-muted/50 ${
                      isUnread ? "bg-primary/5 font-normal" : "opacity-80"
                    }`}
                  >
                    <Avatar className="h-9 w-9 mt-0.5 shrink-0">
                      <AvatarImage
                        src={request.employeeAvatar}
                        alt={request.employeeName}
                      />
                      <AvatarFallback>
                        {request.employeeName?.charAt(0) || "E"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {request.employeeName}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 capitalize border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        >
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted a <span className="font-medium text-foreground">{request.leaveType}</span> request ({request.days} {request.days === 1 ? "day" : "days"}).
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {startDateStr} - {endDateStr}
                        </span>
                      </div>

                      {request.reason && (
                        <p className="text-[11px] text-muted-foreground italic truncate bg-muted/40 px-2 py-1 rounded">
                          &ldquo;{request.reason}&rdquo;
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between gap-2">
                        <Link
                          href="/dashboard/admin"
                          onClick={() => {
                            markAsRead(request.id);
                            setIsOpen(false);
                          }}
                          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                        >
                          Review request
                          <ArrowRight className="h-3 w-3" />
                        </Link>

                        {isUnread && (
                          <button
                            onClick={() => markAsRead(request.id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                            title="Mark as read"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2 bg-muted/20 text-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8 text-primary font-medium"
            onClick={() => setIsOpen(false)}
          >
            <Link href={isAdmin ? "/dashboard/admin" : "/dashboard/manager"}>
              View All Requests
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
