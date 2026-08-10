"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound, RefreshCw, Check, Copy, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { resetEmployeePasswordAction } from "@/app/dashboard/admin/actions";
import { type Employee } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

type ResetPasswordDialogProps = {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResetPasswordDialog({
  employee,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [customPassword, setCustomPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<{ newPassword: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleAutoGenerate = () => {
    const generated = `Pass#${Math.random().toString(36).substring(2, 8)}`;
    setCustomPassword(generated);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsPending(true);
    try {
      const res = await resetEmployeePasswordAction({
        employeeId: employee.id,
        customPassword,
        sendEmail,
      });

      if (res.success) {
        setResetSuccess({
          newPassword: res.newPassword || customPassword || "Updated",
          message: res.message,
        });
        toast({
          title: "Password Reset Successful",
          description: `Updated password for ${employee.name}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: res.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to reset password.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    setCustomPassword("");
    setResetSuccess(null);
    setCopied(false);
    onOpenChange(false);
  };

  const copyPassword = () => {
    if (resetSuccess?.newPassword) {
      navigator.clipboard.writeText(resetSuccess.newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Password copied to clipboard." });
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <KeyRound className="h-5 w-5 text-amber-600" />
            Reset Employee Password
          </DialogTitle>
          <DialogDescription>
            Set a new password or generate a random temporary password for <b>{employee.name}</b>.
          </DialogDescription>
        </DialogHeader>

        {!resetSuccess ? (
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.name}</span>
                <p className="text-slate-500">{employee.email}</p>
              </div>
              {employee.employeeId && (
                <span className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                  {employee.employeeId}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customPassword">New Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAutoGenerate}
                  className="h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Auto-Generate
                </Button>
              </div>
              <Input
                id="customPassword"
                type="text"
                placeholder="Leave blank to auto-generate random password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(!!checked)}
              />
              <Label htmlFor="sendEmail" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Send password reset email notification to <b>{employee.email}</b>
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-3">
            <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <AlertTitle className="font-bold">Password Reset Successful</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                {resetSuccess.message}
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>New Password Credentials</span>
                {sendEmail && <span className="flex items-center gap-1 text-emerald-400"><MailCheck className="h-3 w-3" /> Email Sent</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold text-amber-400 tracking-wider">
                  {resetSuccess.newPassword}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={copyPassword}
                  className="h-8 gap-1 text-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy Password"}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                Done & Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
