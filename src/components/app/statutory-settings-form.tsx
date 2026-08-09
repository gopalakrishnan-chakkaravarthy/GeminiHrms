"use client";

import { useState, useTransition, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldAlert, Calculator, Landmark, HeartPulse, Percent, CheckCircle2, DollarSign, Info, Download, Upload, FileSpreadsheet, Printer, FileText, Save, RotateCcw, Clock, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateStatutorySettingsAction } from "@/app/dashboard/admin/actions";
import {
  calculateStatutoryBreakdown,
  type StatutoryRules,
  type TaxSlab,
} from "@/lib/statutory";
import { TaxSlabsChart } from "@/components/app/tax-slabs-chart";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Statutory Rules
    </Button>
  );
}

export function StatutorySettingsForm({ initialRules }: { initialRules: StatutoryRules }) {
  const [rules, setRules] = useState<StatutoryRules>(initialRules);
  const [slabs, setSlabs] = useState<TaxSlab[]>(initialRules.taxSlabs || []);
  
  // Simulator State
  const [simBasic, setSimBasic] = useState<number>(5000);
  const [simGross, setSimGross] = useState<number>(8000);

  // Auto-Save States
  const DRAFT_KEY = "statutory_settings_form_draft_v1";
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{ rules: StatutoryRules; slabs: TaxSlab[]; savedAt: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initialState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(updateStatutorySettingsAction, initialState);
  const { toast } = useToast();

  // Check for auto-saved draft on component mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(DRAFT_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && parsed.rules && Array.isArray(parsed.slabs) && parsed.savedAt) {
          const isDifferent =
            JSON.stringify(parsed.rules) !== JSON.stringify(initialRules) ||
            JSON.stringify(parsed.slabs) !== JSON.stringify(initialRules.taxSlabs || []);
          if (isDifferent) {
            setPendingDraft(parsed);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load statutory settings draft from local storage:", err);
    } finally {
      setIsInitialized(true);
    }
  }, [initialRules]);

  // Periodic Debounced Auto-Save Effect
  useEffect(() => {
    if (!isInitialized) return;

    setAutoSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      try {
        const isDifferentFromInitial =
          JSON.stringify(rules) !== JSON.stringify(initialRules) ||
          JSON.stringify(slabs) !== JSON.stringify(initialRules.taxSlabs || []);

        if (isDifferentFromInitial) {
          const nowStr = new Date().toISOString();
          const displayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            rules,
            slabs,
            savedAt: nowStr,
          }));
          setLastSavedTime(displayTime);
          setAutoSaveStatus("saved");
        } else {
          localStorage.removeItem(DRAFT_KEY);
          setLastSavedTime(null);
          setAutoSaveStatus("idle");
        }
      } catch (err) {
        console.error("Auto-save draft failed:", err);
        setAutoSaveStatus("idle");
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [rules, slabs, isInitialized, initialRules]);

  // Server response handling and draft cleanup
  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {}
      setPendingDraft(null);
      setLastSavedTime(null);
      setAutoSaveStatus("idle");
    } else if (state.message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setRules(pendingDraft.rules);
      setSlabs(pendingDraft.slabs);
      const displayTime = new Date(pendingDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(displayTime);
      setAutoSaveStatus("saved");
      setPendingDraft(null);
      toast({
        title: "Draft Restored",
        description: "Restored your unsaved configuration draft from local storage.",
      });
    }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
    setRules(initialRules);
    setSlabs(initialRules.taxSlabs || []);
    setPendingDraft(null);
    setLastSavedTime(null);
    setAutoSaveStatus("idle");
    toast({
      title: "Draft Discarded",
      description: "Reverted form state to the saved database configuration.",
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadCsvTemplate = () => {
    const headers = "minIncome,maxIncome,ratePercent\n";
    const rows = slabs.length > 0
      ? slabs.map(s => `${s.minIncome},${s.maxIncome === null ? "" : s.maxIncome},${s.ratePercent}`).join("\n")
      : "0,300000,0\n300000,600000,5\n600000,900000,10\n900000,1200000,15\n1200000,,20";

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "annual_tax_slabs_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Downloaded",
      description: "CSV template downloaded with required headers: minIncome, maxIncome, ratePercent.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const newSlabs: TaxSlab[] = parsed.map((item, idx) => ({
              id: `slab-upload-${Date.now()}-${idx}`,
              minIncome: Number(item.minIncome) || 0,
              maxIncome: item.maxIncome === null || item.maxIncome === "" || item.maxIncome === "null" || item.maxIncome === undefined ? null : Number(item.maxIncome),
              ratePercent: Number(item.ratePercent) || 0,
            }));
            if (newSlabs.length > 0) {
              setSlabs(newSlabs);
              toast({
                title: "Tax Slabs Imported",
                description: `Successfully imported ${newSlabs.length} tax slab configurations from JSON.`,
              });
            }
          }
        } else {
          // Parse CSV
          const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            toast({ variant: "destructive", title: "Invalid File", description: "CSV file must contain a header line and at least one data row." });
            return;
          }

          const newSlabs: TaxSlab[] = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(",").map(p => p.trim());
            if (parts.length >= 3) {
              const minInc = parseFloat(parts[0]) || 0;
              const rawMax = parts[1];
              const maxInc = rawMax === "" || rawMax.toLowerCase() === "null" || rawMax.toLowerCase() === "above" ? null : parseFloat(rawMax);
              const rate = parseFloat(parts[2]) || 0;

              newSlabs.push({
                id: `slab-upload-${Date.now()}-${i}`,
                minIncome: minInc,
                maxIncome: isNaN(maxInc as number) ? null : maxInc,
                ratePercent: rate,
              });
            }
          }

          if (newSlabs.length > 0) {
            setSlabs(newSlabs);
            toast({
              title: "Bulk Upload Complete",
              description: `Successfully imported ${newSlabs.length} annual income tax slabs from CSV template.`,
            });
          } else {
            toast({ variant: "destructive", title: "Upload Failed", description: "Could not parse any valid tax slabs from CSV." });
          }
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Parsing Error", description: err.message || "Failed to parse template file." });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  const downloadAllStatutoryConfigCsv = () => {
    const lines = [
      "STATUTORY RULES & TAX SLABS CONFIGURATION EXPORT",
      `Exported At,${new Date().toISOString()}`,
      "",
      "--- GENERAL STATUTORY SETTINGS ---",
      "Setting Name,Value,Description",
      `PF Enabled,${rules.pfEnabled},"Employees Provident Fund Active Status"`,
      `Employee PF Contribution Rate (%),${rules.employeePfRate},"Deducted from employee basic wage"`,
      `Employer PF Contribution Rate (%),${rules.employerPfRate},"Company matching contribution"`,
      `PF Basic Wage Ceiling Cap ($),${rules.pfBasicWageCap},"Maximum basic wage threshold for PF"`,
      `Calculate PF on Full Basic,${rules.calculateOnFullBasic},"Whether to ignore wage ceiling cap"`,
      `ESI/ESU Enabled,${rules.esiEnabled},"Employee State Insurance Active Status"`,
      `Employee ESI Contribution Rate (%),${rules.employeeEsiRate},"Health insurance employee share"`,
      `Employer ESI Contribution Rate (%),${rules.employerEsiRate},"Health insurance employer share"`,
      `ESI Monthly Gross Wage Threshold ($),${rules.esiGrossThreshold},"Maximum gross wage limit for ESI eligibility"`,
      `TDS/Tax Deduction Enabled,${rules.tdsEnabled},"Income Tax Withholding Active Status"`,
      `TDS Mode,${rules.tdsMode},"Tax calculation mode (SLAB or FLAT)"`,
      `Flat TDS Rate (%),${rules.flatTdsRate},"Applicable when TDS Mode is FLAT"`,
      `Standard Annual Tax Deduction ($),${rules.standardDeductionAnnual},"Exempted annual tax deduction amount"`,
      "",
      "--- ANNUAL INCOME TAX SLABS CONFIGURATION ---",
      "Slab Index,Min Annual Income ($),Max Annual Income ($),Tax Rate (%)",
      ...slabs.map((slab, idx) =>
        `Slab ${idx + 1},${slab.minIncome},${slab.maxIncome === null ? "Above (No Cap)" : slab.maxIncome},${slab.ratePercent}`
      ),
    ];

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `statutory_rules_and_tax_slabs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Successfully downloaded statutory settings and tax slab configurations to CSV.",
    });
  };

  const exportPdfSummaryReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ variant: "destructive", title: "Popup Blocked", description: "Please allow popups to view and print the summary report." });
      return;
    }

    const generatedDate = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "medium",
    });

    const docRef = `STAT-AUDIT-${Math.floor(100000 + Math.random() * 900000)}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Statutory Rules & Compliance Configuration Summary Report</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.45;
      margin: 0;
      padding: 20px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #047857;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header-bar h1 {
      font-size: 18px;
      font-weight: 800;
      color: #065f46;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-bar p {
      font-size: 11px;
      color: #475569;
      margin: 0;
    }
    .meta-box {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 11px;
    }
    .meta-item strong {
      color: #334155;
      display: inline-block;
      width: 150px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #047857;
      padding-left: 8px;
      margin: 18px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
    }
    td.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-active {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-disabled {
      background-color: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }
    .footer-signatures {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .sig-box {
      width: 45%;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 36px;
      padding-top: 4px;
      font-weight: 600;
      color: #334155;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background-color: #047857; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 12px;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header-bar">
    <div>
      <h1>Statutory Compliance Configuration Report</h1>
      <p>Official Summary Record of Active PF, ESI, and Tax Slabs Configuration</p>
    </div>
    <div style="text-align: right;">
      <p><strong>Ref ID:</strong> ${docRef}</p>
      <p><strong>Date Generated:</strong> ${generatedDate}</p>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item"><strong>Compliance Status:</strong> Verified & Active</div>
    <div class="meta-item"><strong>Generated By:</strong> Payroll Compliance Administrator</div>
    <div class="meta-item"><strong>Organization Scope:</strong> HR & Corporate Payroll</div>
    <div class="meta-item"><strong>Tax Mode:</strong> ${rules.tdsMode} (${rules.tdsMode === "SLAB" ? slabs.length + " Slabs" : "Flat Rate"})</div>
  </div>

  <!-- SECTION 1: PROVIDENT FUND (PF) -->
  <div class="section-title">1. Employees' Provident Fund (PF) Settings</div>
  <table>
    <thead>
      <tr>
        <th>Setting Name</th>
        <th>Value / Rate</th>
        <th>Description & Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>PF Active Status</td>
        <td><span class="badge ${rules.pfEnabled ? "badge-active" : "badge-disabled"}">${rules.pfEnabled ? "Active" : "Disabled"}</span></td>
        <td>Enables automatic Provident Fund deductions on monthly payroll</td>
      </tr>
      <tr>
        <td>Employee Contribution Rate</td>
        <td class="mono">${rules.employeePfRate}%</td>
        <td>Standard employee basic salary deduction rate</td>
      </tr>
      <tr>
        <td>Employer Contribution Rate</td>
        <td class="mono">${rules.employerPfRate}%</td>
        <td>Company matching contribution share</td>
      </tr>
      <tr>
        <td>Basic Wage Ceiling Cap</td>
        <td class="mono">${rules.calculateOnFullBasic ? "Unlimited (Full Basic Wage)" : "$" + rules.pfBasicWageCap.toLocaleString() + " / month"}</td>
        <td>${rules.calculateOnFullBasic ? "Calculate PF on full basic wage without capping" : "Maximum basic salary cap limit for PF deduction"}</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2: ESI HEALTH INSURANCE -->
  <div class="section-title">2. Employee State Insurance (ESI) Settings</div>
  <table>
    <thead>
      <tr>
        <th>Setting Name</th>
        <th>Value / Rate</th>
        <th>Description & Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>ESI Active Status</td>
        <td><span class="badge ${rules.esiEnabled ? "badge-active" : "badge-disabled"}">${rules.esiEnabled ? "Active" : "Disabled"}</span></td>
        <td>Enables ESI health insurance contributions for eligible wage brackets</td>
      </tr>
      <tr>
        <td>Employee ESI Rate</td>
        <td class="mono">${rules.employeeEsiRate}%</td>
        <td>Deducted from gross salary for eligible employees</td>
      </tr>
      <tr>
        <td>Employer ESI Rate</td>
        <td class="mono">${rules.employerEsiRate}%</td>
        <td>Employer contribution share</td>
      </tr>
      <tr>
        <td>Monthly Gross Eligibility Limit</td>
        <td class="mono">$${rules.esiGrossThreshold.toLocaleString()} / month</td>
        <td>Employees with monthly gross salary below this limit are ESI eligible</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: INCOME TAX (TDS) -->
  <div class="section-title">3. Tax Deducted at Source (TDS) Settings</div>
  <table>
    <thead>
      <tr>
        <th>Setting Name</th>
        <th>Value / Rate</th>
        <th>Description & Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>TDS Withholding Status</td>
        <td><span class="badge ${rules.tdsEnabled ? "badge-active" : "badge-disabled"}">${rules.tdsEnabled ? "Active" : "Disabled"}</span></td>
        <td>Automated income tax withholding calculation on payroll runs</td>
      </tr>
      <tr>
        <td>Tax Computation Mode</td>
        <td class="mono">${rules.tdsMode}</td>
        <td>${rules.tdsMode === "SLAB" ? "Calculated dynamically based on active annual tax slabs" : "Fixed percentage withheld from taxable gross"}</td>
      </tr>
      ${
        rules.tdsMode === "FLAT"
          ? `<tr>
              <td>Flat TDS Rate</td>
              <td class="mono">${rules.flatTdsRate}%</td>
              <td>Fixed flat rate applied to gross income</td>
            </tr>`
          : ""
      }
      <tr>
        <td>Annual Standard Tax Deduction</td>
        <td class="mono">$${rules.standardDeductionAnnual.toLocaleString()} / year</td>
        <td>Tax-exempt standard deduction subtracted from annual gross income</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 4: INCOME TAX SLABS TABLE -->
  ${
    rules.tdsMode === "SLAB"
      ? `<div class="section-title">4. Configured Annual Income Tax Slabs</div>
         <table>
           <thead>
             <tr>
               <th>Slab Index</th>
               <th>Min Annual Income ($)</th>
               <th>Max Annual Income ($)</th>
               <th>Tax Rate (%)</th>
             </tr>
           </thead>
           <tbody>
             ${slabs
               .map(
                 (s, idx) => `
                 <tr>
                   <td>Slab ${idx + 1}</td>
                   <td class="mono">$${s.minIncome.toLocaleString()}</td>
                   <td class="mono">${s.maxIncome === null ? "Above (No Cap)" : "$" + s.maxIncome.toLocaleString()}</td>
                   <td class="mono">${s.ratePercent}%</td>
                 </tr>
               `
               )
               .join("")}
           </tbody>
         </table>`
      : ""
  }

  <div class="footer-signatures">
    <div class="sig-box">
      <p class="sig-line">Payroll Compliance Administrator</p>
      <p style="color: #64748b; margin-top: 2px;">Signature & Stamp</p>
    </div>
    <div class="sig-box">
      <p class="sig-line">HR Compliance Director</p>
      <p style="color: #64748b; margin-top: 2px;">Official Approval Date</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    toast({
      title: "PDF Report Ready",
      description: "Official statutory summary report generated and ready for print/export.",
    });
  };

  const updateSlab = (index: number, field: keyof TaxSlab, val: any) => {
    const updated = [...slabs];
    updated[index] = { ...updated[index], [field]: val };
    setSlabs(updated);
  };

  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const newMin = last && last.maxIncome ? last.maxIncome + 1 : 1200001;
    setSlabs([
      ...slabs,
      {
        id: `slab-${Date.now()}`,
        minIncome: newMin,
        maxIncome: newMin + 300000,
        ratePercent: 25,
      },
    ]);
  };

  const removeSlab = (index: number) => {
    if (slabs.length <= 1) return;
    setSlabs(slabs.filter((_, i) => i !== index));
  };

  // Run live calculation for simulation
  const simResult = calculateStatutoryBreakdown(simBasic, simGross, {
    ...rules,
    taxSlabs: slabs,
  });

  return (
    <div className="space-y-6">
      {/* UNSAVED DRAFT ALERT BANNER */}
      {pendingDraft && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2 rounded-lg shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                Unsaved Configuration Draft Detected
                <Badge className="bg-amber-200 text-amber-900 border-amber-300 text-[10px]">Auto-Saved</Badge>
              </h4>
              <p className="text-xs text-amber-800">
                Found an unsaved draft from {new Date(pendingDraft.savedAt).toLocaleString()} in local storage. Would you like to restore it?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={handleRestoreDraft}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
              className="border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs"
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* COMPLIANCE HEALTH CHECK SUMMARY WIDGET */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
                  Compliance Health
                </Badge>
                <span className="text-xs text-slate-300">Admin Audit Dashboard</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Compliance Health Status
              </h3>
              <p className="text-xs text-slate-300">
                Live compliance readiness check based on current Provident Fund, Health Insurance, and Tax Slab configurations.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={exportPdfSummaryReport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm border border-emerald-400/30"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Export Summary Report (PDF)
                </Button>
              </div>
            </div>

            {/* STATUS BADGES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PF STATUS */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5 text-emerald-400" /> Provident Fund
                  </span>
                  <Badge className={rules.pfEnabled ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px]" : "bg-slate-700 text-slate-300 text-[10px]"}>
                    {rules.pfEnabled ? "PF: Active" : "PF: Disabled"}
                  </Badge>
                </div>
                <p className="text-xs font-mono font-bold text-white">
                  Emp {rules.employeePfRate}% | Comp {rules.employerPfRate}%
                </p>
                <p className="text-[10px] text-slate-300">
                  {rules.calculateOnFullBasic ? "Full Basic Wage" : `Cap @ $${rules.pfBasicWageCap.toLocaleString()}/mo`}
                </p>
              </div>

              {/* ESI STATUS */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <HeartPulse className="h-3.5 w-3.5 text-blue-400" /> ESI Health
                  </span>
                  <Badge className={rules.esiEnabled ? "bg-blue-500/20 text-blue-300 border-blue-400/40 text-[10px]" : "bg-slate-700 text-slate-300 text-[10px]"}>
                    {rules.esiEnabled ? "ESI: Active" : "ESI: Disabled"}
                  </Badge>
                </div>
                <p className="text-xs font-mono font-bold text-white">
                  Emp {rules.employeeEsiRate}% | Comp {rules.employerEsiRate}%
                </p>
                <p className="text-[10px] text-slate-300">
                  Gross Limit: &lt; ${rules.esiGrossThreshold.toLocaleString()}/mo
                </p>
              </div>

              {/* TDS STATUS */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-amber-400" /> Income Tax (TDS)
                  </span>
                  <Badge className={
                    !rules.tdsEnabled
                      ? "bg-slate-700 text-slate-300 text-[10px]"
                      : rules.tdsMode === "SLAB" && slabs.length === 0
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/40 text-[10px]"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px]"
                  }>
                    {!rules.tdsEnabled
                      ? "TDS: Disabled"
                      : rules.tdsMode === "SLAB" && slabs.length === 0
                      ? "TDS: Pending Review"
                      : "TDS: Up to Date"}
                  </Badge>
                </div>
                <p className="text-xs font-mono font-bold text-white">
                  {rules.tdsMode === "SLAB" ? `${slabs.length} Progressive Slabs` : `Flat ${rules.flatTdsRate}% Rate`}
                </p>
                <p className="text-[10px] text-slate-300">
                  Std Deduction: ${rules.standardDeductionAnnual.toLocaleString()}/yr
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form action={dispatch}>
        <input type="hidden" name="taxSlabsJson" value={JSON.stringify(slabs)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: SETTINGS CONFIGURATION TABS (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="pf" className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="pf" className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                  <Landmark className="h-4 w-4 text-emerald-700" /> Provident Fund (PF)
                </TabsTrigger>
                <TabsTrigger value="esi" className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                  <HeartPulse className="h-4 w-4 text-blue-600" /> ESI / ESU Health
                </TabsTrigger>
                <TabsTrigger value="tds" className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                  <Percent className="h-4 w-4 text-amber-600" /> Income Tax (TDS)
                </TabsTrigger>
              </TabsList>

              {/* PF TAB */}
              <TabsContent value="pf" className="mt-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Landmark className="h-5 w-5 text-emerald-700" /> Employees' Provident Fund (PF) Rules
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                          Configure statutory social security savings deducted from employee basic salary.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="pfEnabled" className="text-xs font-semibold text-slate-700">
                          {rules.pfEnabled ? "Active" : "Disabled"}
                        </Label>
                        <Switch
                          id="pfEnabled"
                          name="pfEnabled"
                          checked={rules.pfEnabled}
                          onCheckedChange={(c) => setRules({ ...rules, pfEnabled: c })}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeePfRate" className="text-xs font-bold text-slate-700">
                          Employee PF Contribution (%)
                        </Label>
                        <div className="relative">
                          <Input
                            id="employeePfRate"
                            name="employeePfRate"
                            type="number"
                            step="0.01"
                            value={rules.employeePfRate}
                            onChange={(e) => setRules({ ...rules, employeePfRate: parseFloat(e.target.value) || 0 })}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Standard rate is 12% deducted from Basic Salary.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employerPfRate" className="text-xs font-bold text-slate-700">
                          Employer PF Contribution (%)
                        </Label>
                        <div className="relative">
                          <Input
                            id="employerPfRate"
                            name="employerPfRate"
                            type="number"
                            step="0.01"
                            value={rules.employerPfRate}
                            onChange={(e) => setRules({ ...rules, employerPfRate: parseFloat(e.target.value) || 0 })}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Matching statutory company contribution.</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pfBasicWageCap" className="text-xs font-bold text-slate-700">
                          Statutory Basic Wage Cap ($)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                          <Input
                            id="pfBasicWageCap"
                            name="pfBasicWageCap"
                            type="number"
                            value={rules.pfBasicWageCap}
                            onChange={(e) => setRules({ ...rules, pfBasicWageCap: parseFloat(e.target.value) || 0 })}
                            className="pl-7"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">Ceiling cap for statutory basic threshold (e.g. $15,000).</p>
                      </div>

                      <div className="flex flex-col justify-center space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="calculateOnFullBasic"
                            name="calculateOnFullBasic"
                            checked={rules.calculateOnFullBasic}
                            onCheckedChange={(c) => setRules({ ...rules, calculateOnFullBasic: c })}
                          />
                          <Label htmlFor="calculateOnFullBasic" className="text-xs font-semibold text-slate-800">
                            Calculate on Full Basic Salary (Ignore Wage Cap)
                          </Label>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {rules.calculateOnFullBasic
                            ? "PF applies to total actual basic salary."
                            : `PF is capped at $${rules.pfBasicWageCap.toLocaleString()} max basic.`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ESI / ESU TAB */}
              <TabsContent value="esi" className="mt-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <HeartPulse className="h-5 w-5 text-blue-600" /> Employee State Insurance / ESU Rules
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                          Health insurance and social safety net deductions based on monthly gross pay.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="esiEnabled" className="text-xs font-semibold text-slate-700">
                          {rules.esiEnabled ? "Active" : "Disabled"}
                        </Label>
                        <Switch
                          id="esiEnabled"
                          name="esiEnabled"
                          checked={rules.esiEnabled}
                          onCheckedChange={(c) => setRules({ ...rules, esiEnabled: c })}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeEsiRate" className="text-xs font-bold text-slate-700">
                          Employee ESI/ESU Contribution (%)
                        </Label>
                        <div className="relative">
                          <Input
                            id="employeeEsiRate"
                            name="employeeEsiRate"
                            type="number"
                            step="0.01"
                            value={rules.employeeEsiRate}
                            onChange={(e) => setRules({ ...rules, employeeEsiRate: parseFloat(e.target.value) || 0 })}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Standard employee rate is 0.75% of Gross Wages.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employerEsiRate" className="text-xs font-bold text-slate-700">
                          Employer ESI/ESU Contribution (%)
                        </Label>
                        <div className="relative">
                          <Input
                            id="employerEsiRate"
                            name="employerEsiRate"
                            type="number"
                            step="0.01"
                            value={rules.employerEsiRate}
                            onChange={(e) => setRules({ ...rules, employerEsiRate: parseFloat(e.target.value) || 0 })}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Standard employer share is 3.25% of Gross Wages.</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="esiGrossThreshold" className="text-xs font-bold text-slate-700">
                        Monthly Gross Salary Eligibility Limit ($)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                        <Input
                          id="esiGrossThreshold"
                          name="esiGrossThreshold"
                          type="number"
                          value={rules.esiGrossThreshold}
                          onChange={(e) => setRules({ ...rules, esiGrossThreshold: parseFloat(e.target.value) || 0 })}
                          className="pl-7"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        ESI/ESU applies only if employee monthly gross earnings are less than or equal to this limit (e.g. $21,000 / $2,100).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TDS TAB */}
              <TabsContent value="tds" className="mt-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Percent className="h-5 w-5 text-amber-600" /> Tax Deducted at Source (TDS) & Income Tax Slabs
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                          Configure monthly tax withholding according to annual projected income slabs.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tdsEnabled" className="text-xs font-semibold text-slate-700">
                          {rules.tdsEnabled ? "Active" : "Disabled"}
                        </Label>
                        <Switch
                          id="tdsEnabled"
                          name="tdsEnabled"
                          checked={rules.tdsEnabled}
                          onCheckedChange={(c) => setRules({ ...rules, tdsEnabled: c })}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="standardDeductionAnnual" className="text-xs font-bold text-slate-700">
                          Standard Annual Tax Deduction ($)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                          <Input
                            id="standardDeductionAnnual"
                            name="standardDeductionAnnual"
                            type="number"
                            value={rules.standardDeductionAnnual}
                            onChange={(e) => setRules({ ...rules, standardDeductionAnnual: parseFloat(e.target.value) || 0 })}
                            className="pl-7"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">Exempted amount subtracted before slab computation.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Tax Calculation Mode</Label>
                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="tdsMode"
                              value="SLAB"
                              checked={rules.tdsMode === "SLAB"}
                              onChange={() => setRules({ ...rules, tdsMode: "SLAB" })}
                              className="text-emerald-600"
                            />
                            Progressive Slabs
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="tdsMode"
                              value="FLAT"
                              checked={rules.tdsMode === "FLAT"}
                              onChange={() => setRules({ ...rules, tdsMode: "FLAT" })}
                              className="text-emerald-600"
                            />
                            Flat Withholding %
                          </label>
                        </div>
                        {rules.tdsMode === "FLAT" && (
                          <div className="mt-2">
                            <Input
                              name="flatTdsRate"
                              type="number"
                              step="0.1"
                              placeholder="Flat Rate %"
                              value={rules.flatTdsRate}
                              onChange={(e) => setRules({ ...rules, flatTdsRate: parseFloat(e.target.value) || 0 })}
                              className="text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* TAX SLABS TABLE */}
                    {rules.tdsMode === "SLAB" && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Annual Income Tax Slabs & Rate Brackets
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Upload bulk CSV template or manually configure slab limits.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept=".csv,.json"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={downloadAllStatutoryConfigCsv}
                              className="text-xs h-8 flex items-center gap-1 text-slate-800 border-slate-300 bg-white hover:bg-slate-100 font-semibold"
                              title="Download complete statutory rules and tax slab backup as CSV"
                            >
                              <Download className="h-3.5 w-3.5 text-emerald-700" /> Download All (CSV)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={downloadCsvTemplate}
                              className="text-xs h-8 flex items-center gap-1 text-slate-700 bg-white hover:bg-slate-100"
                              title="Download CSV template"
                            >
                              <Download className="h-3.5 w-3.5 text-slate-500" /> Template
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs h-8 flex items-center gap-1 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                              title="Upload tax slab configurations via CSV or JSON"
                            >
                              <Upload className="h-3.5 w-3.5 text-emerald-700" /> Bulk Upload CSV
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={addSlab} className="text-xs h-8 bg-white">
                              + Add Slab
                            </Button>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden border-slate-200">
                          <Table>
                            <TableHeader className="bg-slate-50">
                              <TableRow>
                                <TableHead className="text-xs">Min Income ($)</TableHead>
                                <TableHead className="text-xs">Max Income ($)</TableHead>
                                <TableHead className="text-xs">Tax Rate (%)</TableHead>
                                <TableHead className="text-xs text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {slabs.map((slab, idx) => (
                                <TableRow key={slab.id}>
                                  <TableCell className="p-2">
                                    <Input
                                      type="number"
                                      value={slab.minIncome}
                                      onChange={(e) => updateSlab(idx, "minIncome", parseFloat(e.target.value) || 0)}
                                      className="h-8 text-xs font-mono"
                                    />
                                  </TableCell>
                                  <TableCell className="p-2">
                                    <Input
                                      type="text"
                                      placeholder="Above"
                                      value={slab.maxIncome === null ? "" : slab.maxIncome}
                                      onChange={(e) =>
                                        updateSlab(
                                          idx,
                                          "maxIncome",
                                          e.target.value === "" ? null : parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="h-8 text-xs font-mono"
                                    />
                                  </TableCell>
                                  <TableCell className="p-2">
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        value={slab.ratePercent}
                                        onChange={(e) => updateSlab(idx, "ratePercent", parseFloat(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono pr-6"
                                      />
                                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSlab(idx)}
                                      className="h-8 text-xs text-rose-600 hover:text-rose-700"
                                      disabled={slabs.length <= 1}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Interactive Tax Slabs Progression Chart */}
                        <div className="pt-2">
                          <TaxSlabsChart slabs={slabs} rules={rules} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={downloadAllStatutoryConfigCsv}
                  className="w-full sm:w-auto text-xs md:text-sm font-semibold text-slate-800 border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-2 shadow-sm"
                >
                  <Download className="h-4 w-4 text-emerald-700" />
                  Download CSV
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={exportPdfSummaryReport}
                  className="w-full sm:w-auto text-xs md:text-sm font-semibold text-emerald-900 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2 shadow-sm"
                >
                  <Printer className="h-4 w-4 text-emerald-700" />
                  Export Summary Report (PDF)
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
                {/* Auto-Save Status Badge */}
                {autoSaveStatus === "saving" && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs flex items-center gap-1.5 py-1 px-2.5">
                    <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                    Auto-saving draft...
                  </Badge>
                )}
                {autoSaveStatus === "saved" && lastSavedTime && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs flex items-center gap-1.5 py-1 px-2.5 shadow-2xs">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Draft auto-saved at {lastSavedTime}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDiscardDraft}
                      className="text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-7 px-2 font-medium"
                    >
                      Discard Draft
                    </Button>
                  </div>
                )}
                {autoSaveStatus === "idle" && !lastSavedTime && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Save className="h-3.5 w-3.5 text-slate-400" /> Auto-save active
                  </span>
                )}
                <SubmitButton />
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE STATUTORY CALCULATOR & SIMULATION (1 Col) */}
          <div className="space-y-6">
            <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm sticky top-6">
              <CardHeader className="bg-emerald-900 text-white rounded-t-lg pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-100">
                  <Calculator className="h-5 w-5 text-emerald-300" /> Interactive Payroll Statutory Simulator
                </CardTitle>
                <CardDescription className="text-xs text-emerald-200/90">
                  Test sample salary inputs to preview real-time PF, ESI/ESU, and TDS calculations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Basic Salary ($)</Label>
                    <Input
                      type="number"
                      value={simBasic}
                      onChange={(e) => setSimBasic(parseFloat(e.target.value) || 0)}
                      className="font-mono text-xs h-8 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Gross Salary ($)</Label>
                    <Input
                      type="number"
                      value={simGross}
                      onChange={(e) => setSimGross(parseFloat(e.target.value) || 0)}
                      className="font-mono text-xs h-8 bg-white"
                    />
                  </div>
                </div>

                <Separator />

                {/* SIMULATION BREAKDOWN RESULTS */}
                <div className="space-y-2.5 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Statutory Deductions (Employee)
                  </h4>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">PF Employee ({rules.employeePfRate}%):</span>
                      <span className="font-mono font-bold text-rose-700">-${simResult.pfEmployee.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">ESI/ESU Employee ({rules.employeeEsiRate}%):</span>
                      <span className="font-mono font-bold text-rose-700">-${simResult.esiEmployee.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">TDS / Income Tax (Monthly):</span>
                      <span className="font-mono font-bold text-rose-700">-${simResult.tdsMonthly.toFixed(2)}</span>
                    </div>

                    <Separator className="my-1" />

                    <div className="flex justify-between items-center font-bold text-slate-900 pt-0.5">
                      <span>Total Statutory Deductions:</span>
                      <span className="font-mono text-rose-700">-${simResult.totalEmployeeDeductions.toFixed(2)}</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1 pt-2">
                    <Landmark className="h-3.5 w-3.5 text-blue-600" /> Employer Contributions (Company)
                  </h4>

                  <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Employer PF ({rules.employerPfRate}%):</span>
                      <span className="font-mono font-bold text-blue-900">+${simResult.pfEmployer.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Employer ESI ({rules.employerEsiRate}%):</span>
                      <span className="font-mono font-bold text-blue-900">+${simResult.esiEmployer.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-blue-200/80 font-semibold text-blue-950">
                      <span>Total Employer Contribution:</span>
                      <span className="font-mono text-blue-900">+${simResult.totalEmployerContributions.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* NET TAKE HOME */}
                  <div className="bg-emerald-900 text-white p-3.5 rounded-lg flex justify-between items-center mt-3 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-200">Estimated Net Payable</p>
                      <p className="text-xs text-emerald-100">After all deductions</p>
                    </div>
                    <span className="text-2xl font-black font-mono tracking-tight text-white">
                      ${simResult.netPayable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
