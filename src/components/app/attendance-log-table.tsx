"use client";

import React, { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AttendanceLog, Department } from "@/lib/mock-data";
import { AttendanceMapView } from "@/components/app/attendance-map-view";
import {
  Camera,
  MapPin,
  Clock,
  Search,
  User,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sun,
  Moon,
  Award,
  Filter,
  TrendingUp,
  Map as MapIcon,
  List,
} from "lucide-react";

interface AttendanceLogTableProps {
  logs: AttendanceLog[];
  departments?: Department[];
}

export function AttendanceLogTable({ logs, departments = [] }: AttendanceLogTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedMapLog, setSelectedMapLog] = useState<AttendanceLog | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Filter logs by period (Week, Month, All)
  const periodLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      if (period === "all") return true;
      const logDate = new Date(log.date);
      const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
      if (period === "week") return diffDays <= 7;
      if (period === "month") return diffDays <= 30;
      return true;
    });
  }, [logs, period]);

  // Find First Early Punch-In of the Period
  const earlyPunchInChampion = useMemo(() => {
    let earliest: AttendanceLog | null = null;
    let earliestMinutes = Infinity;

    periodLogs.forEach((log) => {
      if (log.punchInTime) {
        const date = new Date(log.punchInTime);
        const minutes = date.getHours() * 60 + date.getMinutes();
        if (minutes < earliestMinutes) {
          earliestMinutes = minutes;
          earliest = log;
        }
      }
    });

    return earliest;
  }, [periodLogs]);

  // Find Late Punch-Out Leader of the Period
  const latePunchOutLeader = useMemo(() => {
    let latest: AttendanceLog | null = null;
    let latestMinutes = -1;

    periodLogs.forEach((log) => {
      if (log.punchOutTime) {
        const date = new Date(log.punchOutTime);
        const minutes = date.getHours() * 60 + date.getMinutes();
        if (minutes > latestMinutes) {
          latestMinutes = minutes;
          latest = log;
        }
      }
    });

    return latest;
  }, [periodLogs]);

  // Count Late Comers in the Period
  const lateComersCount = useMemo(() => {
    return periodLogs.filter((l) => l.status === "LATE_PUNCH_IN").length;
  }, [periodLogs]);

  // Filter logs by Search and Status Chip
  const filteredLogs = useMemo(() => {
    return periodLogs.filter((log) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (log.employeeName && log.employeeName.toLowerCase().includes(term)) ||
        (log.employeeEmail && log.employeeEmail.toLowerCase().includes(term)) ||
        (log.departmentName && log.departmentName.toLowerCase().includes(term)) ||
        (log.status && log.status.toLowerCase().includes(term)) ||
        (log.date && log.date.includes(term));

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "EARLY") {
        if (!log.punchInTime) return false;
        const d = new Date(log.punchInTime);
        return d.getHours() * 60 + d.getMinutes() < 9 * 60; // Punch in before 09:00 AM
      }
      if (statusFilter === "LATE_IN") return log.status === "LATE_PUNCH_IN";
      if (statusFilter === "LATE_OUT") {
        if (!log.punchOutTime) return false;
        const d = new Date(log.punchOutTime);
        return d.getHours() * 60 + d.getMinutes() >= 18 * 60; // Punch out at or after 06:00 PM
      }
      if (statusFilter === "PUNCHED_OUT") return log.status === "PUNCHED_OUT";
      if (statusFilter === "DAY_OFF") return log.status === "DAY_OFF";

      return true;
    });
  }, [periodLogs, searchTerm, statusFilter]);

  const getStatusBadge = (status: string, punchInTime?: string | null, punchOutTime?: string | null) => {
    switch (status) {
      case "PUNCHED_IN":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Punched In</Badge>;
      case "LATE_PUNCH_IN":
        return <Badge className="bg-amber-600 hover:bg-amber-700">Late Punch-In</Badge>;
      case "PUNCHED_OUT":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Punched Out</Badge>;
      case "DAY_OFF":
        return <Badge variant="destructive">Considered Day Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* TIME FRAME SELECTOR & METRIC HIGHLIGHT CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">Attendance Highlights & Analytics</h3>
              <p className="text-xs text-muted-foreground">
                First early punch-in, late punch-outs, and late comers audit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-background border rounded-lg p-1">
            <Button
              variant={period === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("week")}
              className="h-7 text-xs"
            >
              This Week
            </Button>
            <Button
              variant={period === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("month")}
              className="h-7 text-xs"
            >
              This Month
            </Button>
            <Button
              variant={period === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("all")}
              className="h-7 text-xs"
            >
              All Time
            </Button>
          </div>
        </div>

        {/* HIGHLIGHT BANNER CARDS */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* EARLY PUNCH IN CHAMPION */}
          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-emerald-600" /> First Early Punch-In ({period === "week" ? "Week" : period === "month" ? "Month" : "Overall"})
                </span>
                <Badge className="bg-emerald-600">Champion</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {earlyPunchInChampion ? (
                <>
                  <div className="text-lg font-bold text-foreground flex items-center gap-2">
                    {(earlyPunchInChampion as AttendanceLog).employeeName}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Dept: <strong>{(earlyPunchInChampion as AttendanceLog).departmentName || "Engineering"}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                      {(earlyPunchInChampion as AttendanceLog).punchInTime ? new Date((earlyPunchInChampion as AttendanceLog).punchInTime!).toLocaleTimeString() : "--"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Date: {(earlyPunchInChampion as AttendanceLog).date}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-2">No early punch-in records for this period.</p>
              )}
            </CardContent>
          </Card>

          {/* LATE PUNCH OUT LEADER */}
          <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-indigo-600" /> Late Punch-Out Leader ({period === "week" ? "Week" : period === "month" ? "Month" : "Overall"})
                </span>
                <Badge className="bg-indigo-600">Night Owl</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {latePunchOutLeader ? (
                <>
                  <div className="text-lg font-bold text-foreground flex items-center gap-2">
                    {(latePunchOutLeader as AttendanceLog).employeeName}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Dept: <strong>{(latePunchOutLeader as AttendanceLog).departmentName || "Engineering"}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">
                      {(latePunchOutLeader as AttendanceLog).punchOutTime ? new Date((latePunchOutLeader as AttendanceLog).punchOutTime!).toLocaleTimeString() : "--"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Date: {(latePunchOutLeader as AttendanceLog).date}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-2">No late punch-out records for this period.</p>
              )}
            </CardContent>
          </Card>

          {/* LATE COMERS AUDIT */}
          <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Late Comers Audit
                </span>
                <Badge variant="outline" className="border-amber-500 text-amber-700 font-mono">
                  {lateComersCount} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold text-foreground font-mono">
                {lateComersCount} <span className="text-xs font-sans font-normal text-muted-foreground">Late arrivals</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Punched in past department cutoff (+grace period).
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("LATE_IN")}
                className="mt-2 h-7 text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 w-full"
              >
                Filter Late Comers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* VIEW MODE TOGGLE & FILTER BAR */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, department, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* VIEW MODE SWITCH */}
            <div className="flex items-center bg-muted p-1 rounded-lg border">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 text-xs gap-1 px-3"
              >
                <List className="h-3.5 w-3.5" /> Table View
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="h-7 text-xs gap-1 px-3"
              >
                <MapIcon className="h-3.5 w-3.5 text-primary" /> Map View Pins
              </Button>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ALL")}
                className="h-7 text-xs px-2.5"
              >
                All ({periodLogs.length})
              </Button>
              <Button
                variant={statusFilter === "EARLY" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("EARLY")}
                className="h-7 text-xs px-2.5 gap-1 border-emerald-300"
              >
                <Sun className="h-3 w-3 text-emerald-600" /> Early
              </Button>
              <Button
                variant={statusFilter === "LATE_IN" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("LATE_IN")}
                className="h-7 text-xs px-2.5 gap-1 border-amber-300"
              >
                <AlertTriangle className="h-3 w-3 text-amber-600" /> Late
              </Button>
              <Button
                variant={statusFilter === "LATE_OUT" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("LATE_OUT")}
                className="h-7 text-xs px-2.5 gap-1 border-indigo-300"
              >
                <Moon className="h-3 w-3 text-indigo-600" /> Overtime
              </Button>
            </div>
          </div>
        </div>

        {/* MAP VIEW MODE */}
        {viewMode === "map" ? (
          <AttendanceMapView logs={filteredLogs} departments={departments} />
        ) : (
          /* TABLE VIEW MODE */
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Punch-In Time</TableHead>
                  <TableHead>Punch-Out Time</TableHead>
                  <TableHead>GPS Distance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Location & Selfie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground text-xs">
                      No attendance punch records match the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const isEarliest = earlyPunchInChampion && earlyPunchInChampion.id === log.id;
                    const isLatestOut = latePunchOutLeader && latePunchOutLeader.id === log.id;

                    return (
                      <TableRow key={log.id} className={isEarliest ? "bg-emerald-50/30 dark:bg-emerald-950/20" : isLatestOut ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""}>
                        <TableCell>
                          <div className="font-semibold text-xs flex items-center gap-1.5">
                            {log.employeeName || "Employee"}
                            {isEarliest && (
                              <Badge className="bg-emerald-600 text-[10px] px-1 py-0 h-4" title="Earliest Punch-In">
                                🏆 Early Bird
                              </Badge>
                            )}
                            {isLatestOut && (
                              <Badge className="bg-indigo-600 text-[10px] px-1 py-0 h-4" title="Latest Punch-Out">
                                🌙 Night Owl
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{log.employeeEmail}</div>
                        </TableCell>
                        <TableCell className="text-xs">{log.departmentName || "--"}</TableCell>
                        <TableCell className="font-mono text-xs">{log.date}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.punchInTime ? (
                            <span className={isEarliest ? "font-bold text-emerald-700 dark:text-emerald-400" : ""}>
                              {new Date(log.punchInTime).toLocaleTimeString()}
                            </span>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.punchOutTime ? (
                            <span className={isLatestOut ? "font-bold text-indigo-700 dark:text-indigo-400" : ""}>
                              {new Date(log.punchOutTime).toLocaleTimeString()}
                            </span>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.distanceMeters !== null && log.distanceMeters !== undefined ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                              {log.distanceMeters}m
                            </span>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status, log.punchInTime, log.punchOutTime)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {log.punchInLat && log.punchInLng && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewMode("map");
                              }}
                              className="h-7 text-xs gap-1 border-primary/30 text-primary"
                            >
                              <MapIcon className="h-3 w-3" /> Map
                            </Button>
                          )}
                          {log.punchInPhoto ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPhoto(log.punchInPhoto || null)}
                              className="h-7 text-xs gap-1"
                            >
                              <Camera className="h-3.5 w-3.5 text-primary" /> Selfie
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Photo View Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-primary" /> Verified Punch-In Photo
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Live Punch Selfie"
              className="w-full h-auto rounded border object-cover"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}