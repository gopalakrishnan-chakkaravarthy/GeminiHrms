"use client";

import { useState } from "react";
import type { Employee, PayrollComponent } from "@/lib/data";
import { AssignPayrollComponentDialog } from "./employee-payroll-settings-table";

type AssignPayrollComponentTriggerProps = {
  employees: Employee[];
  components: PayrollComponent[];
};

export function AssignPayrollComponentTrigger({
  employees,
  components,
}: AssignPayrollComponentTriggerProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  return (
    <AssignPayrollComponentDialog
      employees={employees}
      components={components}
      open={isAssignOpen}
      onOpenChange={setIsAssignOpen}
      initialData={null}
      resetSelection={() => {}} // This is a no-op for the create case
    />
  );
}
