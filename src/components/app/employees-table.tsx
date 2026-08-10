"use client";

import { useActionState, useState, useEffect, startTransition } from "react";
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
import { MoreHorizontal, Pencil, Loader2, Trash2, KeyRound } from "lucide-react";
import type { Employee, Role, Department } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  deleteEmployeeAction,
  updateEmployeeAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { toast, useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

// Edit Dialog
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  );
}

function EditEmployeeForm({
  employee,
  allEmployees,
  roles,
  departments,
  onClose,
}: {
  employee: Employee;
  allEmployees: Employee[];
  roles: Role[];
  departments: Department[];
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(updateEmployeeAction, initialState);
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

  const potentialManagers = allEmployees.filter((e) => e.id !== employee.id);

  return (
    <form action={dispatch}>
      <input type="hidden" name="id" value={employee.id} />
      <ScrollArea className="h-96">
        <div className="grid gap-4 py-4 px-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeId" className="text-right">
              Employee ID
            </Label>
            <Input
              id="employeeId"
              name="employeeId"
              defaultValue={employee.employeeId ?? ""}
              className="col-span-3"
            />
            {state.errors?.employeeId && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.employeeId[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roleId" className="text-right">
              Role
            </Label>
            <Select name="roleId" defaultValue={employee.roleId}>
              <SelectTrigger id="roleId" className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.roleId && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.roleId[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departmentId" className="text-right">
              Department
            </Label>
            <Select name="departmentId" defaultValue={employee.departmentId}>
              <SelectTrigger id="departmentId" className="col-span-3">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.departmentId && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.departmentId[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="managerId" className="text-right">
              Manager
            </Label>
            <Select
              name="managerId"
              defaultValue={employee.managerId ?? "null"}
            >
              <SelectTrigger id="managerId" className="col-span-3">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Manager</SelectItem>
                {potentialManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.managerId && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.managerId[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              Phone
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              defaultValue={employee.phoneNumber ?? ""}
              className="col-span-3"
            />
            {state.errors?.phoneNumber && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.phoneNumber[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emergencyContactNumber" className="text-right">
              Emergency Contact
            </Label>
            <Input
              id="emergencyContactNumber"
              name="emergencyContactNumber"
              defaultValue={employee.emergencyContactNumber ?? ""}
              className="col-span-3"
            />
            {state.errors?.emergencyContactNumber && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.emergencyContactNumber[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bloodGroup" className="text-right">
              Blood Group
            </Label>
            <Input
              id="bloodGroup"
              name="bloodGroup"
              defaultValue={employee.bloodGroup ?? ""}
              className="col-span-3"
            />
            {state.errors?.bloodGroup && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.bloodGroup[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Leave blank to keep unchanged"
              className="col-span-3"
            />
            {state.errors?.password && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.password[0]}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}

function EditEmployeeDialog({
  employee,
  allEmployees,
  roles,
  departments,
  open,
  onOpenChange,
}: {
  employee: Employee | null;
  allEmployees: Employee[];
  roles: Role[];
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.name}</DialogTitle>
          <DialogDescription>
            Update the employee's role, department, and manager.
          </DialogDescription>
        </DialogHeader>
        <EditEmployeeForm
          employee={employee}
          allEmployees={allEmployees}
          roles={roles}
          departments={departments}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Main Table Component
type EmployeesTableProps = {
  employees: Employee[];
  roles: Role[];
  departments: Department[];
};

export function EmployeesTable({
  employees,
  roles,
  departments,
}: EmployeesTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditOpen(true);
  };

  const handleResetPassword = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsResetPasswordOpen(true);
  };

  const handleDelete = (setting: Employee) => {
    setSelectedEmployee(setting);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;

    startTransition(async () => {
      const result = await deleteEmployeeAction(selectedEmployee.id);
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
      setSelectedEmployee(null);
    });
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "N/A";
    return employees.find((e) => e.id === managerId)?.name || "Unknown";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Blood Group</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={employee.avatarUrl}
                      data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{employee.name}</span>
                </div>
              </TableCell>
              <TableCell>{employee.employeeId ?? "N/A"}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.phoneNumber ?? "N/A"}</TableCell>
              <TableCell>{employee.roleName ?? "N/A"}</TableCell>
              <TableCell>{employee.departmentName ?? "N/A"}</TableCell>
              <TableCell>{getManagerName(employee.managerId)}</TableCell>
              <TableCell>{employee.bloodGroup ?? "N/A"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(employee)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResetPassword(employee)}>
                      <KeyRound className="mr-2 h-4 w-4 text-amber-600" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(employee)}
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
      <EditEmployeeDialog
        employee={selectedEmployee}
        allEmployees={employees}
        roles={roles}
        departments={departments}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <ResetPasswordDialog
        employee={selectedEmployee}
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently remove the employee from the system."
        isPending={false}
      />
    </>
  );
}
