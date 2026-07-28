"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { type Role, type Department, type Employee } from "@/lib/data";
import { PlusCircle, Loader2 } from "lucide-react";
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
import {
  createEmployeeAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useActionState, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Employee
    </Button>
  );
}

function CreateEmployeeForm({
  roles,
  departments,
  employees,
  onClose,
}: {
  roles: Role[];
  departments: Department[];
  employees: Employee[];
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(createEmployeeAction, initialState);
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

  return (
    <form action={dispatch}>
      <ScrollArea className="h-96">
        <div className="grid gap-4 py-4 px-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right">
              Clerk User ID
            </Label>
            <Input
              id="id"
              name="id"
              placeholder="user_..."
              className="col-span-3"
            />
            {state.errors?.id && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.id[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Jane Doe"
              className="col-span-3"
            />
            {state.errors?.name && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.name[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. jane.doe@example.com"
              className="col-span-3"
            />
            {state.errors?.email && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeId" className="text-right">
              Employee ID
            </Label>
            <Input
              id="employeeId"
              name="employeeId"
              placeholder="e.g. EMP12345"
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
            <Select name="roleId">
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
            <Select name="departmentId">
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
            <Select name="managerId">
              <SelectTrigger id="managerId" className="col-span-3">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Manager</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
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
              placeholder="e.g. +1234567890"
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
              placeholder="e.g. +0987654321"
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
              placeholder="e.g. O+"
              className="col-span-3"
            />
            {state.errors?.bloodGroup && (
              <p className="col-span-4 text-red-500 text-xs text-right">
                {state.errors.bloodGroup[0]}
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

export function CreateEmployeeDialog({
  roles,
  departments,
  employees,
}: {
  roles: Role[];
  departments: Department[];
  employees: Employee[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to the system. The Clerk User ID must match their
            authentication ID.
          </DialogDescription>
        </DialogHeader>
        <CreateEmployeeForm
          roles={roles}
          departments={departments}
          employees={employees}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
