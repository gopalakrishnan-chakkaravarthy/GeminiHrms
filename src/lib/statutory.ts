export type TaxSlab = {
  id: string;
  minIncome: number;
  maxIncome: number | null; // null for above
  ratePercent: number;
};

export type StatutoryRules = {
  // Provident Fund (PF)
  pfEnabled: boolean;
  employeePfRate: number; // e.g. 12%
  employerPfRate: number; // e.g. 12%
  pfBasicWageCap: number; // e.g. 15000
  calculateOnFullBasic: boolean; // if false, capped at pfBasicWageCap

  // Employee State Insurance / ESU (ESI/ESU)
  esiEnabled: boolean;
  employeeEsiRate: number; // e.g. 0.75%
  employerEsiRate: number; // e.g. 3.25%
  esiGrossThreshold: number; // e.g. 2100 per month (or 21000)

  // Tax Deducted at Source (TDS)
  tdsEnabled: boolean;
  tdsMode: "SLAB" | "FLAT";
  flatTdsRate: number; // e.g. 10%
  standardDeductionAnnual: number; // e.g. 50000
  taxSlabs: TaxSlab[];
};

export const DEFAULT_STATUTORY_RULES: StatutoryRules = {
  pfEnabled: true,
  employeePfRate: 12.0,
  employerPfRate: 12.0,
  pfBasicWageCap: 15000,
  calculateOnFullBasic: true,

  esiEnabled: true,
  employeeEsiRate: 0.75,
  employerEsiRate: 3.25,
  esiGrossThreshold: 21000,

  tdsEnabled: true,
  tdsMode: "SLAB",
  flatTdsRate: 10.0,
  standardDeductionAnnual: 50000,
  taxSlabs: [
    { id: "slab-1", minIncome: 0, maxIncome: 300000, ratePercent: 0 },
    { id: "slab-2", minIncome: 300000, maxIncome: 600000, ratePercent: 5 },
    { id: "slab-3", minIncome: 600000, maxIncome: 900000, ratePercent: 10 },
    { id: "slab-4", minIncome: 900000, maxIncome: 1200000, ratePercent: 15 },
    { id: "slab-5", minIncome: 1200000, maxIncome: null, ratePercent: 20 },
  ],
};

export type StatutoryCalculationResult = {
  basicSalary: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tdsMonthly: number;
  annualTaxableIncome: number;
  annualTax: number;
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  netPayable: number;
};

export function calculateStatutoryBreakdown(
  basicSalary: number,
  grossSalary: number,
  rules: StatutoryRules = DEFAULT_STATUTORY_RULES
): StatutoryCalculationResult {
  let pfEmployee = 0;
  let pfEmployer = 0;

  // 1. PF Calculation (Default: 12% of Basic)
  if (rules.pfEnabled && basicSalary > 0) {
    const pfBase = rules.calculateOnFullBasic
      ? basicSalary
      : Math.min(basicSalary, rules.pfBasicWageCap);
    pfEmployee = Math.round((pfBase * (rules.employeePfRate / 100)) * 100) / 100;
    pfEmployer = Math.round((pfBase * (rules.employerPfRate / 100)) * 100) / 100;
  }

  // 2. ESI / ESU Calculation (Default: 0.75% of Gross if Gross <= threshold)
  let esiEmployee = 0;
  let esiEmployer = 0;
  if (rules.esiEnabled && grossSalary > 0) {
    if (rules.esiGrossThreshold === 0 || grossSalary <= rules.esiGrossThreshold) {
      esiEmployee = Math.round((grossSalary * (rules.employeeEsiRate / 100)) * 100) / 100;
      esiEmployer = Math.round((grossSalary * (rules.employerEsiRate / 100)) * 100) / 100;
    }
  }

  // 3. TDS Calculation
  let annualTax = 0;
  let tdsMonthly = 0;
  let annualTaxableIncome = 0;

  if (rules.tdsEnabled && grossSalary > 0) {
    if (rules.tdsMode === "FLAT") {
      tdsMonthly = Math.round((grossSalary * (rules.flatTdsRate / 100)) * 100) / 100;
      annualTaxableIncome = grossSalary * 12;
      annualTax = tdsMonthly * 12;
    } else {
      // Annualized calculation
      const annualGross = grossSalary * 12;
      // Taxable income after annual PF deduction and standard deduction
      const annualPf = pfEmployee * 12;
      annualTaxableIncome = Math.max(0, annualGross - annualPf - rules.standardDeductionAnnual);

      let remainingTaxable = annualTaxableIncome;
      for (const slab of rules.taxSlabs) {
        if (remainingTaxable <= 0) break;

        const min = slab.minIncome;
        const max = slab.maxIncome;

        let slabTaxable = 0;
        if (max === null) {
          if (annualTaxableIncome > min) {
            slabTaxable = annualTaxableIncome - min;
          }
        } else {
          if (annualTaxableIncome > min) {
            slabTaxable = Math.min(annualTaxableIncome, max) - min;
          }
        }

        if (slabTaxable > 0) {
          annualTax += slabTaxable * (slab.ratePercent / 100);
        }
      }

      annualTax = Math.round(annualTax * 100) / 100;
      tdsMonthly = Math.round((annualTax / 12) * 100) / 100;
    }
  }

  const totalEmployeeDeductions = Math.round((pfEmployee + esiEmployee + tdsMonthly) * 100) / 100;
  const totalEmployerContributions = Math.round((pfEmployer + esiEmployer) * 100) / 100;
  const netPayable = Math.round((grossSalary - totalEmployeeDeductions) * 100) / 100;

  return {
    basicSalary,
    grossSalary,
    pfEmployee,
    pfEmployer,
    esiEmployee,
    esiEmployer,
    tdsMonthly,
    annualTaxableIncome,
    annualTax,
    totalEmployeeDeductions,
    totalEmployerContributions,
    netPayable,
  };
}
