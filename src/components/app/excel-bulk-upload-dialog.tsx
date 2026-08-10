"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  FileText,
  Users,
  Key,
} from "lucide-react";
import { bulkCreateEmployeesAction, type BulkImportResult, type BulkEmployeeInputRow } from "@/app/dashboard/admin/actions";
import { type Role, type Department, type Employee } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

type ExcelBulkUploadDialogProps = {
  roles: Role[];
  departments: Department[];
  employees: Employee[];
  trigger?: React.ReactNode;
};

export function ExcelBulkUploadDialog({
  roles,
  departments,
  employees,
  trigger,
}: ExcelBulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkEmployeeInputRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownloadTemplate = (format: "xlsx" | "csv" = "xlsx") => {
    const sampleRole = roles[0]?.name || "Software Engineer";
    const sampleDept = departments[0]?.name || "Engineering";
    const sampleManager = employees[0]?.email || "alex.johnson@example.com";

    const templateData = [
      {
        "Full Name": "John Smith",
        "Email": "john.smith@company.com",
        "Role": sampleRole,
        "Department": sampleDept,
        "Manager Email": sampleManager,
        "Employee ID": "EMP101",
        "Phone Number": "+1234567890",
        "Emergency Contact": "+1987654321",
        "Blood Group": "O+",
        "Default Password": "Welcome@2026",
      },
      {
        "Full Name": "Emma Watson",
        "Email": "emma.watson@company.com",
        "Role": roles[1]?.name || sampleRole,
        "Department": departments[1]?.name || sampleDept,
        "Manager Email": sampleManager,
        "Employee ID": "EMP102",
        "Phone Number": "+1234567891",
        "Emergency Contact": "+1987654322",
        "Blood Group": "A+",
        "Default Password": "",
      },
      {
        "Full Name": "Michael Chang",
        "Email": "michael.chang@company.com",
        "Role": sampleRole,
        "Department": sampleDept,
        "Manager Email": sampleManager,
        "Employee ID": "EMP103",
        "Phone Number": "+1234567892",
        "Emergency Contact": "+1987654323",
        "Blood Group": "B+",
        "Default Password": "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 18 }, // Full Name
      { wch: 28 }, // Email
      { wch: 20 }, // Role
      { wch: 20 }, // Department
      { wch: 28 }, // Manager Email
      { wch: 14 }, // Employee ID
      { wch: 16 }, // Phone Number
      { wch: 18 }, // Emergency Contact
      { wch: 12 }, // Blood Group
      { wch: 18 }, // Default Password
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Template");

    if (format === "csv") {
      XLSX.writeFile(workbook, "employee_bulk_upload_template.csv", { bookType: "csv" });
    } else {
      XLSX.writeFile(workbook, "employee_bulk_upload_template.xlsx", { bookType: "xlsx" });
    }

    toast({
      title: "Template Downloaded",
      description: `Downloaded employee_bulk_upload_template.${format} file successfully.`,
    });
  };

  const parseFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          toast({
            variant: "destructive",
            title: "Empty File",
            description: "The uploaded file does not contain any rows.",
          });
          setParsedRows([]);
          return;
        }

        // Map column headers flexibly
        const mappedRows: BulkEmployeeInputRow[] = jsonData.map((row) => {
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(
                (k) => k.trim().toLowerCase() === key.toLowerCase()
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== "") {
                return String(row[matchedKey]).trim();
              }
            }
            return "";
          };

          return {
            name: getVal(["Full Name", "Name", "Employee Name", "First Name"]),
            email: getVal(["Email", "Email Address", "Work Email", "User Email"]),
            role: getVal(["Role", "Role Name", "Designation", "Job Title"]),
            department: getVal(["Department", "Dept", "Department Name"]),
            managerEmailOrId: getVal(["Manager Email", "Manager", "Manager ID", "Reports To"]),
            employeeId: getVal(["Employee ID", "Employee Code", "Emp ID", "Emp Code"]),
            phoneNumber: getVal(["Phone Number", "Phone", "Mobile"]),
            emergencyContactNumber: getVal(["Emergency Contact", "Emergency Phone", "Emergency Contact Number"]),
            bloodGroup: getVal(["Blood Group", "Blood Group"]),
            defaultPassword: getVal(["Default Password", "Password", "Initial Password"]),
          };
        });

        // Filter out completely blank rows
        const validRows = mappedRows.filter((r) => r.name || r.email);
        setParsedRows(validRows);

        toast({
          title: "File Parsed",
          description: `Loaded ${validRows.length} employee row(s) from "${uploadedFile.name}".`,
        });
      } catch (err: any) {
        console.error("Parse Error:", err);
        toast({
          variant: "destructive",
          title: "Error Parsing File",
          description: "Could not read the spreadsheet. Please use valid .xlsx or .csv format.",
        });
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (parsedRows.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "Please upload an Excel or CSV file with employee data.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await bulkCreateEmployeesAction(parsedRows);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Bulk Creation Complete",
          description: `Successfully imported ${result.successCount} employee(s). Welcome emails dispatched.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Import Failed or Incomplete",
          description: result.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Import Error",
        description: err.message || "An unexpected error occurred during bulk creation.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    }
    toast({ title: "Copied!", description: "Copied credentials to clipboard." });
  };

  const copyAllCredentialsFormatted = () => {
    if (!importResult?.importedEmployees) return;
    const formatted = importResult.importedEmployees
      .map(
        (e) =>
          `Name: ${e.name}\nEmail: ${e.email}\nDefault Password: ${e.defaultPassword}${
            e.employeeId ? `\nEmployee ID: ${e.employeeId}` : ""
          }\n---`
      )
      .join("\n");
    copyToClipboard(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Bulk Import Excel
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Bulk Upload Employees via Excel
          </DialogTitle>
          <DialogDescription>
            Download the official Excel template, fill in employee details, and upload to create multiple accounts at once. Default passwords and welcome emails will be sent automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
          {/* STEP 1: DOWNLOAD TEMPLATE BANNER */}
          {!importResult && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-600" /> Download Employee Excel Template
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Includes formatted columns for Full Name, Email, Role, Department, Manager, Phone, and Default Password.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadTemplate("xlsx")}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 font-semibold text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Excel (.xlsx)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadTemplate("csv")}
                  className="text-xs text-slate-600"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> CSV
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: FILE UPLOAD ZONE OR RESULT SUMMARY */}
          {!importResult ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {file ? file.name : "Click to select or drag & drop Excel / CSV file"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports .xlsx, .xls, and .csv files
                  </p>
                </div>
                {file && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                    Loaded File: {file.name} ({parsedRows.length} rows detected)
                  </Badge>
                )}
              </div>

              {/* PREVIEW TABLE OF PARSED ROWS */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-600" />
                      Parsed Rows Preview ({parsedRows.length})
                    </h4>
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-rose-600 h-7 px-2">
                      Clear & Upload Different File
                    </Button>
                  </div>

                  <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-900">
                    <ScrollArea className="h-56">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800 text-xs">
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Manager Email</TableHead>
                            <TableHead>Default Password</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {parsedRows.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                                {row.name || <span className="text-rose-500 font-normal">Missing Name</span>}
                              </TableCell>
                              <TableCell>
                                {row.email || <span className="text-rose-500 font-normal">Missing Email</span>}
                              </TableCell>
                              <TableCell>{row.role || <span className="text-slate-400">Auto (Default)</span>}</TableCell>
                              <TableCell>{row.department || <span className="text-slate-400">Auto (Default)</span>}</TableCell>
                              <TableCell>{row.managerEmailOrId || <span className="text-slate-400">None</span>}</TableCell>
                              <TableCell className="font-mono text-emerald-600 font-medium">
                                {row.defaultPassword || <span className="text-slate-400 font-sans italic">Auto-generate</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 3: IMPORT RESULT REPORT */
            <div className="space-y-4">
              <Alert className={importResult.success ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100" : "border-amber-500 bg-amber-50 dark:bg-amber-950/40"}>
                {importResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                <AlertTitle className="font-bold text-base">
                  {importResult.success ? "Import Completed" : "Import Completed with Issues"}
                </AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {importResult.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{importResult.totalProcessed}</div>
                  <div className="text-[11px] text-slate-500 font-medium uppercase">Total Rows</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg">
                  <div className="text-2xl font-extrabold text-emerald-600">{importResult.successCount}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold uppercase">Created</div>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-lg">
                  <div className="text-2xl font-extrabold text-rose-600">{importResult.failedCount}</div>
                  <div className="text-[11px] text-rose-700 font-semibold uppercase">Failed / Skipped</div>
                </div>
              </div>

              {/* SUCCESSFUL IMPORTS LIST WITH COPY CREDENTIALS */}
              {importResult.importedEmployees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-emerald-600" />
                      Created Employee Credentials ({importResult.importedEmployees.length})
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyAllCredentialsFormatted}
                      className="text-xs h-7 gap-1 border-slate-300"
                    >
                      {allCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {allCopied ? "Copied All!" : "Copy All Credentials"}
                    </Button>
                  </div>

                  <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-900">
                    <ScrollArea className="h-48">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800 text-xs">
                          <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Email Address</TableHead>
                            <TableHead>Default Password</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {importResult.importedEmployees.map((emp, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{emp.name}</TableCell>
                              <TableCell className="text-blue-600">{emp.email}</TableCell>
                              <TableCell className="font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 py-1 px-2 rounded w-fit">
                                {emp.defaultPassword}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`Email: ${emp.email}\nPassword: ${emp.defaultPassword}`, idx)}
                                  className="h-6 px-2 text-[11px]"
                                >
                                  {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                  {copiedIndex === idx ? "Copied" : "Copy"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* ERRORS / SKIPPED ROWS */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Failed Rows & Errors ({importResult.errors.length})
                  </h4>
                  <div className="border border-rose-200 rounded-md p-3 bg-rose-50/50 dark:bg-rose-950/20 max-h-36 overflow-y-auto space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-2 border-b border-rose-200/50 pb-1 last:border-0 last:pb-0">
                        <span className="font-mono font-bold text-rose-600 shrink-0">Row {err.rowNumber}:</span>
                        <div>
                          {err.name && <span className="font-semibold mr-1">{err.name}</span>}
                          {err.email && <span className="text-slate-600 mr-1">({err.email})</span>}
                          <span className="text-rose-700 dark:text-rose-300">— {err.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          {!importResult ? (
            <>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isProcessing || parsedRows.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? "Processing Upload..." : `Import ${parsedRows.length} Employee(s)`}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleReset}>
                Upload Another File
              </Button>
              <Button type="button" onClick={() => setOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800">
                Done & Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
