"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { recordPunchInAction } from "@/app/dashboard/actions";
import { calculateDistanceMeters } from "@/lib/utils";
import type { Department } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Building2,
} from "lucide-react";

interface PunchInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
}

export function PunchInModal({
  open,
  onOpenChange,
  department,
}: PunchInModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"LOCATION" | "CAMERA" | "CONFIRM">("LOCATION");
  
  // Location state
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const targetLat = department?.businessLatitude ?? 37.7749;
  const targetLng = department?.businessLongitude ?? -122.4194;
  const allowedRadius = department?.allowedRadiusMeters ?? 500;

  // Request browser geolocation
  const requestLocation = () => {
    setLoadingLoc(true);
    setLocError(null);

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLoadingLoc(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        const dist = calculateDistanceMeters(lat, lng, targetLat, targetLng);
        setDistance(dist);
        setLoadingLoc(false);
      },
      (err) => {
        setLocError(err.message || "Unable to retrieve your location.");
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Simulate in-office location for quick testing
  const simulateInOfficeLocation = () => {
    setUserLat(targetLat);
    setUserLng(targetLng);
    setDistance(15); // 15 meters
    setLocError(null);
    toast({
      title: "Location Simulated",
      description: "Set position to office coordinate (15m radius).",
    });
  };

  useEffect(() => {
    if (open && step === "LOCATION" && !userLat) {
      requestLocation();
    }
  }, [open, step]);

  // Start webcam feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (step === "CAMERA" && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, capturedPhoto]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const generateMockPhoto = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230f172a'/><circle cx='200' cy='120' r='50' fill='%2338bdf8'/><path d='M120 250 C120 190 280 190 280 250' fill='%2338bdf8'/><text x='50%' y='280' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-family='sans-serif'>Verified Daily Selfie (${new Date().toLocaleTimeString()})</text></svg>`;
    const mockDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setCapturedPhoto(mockDataUrl);
    stopCamera();
  };

  const handlePunchIn = async () => {
    if (!userLat || !userLng || distance === null || !capturedPhoto) {
      toast({
        variant: "destructive",
        title: "Missing Punch Data",
        description: "Location or photo is incomplete.",
      });
      return;
    }

    if (distance > allowedRadius) {
      toast({
        variant: "destructive",
        title: "Location Restricted",
        description: `You are ${distance}m from office (Allowed: ${allowedRadius}m).`,
      });
      return;
    }

    setSubmitting(true);
    const result = await recordPunchInAction({
      lat: userLat,
      lng: userLng,
      photo: capturedPhoto,
      distanceMeters: distance,
    });
    setSubmitting(false);

    if (result.success) {
      toast({
        title: "Punched In Successfully!",
        description: "Your live location and photo verification have been saved.",
      });
      onOpenChange(false);
      setStep("LOCATION");
      setCapturedPhoto(null);
    } else {
      toast({
        variant: "destructive",
        title: "Punch In Failed",
        description: result.message,
      });
    }
  };

  const isWithinRadius = distance !== null && distance <= allowedRadius;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Daily Attendance Punch-In
          </DialogTitle>
          <DialogDescription>
            Verify location within {department?.name || "Department"} radius and take a live selfie.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b pb-3 text-xs font-semibold">
          <span
            className={`flex items-center gap-1.5 ${
              step === "LOCATION" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              1
            </span>
            Location Check
          </span>
          <span
            className={`flex items-center gap-1.5 ${
              step === "CAMERA" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              2
            </span>
            Live Photo
          </span>
          <span
            className={`flex items-center gap-1.5 ${
              step === "CONFIRM" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              3
            </span>
            Confirm
          </span>
        </div>

        {/* STEP 1: LOCATION */}
        {step === "LOCATION" && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-4 w-4" /> Office Address:
                </span>
                <span className="text-foreground">{department?.businessAddress || "100 Tech Park Way"}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Allowed Punch Radius:</span>
                <Badge variant="outline" className="font-mono">{allowedRadius}m</Badge>
              </div>
            </div>

            <div className="text-center py-4 space-y-3">
              {loadingLoc ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span>Detecting GPS Coordinates...</span>
                </div>
              ) : locError ? (
                <div className="space-y-2 text-red-500 text-xs">
                  <AlertTriangle className="h-8 w-8 mx-auto" />
                  <p>{locError}</p>
                  <Button variant="outline" size="sm" onClick={requestLocation} className="mt-2">
                    <RefreshCw className="mr-1 h-3 w-3" /> Retry GPS
                  </Button>
                </div>
              ) : distance !== null ? (
                <div className="space-y-3">
                  {isWithinRadius ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg text-emerald-800 dark:text-emerald-300 space-y-1">
                      <div className="flex items-center justify-center gap-2 font-semibold">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Location Verified!
                      </div>
                      <p className="text-xs">
                        Distance from office: <strong className="font-mono text-sm">{distance}m</strong> (Allowed: {allowedRadius}m)
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-800 dark:text-red-300 space-y-1">
                      <div className="flex items-center justify-center gap-2 font-semibold">
                        <AlertTriangle className="h-5 w-5 text-red-600" /> Outside Allowed Radius
                      </div>
                      <p className="text-xs">
                        Current distance: <strong className="font-mono text-sm">{distance}m</strong>. You must be within {allowedRadius}m of office.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-center gap-2 text-xs">
                    <Button variant="ghost" size="sm" onClick={requestLocation}>
                      <RefreshCw className="mr-1 h-3 w-3" /> Refresh GPS
                    </Button>
                    <Button variant="outline" size="sm" onClick={simulateInOfficeLocation}>
                      Simulate Office Location (15m)
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA */}
        {step === "CAMERA" && (
          <div className="space-y-4 py-2">
            <div className="relative overflow-hidden rounded-lg border bg-black aspect-video flex items-center justify-center">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Live Selfie Verification"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary/50 m-8 rounded-full flex items-center justify-center opacity-60">
                    <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">Center Your Face</span>
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {cameraError && (
              <p className="text-xs text-red-500 text-center">{cameraError}</p>
            )}

            <div className="flex justify-center gap-2">
              {capturedPhoto ? (
                <Button variant="outline" size="sm" onClick={() => setCapturedPhoto(null)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retake Photo
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={capturePhoto}>
                    <Camera className="mr-1 h-3.5 w-3.5" /> Take Selfie
                  </Button>
                  <Button variant="secondary" size="sm" onClick={generateMockPhoto}>
                    Sample Avatar Snapshot
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === "CONFIRM" && (
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 border rounded-lg space-y-2 bg-muted/20">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-semibold">{department?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Location Distance:</span>
                <span className="font-mono font-semibold text-emerald-600">{distance}m from office</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Punch Time:</span>
                <span className="font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {capturedPhoto && (
              <div className="space-y-1">
                <span className="text-muted-foreground font-semibold">Verified Live Photo:</span>
                <img
                  src={capturedPhoto}
                  alt="Verified Photo"
                  className="h-28 w-auto rounded border object-cover mx-auto"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "LOCATION" && (
            <Button
              onClick={() => setStep("CAMERA")}
              disabled={!isWithinRadius}
              className="w-full sm:w-auto"
            >
              Next: Take Photo
            </Button>
          )}

          {step === "CAMERA" && (
            <div className="flex justify-between w-full">
              <Button variant="ghost" onClick={() => setStep("LOCATION")}>
                Back
              </Button>
              <Button onClick={() => setStep("CONFIRM")} disabled={!capturedPhoto}>
                Next: Review & Confirm
              </Button>
            </div>
          )}

          {step === "CONFIRM" && (
            <div className="flex justify-between w-full">
              <Button variant="ghost" onClick={() => setStep("CAMERA")}>
                Back
              </Button>
              <Button onClick={handlePunchIn} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Punch-In
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}