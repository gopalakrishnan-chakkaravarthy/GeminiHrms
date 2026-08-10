"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Leaf, Lock, Mail, Eye, EyeOff, LogIn, UserCheck, Shield, Sparkles, KeyRound, CheckCircle2, Loader2, Copy, Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string; tempPass?: string } | null>(null);
  const [copiedTempPass, setCopiedTempPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrId, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to log in. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Successful login - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    setResetResult(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      setResetResult({
        success: data.success,
        message: data.message,
        tempPass: data.temporaryPassword,
      });
    } catch (err: any) {
      setResetResult({
        success: false,
        message: err.message || "Failed to send password reset request.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const fillQuickUser = (email: string, pass: string) => {
    setEmailOrId(email);
    setPassword(pass);
    setError("");
  };

  const copyTempPass = () => {
    if (resetResult?.tempPass) {
      navigator.clipboard.writeText(resetResult.tempPass);
      setCopiedTempPass(true);
      setTimeout(() => setCopiedTempPass(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20 text-white mb-2">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-headline">
            AbsenceAce
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI-Powered Leave & Payroll Management Platform
          </p>
        </div>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-sm bg-white/90 dark:bg-slate-900/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your employee email or User ID to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrId">Email or Employee ID</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="emailOrId"
                    type="text"
                    placeholder="e.g. alex.johnson@example.com or user_101"
                    className="pl-9"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(emailOrId.includes("@") ? emailOrId : "");
                      setResetResult(null);
                      setResetDialogOpen(true);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </span>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Login Options
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start gap-2 h-auto py-2 px-3 text-left font-normal"
                  onClick={() => fillQuickUser("alex.johnson@example.com", "Password@123")}
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">Alex Johnson</div>
                    <div className="text-[10px] text-slate-500 truncate">HR Admin</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start gap-2 h-auto py-2 px-3 text-left font-normal"
                  onClick={() => fillQuickUser("sarah.connor@example.com", "Password@123")}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">Sarah Connor</div>
                    <div className="text-[10px] text-slate-500 truncate">Manager</div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-center text-slate-500 dark:text-slate-400 justify-center border-t border-slate-100 dark:border-slate-800 pt-3">
            Protected by Custom JWT & Role-Based Access Control
          </CardFooter>
        </Card>
      </div>

      {/* FORGOT PASSWORD DIALOG */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-600" /> Reset Your Password
            </DialogTitle>
            <DialogDescription>
              Enter your registered work email address. We will generate a temporary password and dispatch login instructions.
            </DialogDescription>
          </DialogHeader>

          {!resetResult ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="e.g. employee@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setResetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resetLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request Reset
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <Alert className={resetResult.success ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100" : "border-rose-500 bg-rose-50 dark:bg-rose-950/40"}>
                {resetResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Lock className="h-5 w-5 text-rose-600" />}
                <AlertTitle className="font-bold">{resetResult.success ? "Request Sent" : "Reset Failed"}</AlertTitle>
                <AlertDescription className="text-xs mt-1">{resetResult.message}</AlertDescription>
              </Alert>

              {resetResult.success && resetResult.tempPass && (
                <div className="p-3 bg-slate-900 text-white rounded-lg space-y-1.5">
                  <div className="text-xs text-slate-400">Temporary Password Generated:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-emerald-400">{resetResult.tempPass}</span>
                    <Button type="button" size="sm" variant="secondary" onClick={copyTempPass} className="h-7 text-xs">
                      {copiedTempPass ? <Check className="h-3 w-3 text-emerald-600 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copiedTempPass ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    if (resetResult.success && resetResult.tempPass) {
                      setPassword(resetResult.tempPass);
                      if (resetEmail) setEmailOrId(resetEmail);
                    }
                    setResetDialogOpen(false);
                  }}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {resetResult.success ? "Use Temp Password to Sign In" : "Close"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
