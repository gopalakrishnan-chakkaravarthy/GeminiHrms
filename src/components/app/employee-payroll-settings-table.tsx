"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  PlusCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type {
  PopulatedEmployeePayrollSetting,
  Employee,
  PayrollComponent,
} from "@/lib/data";
import {
  assignEmployeePayrollSettingAction,
  deleteEmployeePayrollSettingAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

type EmployeePayrollSettingsTableProps = {
  settings: PopulatedEmployeePayrollSetting[];
  employees: Employee[];
  components: PayrollComponent[];
};

export function EmployeePayrollSettingsTable({
  settings,
  employees,
  components,
}: EmployeePayrollSettingsTableProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] =
    useState<PopulatedEmployeePayrollSetting | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const getBadgeClass = (type: "Earning" | "Deduction") => {
    return type === "Earning"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  };

  const handleEdit = (setting: PopulatedEmployeePayrollSetting) => {
    setSelectedSetting(setting);
    setIsAssignOpen(true);
  };

  const handleDelete = (setting: PopulatedEmployeePayrollSetting) => {
    setSelectedSetting(setting);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSetting) return;

    startTransition(async () => {
      const result = await deleteEmployeePayrollSettingAction(
        selectedSetting.id
      );
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setIsDeleteOpen(false);
      setSelectedSetting(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Component</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.map((setting) => (
            <TableRow key={setting.id}>
              <TableCell className="font-medium">
                {setting.employeeName}
              </TableCell>
              <TableCell>{setting.componentName}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getBadgeClass(setting.componentType)}
                >
                  {setting.componentType}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                ${setting.value.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(setting)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(setting)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AssignPayrollComponentDialog
        employees={employees}
        components={components}
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        initialData={selectedSetting}
        resetSelection={() => setSelectedSetting(null)}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently remove this setting from the employee."
        isPending={false}
      />
    </>
  );
}

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditMode ? "Save Changes" : "Assign Component"}
    </Button>
  );
}

function AssignPayrollComponentForm({
  employees,
  components,
  onClose,
  initialData,
}: {
  employees: Employee[];
  components: PayrollComponent[];
  onClose: () => void;
  initialData: PopulatedEmployeePayrollSetting | null;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    assignEmployeePayrollSettingAction,
    initialState
  );
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      onClose();
    } else if (state.message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast, onClose]);

  const employee = employees.find((e) => e.name === initialData?.employeeName);
  const component = components.find(
    (c) => c.name === initialData?.componentName
  );

  return (
    <form action={dispatch}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="employeeId" className="text-right">
            Employee
          </Label>
          <Select
            name="employeeId"
            defaultValue={employee?.id}
            disabled={!!initialData}
          >
            <SelectTrigger id="employeeId" className="col-span-3">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.employeeId && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.employeeId[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="componentId" className="text-right">
            Component
          </Label>
          <Select
            name="componentId"
            defaultValue={component?.id}
            disabled={!!initialData}
          >
            <SelectTrigger id="componentId" className="col-span-3">
              <SelectValue placeholder="Select a component" />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.componentId && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.componentId[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="value" className="text-right">
            Value ($)
          </Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            placeholder="e.g. 5000.00"
            defaultValue={initialData?.value}
            className="col-span-3"
          />
          {state.errors?.value && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.value[0]}
            </p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <SubmitButton isEditMode={!!initialData} />
      </DialogFooter>
    </form>
  );
}

export function AssignPayrollComponentDialog({
  employees,
  components,
  open,
  onOpenChange,
  initialData,
  resetSelection,
}: {
  employees: Employee[];
  components: PayrollComponent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: PopulatedEmployeePayrollSetting | null;
  resetSelection: () => void;
}) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetSelection();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Assign Component
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Assign"} Payroll Component
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the value for this component."
              : "Assign a payroll component and its value to a specific employee."}
          </DialogDescription>
        </DialogHeader>
        <AssignPayrollComponentForm
          employees={employees}
          components={components}
          onClose={() => handleOpenChange(false)}
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}
