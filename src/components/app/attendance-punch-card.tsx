"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PunchInModal } from "@/components/app/punch-in-modal";
import { recordPunchOutAction } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import type { AttendanceLog, Department } from "@/lib/mock-data";
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Calendar,
  Building,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AttendancePunchCardProps {
  todayLog: AttendanceLog | null;
  department: Department;
}

export function AttendancePunchCard({
  todayLog,
  department,
}: AttendancePunchCardProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [punchingOut, setPunchingOut] = useState(false);

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePunchOut = async () => {
    setPunchingOut(true);
    const res = await recordPunchOutAction();
    setPunchingOut(false);
    if (res.success) {
      toast({
        title: "Punched Out Successfully",
        description: "Have a great rest of your day!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Punch Out Failed",
        description: res.message,
      });
    }
  };

  const signInTimeStr = department?.signInTime || "09:00";
  const graceMins = department?.graceTimeMinutes ?? 15;

  const isPunchedIn = todayLog?.status === "PUNCHED_IN" || todayLog?.status === "LATE_PUNCH_IN";
  const isPunchedOut = todayLog?.status === "PUNCHED_OUT";
  const isDayOff = todayLog?.status === "DAY_OFF";

  return (
    <>
      <Card className="border-primary/20 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Daily Attendance Punch Log
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs font-semibold">
              {currentTime || "00:00:00 AM"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Department Configuration Info */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-lg border">
            <div>
              <span className="text-muted-foreground block">Department Sign-In:</span>
              <span className="font-semibold text-foreground">{signInTimeStr} (+{graceMins}m Grace)</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Office Address:</span>
              <span className="font-semibold text-foreground truncate block">{department?.businessAddress || "100 Tech Park Way"}</span>
            </div>
          </div>

          {/* Attendance Status Display */}
          {isPunchedOut ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-lg text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Shift Completed (Punched Out)
                </span>
                <Badge className="bg-blue-600">Punched Out</Badge>
              </div>
              <div className="grid grid-cols-2 text-xs gap-1 text-muted-foreground">
                <div>Punch-In: {todayLog.punchInTime ? new Date(todayLog.punchInTime).toLocaleTimeString() : "--"}</div>
                <div>Punch-Out: {todayLog.punchOutTime ? new Date(todayLog.punchOutTime).toLocaleTimeString() : "--"}</div>
              </div>
            </div>
          ) : isPunchedIn ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Currently On Shift (Punched In)
                </span>
                <Badge className="bg-emerald-600">Punched In</Badge>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span>Punch-In Time: <strong className="font-mono">{todayLog.punchInTime ? new Date(todayLog.punchInTime).toLocaleTimeString() : "--"}</strong></span>
                {todayLog.punchInPhoto && (
                  <Button variant="ghost" size="sm" onClick={() => setPhotoOpen(true)} className="h-7 text-xs gap-1">
                    <Camera className="h-3.5 w-3.5" /> View Selfie
                  </Button>
                )}
              </div>
            </div>
          ) : isDayOff ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" /> Marked as Day Off
              </div>
              <p className="text-xs text-muted-foreground">
                Missed sign-in cutoff time ({signInTimeStr} + {graceMins} mins grace). Automatically considered as day off.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-muted/50 border border-dashed rounded-lg space-y-2 text-center">
              <p className="text-xs text-muted-foreground">
                You have not punched in for today yet. Please record your location and live selfie before cutoff ({signInTimeStr}).
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          {!todayLog || (!isPunchedIn && !isPunchedOut && !isDayOff) ? (
            <Button className="w-full gap-2" onClick={() => setModalOpen(true)}>
              <Clock className="h-4 w-4" /> Punch In Now
            </Button>
          ) : isPunchedIn ? (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handlePunchOut}
              disabled={punchingOut}
            >
              {punchingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Punch Out
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      {/* Punch In Modal */}
      <PunchInModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        department={department}
      />

      {/* Photo Preview Dialog */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4" /> Live Photo Verification
            </DialogTitle>
          </DialogHeader>
          {todayLog?.punchInPhoto && (
            <img
              src={todayLog.punchInPhoto}
              alt="Punch In Verification"
              className="w-full h-auto rounded border object-cover"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}