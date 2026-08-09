"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import type { AttendanceLog, Department } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MapPin,
  Camera,
  Search,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Crosshair,
  Maximize2,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";

interface AttendanceMapViewProps {
  logs: AttendanceLog[];
  departments?: Department[];
}

export function AttendanceMapView({ logs, departments = [] }: AttendanceMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Filter logs with valid coordinates
  const validLogs = useMemo(() => {
    return logs.filter((log) => {
      const lat = log.punchInLat;
      const lng = log.punchInLng;
      if (lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng))) {
        return false;
      }

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (log.employeeName && log.employeeName.toLowerCase().includes(term)) ||
        (log.departmentName && log.departmentName.toLowerCase().includes(term)) ||
        (log.employeeEmail && log.employeeEmail.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      if (selectedStatus === "ALL") return true;
      if (selectedStatus === "LATE") return log.status === "LATE_PUNCH_IN";
      if (selectedStatus === "PUNCHED_IN") return log.status === "PUNCHED_IN";
      if (selectedStatus === "PUNCHED_OUT") return log.status === "PUNCHED_OUT";

      return true;
    });
  }, [logs, searchTerm, selectedStatus]);

  // Initialize Leaflet map dynamically
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted) return;

      // If map is already initialized, clear markers layer
      if (!leafletMapRef.current) {
        // Default center: San Francisco or first log's position
        const defaultLat = validLogs[0]?.punchInLat ?? 37.7749;
        const defaultLng = validLogs[0]?.punchInLng ?? -122.4194;

        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: 12,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        leafletMapRef.current = map;
        markersGroupRef.current = L.layerGroup().addTo(map);
      }

      const map = leafletMapRef.current;
      const markersGroup = markersGroupRef.current;
      markersGroup.clearLayers();

      const bounds: [number, number][] = [];

      // Add Department Office Radius Circles
      departments.forEach((dept) => {
        if (dept.businessLatitude && dept.businessLongitude) {
          const deptLat = Number(dept.businessLatitude);
          const deptLng = Number(dept.businessLongitude);
          const radius = dept.allowedRadiusMeters || 500;

          const officeCircle = L.circle([deptLat, deptLng], {
            color: "#6366f1",
            fillColor: "#818cf8",
            fillOpacity: 0.12,
            radius: radius,
            weight: 1.5,
            dashArray: "4, 4",
          });

          const officeIcon = L.divIcon({
            className: "custom-office-pin",
            html: `<div style="background-color:#4f46e5;color:white;padding:4px 8px;border-radius:12px;font-size:10px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;display:flex;align-items:center;gap:4px;">🏢 ${dept.name} Office</div>`,
            iconSize: [120, 24],
            iconAnchor: [60, 12],
          });

          const officeMarker = L.marker([deptLat, deptLng], { icon: officeIcon });
          officeMarker.bindPopup(`
            <div style="font-family:sans-serif;padding:4px;">
              <strong style="color:#4f46e5;">🏢 ${dept.name} HQ</strong><br/>
              <span style="font-size:11px;color:#666;">Allowed Radius: ${radius}m</span><br/>
              <span style="font-size:10px;color:#888;">${dept.businessAddress || ""}</span>
            </div>
          `);

          officeCircle.addTo(markersGroup);
          officeMarker.addTo(markersGroup);
          bounds.push([deptLat, deptLng]);
        }
      });

      // Add Punch Log Markers
      validLogs.forEach((log) => {
        const lat = Number(log.punchInLat);
        const lng = Number(log.punchInLng);

        bounds.push([lat, lng]);

        let pinBg = "#10b981"; // Emerald for normal
        let statusText = "Punched In";

        if (log.status === "LATE_PUNCH_IN") {
          pinBg = "#f59e0b"; // Amber for late
          statusText = "Late Punch-In";
        } else if (log.status === "PUNCHED_OUT") {
          pinBg = "#3b82f6"; // Blue for finished
          statusText = "Punched Out";
        }

        const customIcon = L.divIcon({
          className: "custom-log-pin",
          html: `
            <div style="
              background-color: ${pinBg};
              color: white;
              padding: 4px 8px;
              border-radius: 16px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              border: 2px solid white;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
            ">
              <span style="width:6px;height:6px;border-radius:50%;background:white;"></span>
              ${log.employeeName || "Employee"}
            </div>
          `,
          iconSize: [100, 26],
          iconAnchor: [50, 13],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const photoHtml = log.punchInPhoto
          ? `<div style="margin-top:6px;text-align:center;">
               <img src="${log.punchInPhoto}" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #ccc;cursor:pointer;" onclick="window.previewPhotoModal('${log.punchInPhoto}')" />
             </div>`
          : "";

        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:180px;padding:2px;">
            <div style="font-weight:bold;font-size:13px;color:#1e293b;margin-bottom:2px;">${log.employeeName}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${log.departmentName || "Department"}</div>
            
            <div style="background:#f1f5f9;padding:6px;border-radius:6px;font-size:11px;margin-bottom:6px;">
              <div><strong>Punch-In:</strong> ${log.punchInTime ? new Date(log.punchInTime).toLocaleTimeString() : "--"}</div>
              <div><strong>Punch-Out:</strong> ${log.punchOutTime ? new Date(log.punchOutTime).toLocaleTimeString() : "--"}</div>
              <div><strong>GPS Dist:</strong> <span style="color:#059669;font-weight:bold;">${log.distanceMeters ?? "--"}m</span></div>
            </div>

            <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:${pinBg};color:white;font-size:10px;font-weight:bold;">
              ${statusText}
            </div>

            ${photoHtml}
          </div>
        `);

        marker.on("click", () => {
          setSelectedLog(log);
        });

        marker.addTo(markersGroup);
      });

      // Window global helper for popup photo clicks
      (window as any).previewPhotoModal = (src: string) => {
        setPreviewPhoto(src);
      };

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [validLogs, departments]);

  const handleCenterOnLog = (log: AttendanceLog) => {
    setSelectedLog(log);
    if (leafletMapRef.current && log.punchInLat && log.punchInLng) {
      leafletMapRef.current.setView([Number(log.punchInLat), Number(log.punchInLng)], 15);
    }
  };

  return (
    <div className="space-y-4">
      {/* FILTER & CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1 mr-1">
            <Layers className="h-3.5 w-3.5" /> Status Pins:
          </span>
          <Button
            variant={selectedStatus === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("ALL")}
            className="h-7 text-xs px-2.5"
          >
            All Pins ({validLogs.length})
          </Button>
          <Button
            variant={selectedStatus === "PUNCHED_IN" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("PUNCHED_IN")}
            className="h-7 text-xs px-2.5 gap-1 border-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> On-Time
          </Button>
          <Button
            variant={selectedStatus === "LATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("LATE")}
            className="h-7 text-xs px-2.5 gap-1 border-amber-300"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> Late Comers
          </Button>
          <Button
            variant={selectedStatus === "PUNCHED_OUT" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus("PUNCHED_OUT")}
            className="h-7 text-xs px-2.5 gap-1 border-blue-300"
          >
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Shift Completed
          </Button>
        </div>
      </div>

      {/* MAP & SIDEBAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEAFLET MAP CANVAS */}
        <div className="lg:col-span-3 rounded-xl border overflow-hidden shadow-sm bg-muted/20 relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] z-0"
            style={{ minHeight: "520px" }}
          />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-background/90 backdrop-blur-md p-2.5 rounded-lg border shadow-md text-xs space-y-1">
            <div className="font-semibold text-[11px] text-muted-foreground pb-1 border-b">Map Pins Legend</div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> On-Time Punch-In
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Late Punch-In
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Punched Out
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600"></span> Office HQ Radius Circle
            </div>
          </div>
        </div>

        {/* SIDEBAR LOCATION LOG SELECTOR */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between sticky top-0 bg-background py-1">
            <span>Punch Locations ({validLogs.length})</span>
            <span className="text-[10px]">Click to inspect pin</span>
          </div>

          {validLogs.length === 0 ? (
            <div className="text-center py-8 border rounded-lg text-xs text-muted-foreground">
              No location pins found for selected filters.
            </div>
          ) : (
            validLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <Card
                  key={log.id}
                  onClick={() => handleCenterOnLog(log)}
                  className={`cursor-pointer transition-all hover:border-primary text-xs ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : ""
                  }`}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{log.employeeName}</span>
                      <Badge
                        variant="outline"
                        className={
                          log.status === "LATE_PUNCH_IN"
                            ? "border-amber-500 text-amber-700 font-semibold text-[10px]"
                            : log.status === "PUNCHED_OUT"
                            ? "border-blue-500 text-blue-700 font-semibold text-[10px]"
                            : "border-emerald-500 text-emerald-700 font-semibold text-[10px]"
                        }
                      >
                        {log.status === "LATE_PUNCH_IN"
                          ? "Late"
                          : log.status === "PUNCHED_OUT"
                          ? "Punched Out"
                          : "On-Time"}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground text-[11px]">
                      {log.departmentName || "Engineering"} • {log.date}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-600 font-mono">
                        <MapPin className="h-3 w-3" /> {log.distanceMeters ?? "--"}m
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {log.punchInTime ? new Date(log.punchInTime).toLocaleTimeString() : "--"}
                      </span>
                    </div>

                    {log.punchInPhoto && (
                      <div className="pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPhoto(log.punchInPhoto || null);
                          }}
                          className="h-6 w-full text-[10px] gap-1 bg-muted/40 hover:bg-muted"
                        >
                          <Camera className="h-3 w-3 text-primary" /> View Selfie Photo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* PHOTO PREVIEW DIALOG */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-primary" /> Verified Punch-In Location Photo
            </DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <img
              src={previewPhoto}
              alt="Site Location Verification Selfie"
              className="w-full h-auto rounded-lg border object-cover shadow-sm"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
