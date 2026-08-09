"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  BarChart as BarChartIcon,
  TrendingUp,
  Percent,
  DollarSign,
  Info,
  Calculator,
  Sliders,
  Sparkles,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import { TaxSlab, StatutoryRules, calculateStatutoryBreakdown } from "@/lib/statutory";

interface TaxSlabsChartProps {
  slabs: TaxSlab[];
  rules: StatutoryRules;
}

const BAR_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // purple-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
];

export function TaxSlabsChart({ slabs, rules }: TaxSlabsChartProps) {
  const [viewMode, setViewMode] = useState<"slabs" | "simulator" | "incomeProgression">("simulator");
  const [exampleSalaryAnnual, setExampleSalaryAnnual] = useState<number>(900000); // $900,000 default

  // Format currency helpers
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val.toLocaleString()}`;
  };

  // Calculate detailed breakdown for custom example salary
  const monthlyGross = exampleSalaryAnnual / 12;
  const monthlyBasic = monthlyGross * 0.5; // standard 50% basic ratio
  const calculationResult = calculateStatutoryBreakdown(monthlyBasic, monthlyGross, {
    ...rules,
    taxSlabs: slabs,
  });

  // Calculate slab-by-slab tax breakdown for example salary
  const annualGross = exampleSalaryAnnual;
  const annualPf = calculationResult.pfEmployee * 12;
  const taxableIncome = Math.max(0, annualGross - annualPf - rules.standardDeductionAnnual);

  let accumulatedTax = 0;
  const slabBreakdown = slabs.map((slab, index) => {
    const min = slab.minIncome;
    const max = slab.maxIncome;

    let slabTaxable = 0;
    if (max === null) {
      if (taxableIncome > min) {
        slabTaxable = taxableIncome - min;
      }
    } else {
      if (taxableIncome > min) {
        slabTaxable = Math.min(taxableIncome, max) - min;
      }
    }

    const slabTax = slabTaxable * (slab.ratePercent / 100);
    accumulatedTax += slabTax;

    return {
      slabIndex: index + 1,
      min,
      max,
      ratePercent: slab.ratePercent,
      slabTaxable,
      slabTax,
      color: BAR_COLORS[index % BAR_COLORS.length],
    };
  });

  // Data for Stacked Impact Chart for Example Salary
  const monthlyTax = calculationResult.tdsMonthly;
  const monthlyPf = calculationResult.pfEmployee;
  const monthlyEsi = calculationResult.esiEmployee;
  const monthlyNet = calculationResult.netPayable;

  const salaryCompositionData = [
    { name: "Net Take-Home", value: Math.round(monthlyNet), color: "#10b981" },
    { name: "Income Tax (TDS)", value: Math.round(monthlyTax), color: "#f59e0b" },
    { name: "PF Deduction", value: Math.round(monthlyPf), color: "#3b82f6" },
    { name: "ESI Deduction", value: Math.round(monthlyEsi), color: "#8b5cf6" },
  ].filter((item) => item.value > 0);

  // Prepare data for Tax Slab Progression chart
  const slabChartData = slabs.map((slab, index) => {
    const minStr = formatCurrency(slab.minIncome);
    const maxStr = slab.maxIncome !== null ? formatCurrency(slab.maxIncome) : "Above";
    const label = `${minStr} - ${maxStr}`;

    let maxTaxInBracket = 0;
    if (slab.maxIncome !== null) {
      maxTaxInBracket = (slab.maxIncome - slab.minIncome) * (slab.ratePercent / 100);
    }

    return {
      name: label,
      ratePercent: slab.ratePercent,
      minIncome: slab.minIncome,
      maxIncome: slab.maxIncome,
      maxTaxInBracket: Math.round(maxTaxInBracket),
      color: BAR_COLORS[index % BAR_COLORS.length],
    };
  });

  // Prepare data for Effective Income Progression chart
  const sampleIncomes = [300000, 600000, 900000, 1200000, 1500000, 2000000];
  const incomeProgressionData = sampleIncomes.map((gross) => {
    const mGross = gross / 12;
    const mBasic = mGross * 0.5;
    const res = calculateStatutoryBreakdown(mBasic, mGross, {
      ...rules,
      taxSlabs: slabs,
    });

    const annualTax = res.annualTax;
    const effectiveRate = gross > 0 ? (annualTax / gross) * 100 : 0;

    return {
      incomeLabel: formatCurrency(gross),
      annualGross: gross,
      annualTax: Math.round(annualTax),
      monthlyTax: Math.round(res.tdsMonthly),
      effectiveRate: parseFloat(effectiveRate.toFixed(2)),
      netTakeHomeAnnual: Math.round(res.netPayable * 12),
    };
  });

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" /> Interactive Tax Impact Simulator & Preview
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Visualize how tax slab adjustments impact annual withholdings and monthly net take-home pay.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
            <Button
              type="button"
              variant={viewMode === "simulator" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("simulator")}
              className={`text-xs h-7 px-2.5 font-medium ${
                viewMode === "simulator" ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-slate-700"
              }`}
            >
              <Calculator className="h-3.5 w-3.5 mr-1" /> Salary Simulator
            </Button>
            <Button
              type="button"
              variant={viewMode === "slabs" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("slabs")}
              className={`text-xs h-7 px-2.5 font-medium ${
                viewMode === "slabs" ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-slate-700"
              }`}
            >
              <Percent className="h-3.5 w-3.5 mr-1" /> Slab Rates (%)
            </Button>
            <Button
              type="button"
              variant={viewMode === "incomeProgression" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("incomeProgression")}
              className={`text-xs h-7 px-2.5 font-medium ${
                viewMode === "incomeProgression" ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-slate-700"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> Income Range
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* VIEW MODE 1: INTERACTIVE SALARY SIMULATOR */}
        {viewMode === "simulator" && (
          <div className="space-y-6">
            {/* SALARY CONTROLS */}
            <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label htmlFor="exampleSalary" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-amber-600" /> Test Annual Gross Salary ($)
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Adjust salary to see real-time tax deduction impact under modified slab rates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-36">
                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="exampleSalary"
                      type="number"
                      step={10000}
                      value={exampleSalaryAnnual}
                      onChange={(e) => setExampleSalaryAnnual(Math.max(0, Number(e.target.value)))}
                      className="pl-8 h-8 text-xs font-mono font-bold text-slate-900 bg-white border-amber-300 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* QUICK SALARY BUTTONS */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Presets:</span>
                {[300000, 600000, 900000, 1200000, 1500000, 2000000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={exampleSalaryAnnual === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExampleSalaryAnnual(preset)}
                    className={`text-[11px] h-6 px-2.5 font-mono ${
                      exampleSalaryAnnual === preset
                        ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                        : "bg-white text-slate-700 hover:bg-amber-100/50"
                    }`}
                  >
                    ${preset / 1000}k
                  </Button>
                ))}
              </div>
            </div>

            {/* IMPACT SUMMARY METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Annual Taxable Income</p>
                <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                  ${taxableIncome.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Exempts ${rules.standardDeductionAnnual.toLocaleString()} Std Dec
                </p>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-lg">
                <p className="text-[10px] font-semibold text-amber-800 uppercase">Annual Income Tax</p>
                <p className="text-base font-extrabold text-amber-700 font-mono mt-0.5">
                  ${calculationResult.annualTax.toLocaleString()}
                </p>
                <p className="text-[10px] text-amber-600 mt-1">
                  ${calculationResult.tdsMonthly.toLocaleString()}/month TDS
                </p>
              </div>

              <div className="bg-blue-50/50 border border-blue-200 p-3 rounded-lg">
                <p className="text-[10px] font-semibold text-blue-800 uppercase">Effective Tax Rate</p>
                <p className="text-base font-extrabold text-blue-700 font-mono mt-0.5">
                  {exampleSalaryAnnual > 0
                    ? ((calculationResult.annualTax / exampleSalaryAnnual) * 100).toFixed(2)
                    : 0}
                  %
                </p>
                <p className="text-[10px] text-blue-600 mt-1">Overall Gross Burden</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-lg">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase">Monthly Take-Home</p>
                <p className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">
                  ${calculationResult.netPayable.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-600 mt-1">After all statutory deductions</p>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* CHART 1: SLAB TAX CONTRIBUTIONS */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChartIcon className="h-4 w-4 text-amber-600" /> Tax Liability by Slab
                  </h5>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">
                    ${calculationResult.annualTax.toLocaleString()} Total Tax
                  </Badge>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={slabBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="slabIndex"
                        tick={{ fontSize: 11, fill: "#475569" }}
                        tickFormatter={(val) => `Slab ${val}`}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded shadow-xl text-xs space-y-1 border border-slate-700 font-sans">
                                <p className="font-bold text-amber-300">
                                  Slab {data.slabIndex}: {data.ratePercent}%
                                </p>
                                <p className="text-slate-300 text-[11px]">
                                  Range: ${data.min.toLocaleString()} - {data.max ? `$${data.max.toLocaleString()}` : "Above"}
                                </p>
                                <p className="text-slate-300 text-[11px]">
                                  Taxable in Slab: <span className="font-mono font-bold text-emerald-400">${data.slabTaxable.toLocaleString()}</span>
                                </p>
                                <p className="text-slate-300 text-[11px]">
                                  Tax Generated: <span className="font-mono font-bold text-amber-300">${data.slabTax.toLocaleString()}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="slabTax" radius={[6, 6, 0, 0]} name="Tax ($)">
                        {slabBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART 2: MONTHLY SALARY COMPOSITION */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PieChartIcon className="h-4 w-4 text-emerald-600" /> Monthly Gross Allocation
                  </h5>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">
                    ${monthlyGross.toLocaleString()}/mo Gross
                  </Badge>
                </div>

                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        {
                          name: "Gross Breakdown",
                          Net: Math.round(monthlyNet),
                          TDS: Math.round(monthlyTax),
                          PF: Math.round(monthlyPf),
                          ESI: Math.round(monthlyEsi),
                        },
                      ]}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={(val) => `$${val}`} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs space-y-1.5">
                                <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                                  Monthly Paycheck Breakdown
                                </p>
                                {payload.map((item: any) => (
                                  <div key={item.name} className="flex justify-between gap-4">
                                    <span style={{ color: item.color }}>{item.name}:</span>
                                    <span className="font-mono font-bold">${item.value.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                      <Bar dataKey="Net" stackId="a" fill="#10b981" name="Take-Home" radius={[4, 0, 0, 4]} />
                      <Bar dataKey="TDS" stackId="a" fill="#f59e0b" name="Income Tax" />
                      <Bar dataKey="PF" stackId="a" fill="#3b82f6" name="PF" />
                      <Bar dataKey="ESI" stackId="a" fill="#8b5cf6" name="ESI" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DETAILED SLAB-BY-SLAB BREAKDOWN TABLE FOR EXAMPLE SALARY */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                <h5 className="text-xs font-bold text-slate-800">Slab-by-Slab Tax Calculation Summary</h5>
                <span className="text-[11px] text-slate-500 font-mono">
                  Salary: ${exampleSalaryAnnual.toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {slabBreakdown.map((item) => (
                  <div key={item.slabIndex} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="font-semibold text-slate-800">
                          Slab {item.slabIndex}: {item.ratePercent}% Bracket
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatCurrency(item.min)} - {item.max ? formatCurrency(item.max) : "Above"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-800">
                        ${item.slabTax.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {item.slabTaxable > 0 ? `$${item.slabTaxable.toLocaleString()} taxable` : "Not reached"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SLAB RATES CHART */}
        {viewMode === "slabs" && (
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold text-slate-700">Marginal Tax Rate per Income Range (%)</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {slabs.length} Configured Slabs
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slabChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#475569" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#475569" }}
                    unit="%"
                    domain={[0, (dataMax: number) => Math.max(dataMax + 5, 25)]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
                            <p className="font-bold border-b border-slate-700 pb-1 text-amber-300">
                              Bracket: {data.name}
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Marginal Tax Rate:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.ratePercent}%</span>
                            </p>
                            {data.maxIncome !== null && (
                              <p className="flex justify-between gap-4">
                                <span className="text-slate-400">Max Tax in Bracket:</span>
                                <span className="font-mono font-bold">${data.maxTaxInBracket.toLocaleString()}</span>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="ratePercent" radius={[6, 6, 0, 0]} name="Tax Rate %">
                    {slabChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
              {slabs.map((slab, i) => (
                <div
                  key={slab.id}
                  className="bg-slate-50 border border-slate-200 p-2 rounded text-center space-y-0.5"
                >
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Slab {i + 1}
                  </p>
                  <p className="text-xs font-bold text-slate-800 font-mono">{slab.ratePercent}%</p>
                  <p className="text-[10px] text-slate-600 truncate">
                    {formatCurrency(slab.minIncome)} - {slab.maxIncome ? formatCurrency(slab.maxIncome) : "Above"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: INCOME RANGE PROGRESSION */}
        {viewMode === "incomeProgression" && (
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold text-slate-700">Annual Tax Burden vs Income ($)</span>
              <span className="text-[11px] text-slate-500">Includes Standard Deduction (${rules.standardDeductionAnnual.toLocaleString()})</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeProgressionData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="incomeLabel" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold text-amber-300 border-b border-slate-700 pb-1">
                              Annual Income: ${data.annualGross.toLocaleString()}
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Total Annual Tax:</span>
                              <span className="font-mono font-bold text-rose-400">${data.annualTax.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Monthly TDS Withholding:</span>
                              <span className="font-mono font-bold text-amber-300">${data.monthlyTax.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Effective Tax Rate:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.effectiveRate}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="annualTax" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Annual Tax ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
