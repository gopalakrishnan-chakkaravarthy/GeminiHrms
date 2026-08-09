import { getStatutorySettings } from "@/lib/data";
import { StatutorySettingsForm } from "@/components/app/statutory-settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StatutoryRulesPage() {
  const rules = await getStatutorySettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard/admin/payroll" className="hover:text-slate-800 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Payroll Management
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Statutory Compliance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline text-slate-900">
            Statutory Rules (PF, ESI/ESU, TDS)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Configure statutory withholding compliance rates, wage caps, and income tax slab brackets.
          </p>
        </div>
      </div>

      <StatutorySettingsForm initialRules={rules} />
    </div>
  );
}
