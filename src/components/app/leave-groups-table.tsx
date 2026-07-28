"use client";

import { useState, useTransition, useEffect, useActionState } from "react";
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
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import type { PopulatedLeaveGroup, Role, LeaveType } from "@/lib/data";
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
  updateLeavePolicyAction,
  deleteLeavePolicyAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

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

function EditLeaveGroupForm({
  policy,
  roles,
  leaveTypes,
  onClose,
}: {
  policy: PopulatedLeaveGroup;
  roles: Role[];
  leaveTypes: LeaveType[];
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    updateLeavePolicyAction,
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

  const currentRole = roles.find((r) => r.name === policy.roleName);
  const currentLeaveType = leaveTypes.find(
    (lt) => lt.name === policy.leaveTypeName
  );

  return (
    <form action={dispatch}>
      <input type="hidden" name="id" value={policy.id} />
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="roleId" className="text-right">
            Role
          </Label>
          <Select name="roleId" defaultValue={currentRole?.id}>
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
          <Label htmlFor="leaveTypeId" className="text-right">
            Leave Type
          </Label>
          <Select name="leaveTypeId" defaultValue={currentLeaveType?.id}>
            <SelectTrigger id="leaveTypeId" className="col-span-3">
              <SelectValue placeholder="Select a leave type" />
            </SelectTrigger>
            <SelectContent>
              {leaveTypes.map((lt) => (
                <SelectItem key={lt.id} value={lt.id}>
                  {lt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.leaveTypeId && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.leaveTypeId[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="daysAllowed" className="text-right">
            Days Allowed
          </Label>
          <Input
            id="daysAllowed"
            name="daysAllowed"
            type="number"
            defaultValue={policy.daysAllowed}
            className="col-span-3"
          />
          {state.errors?.daysAllowed && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.daysAllowed[0]}
            </p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}

function EditLeaveGroupDialog({
  policy,
  roles,
  leaveTypes,
  open,
  onOpenChange,
}: {
  policy: PopulatedLeaveGroup | null;
  roles: Role[];
  leaveTypes: LeaveType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Leave Policy</DialogTitle>
          <DialogDescription>
            Update the leave entitlement policy.
          </DialogDescription>
        </DialogHeader>
        <EditLeaveGroupForm
          policy={policy}
          roles={roles}
          leaveTypes={leaveTypes}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Main Table Component
type LeaveGroupsTableProps = {
  leaveGroups: PopulatedLeaveGroup[];
  roles: Role[];
  leaveTypes: LeaveType[];
};

export function LeaveGroupsTable({
  leaveGroups,
  roles,
  leaveTypes,
}: LeaveGroupsTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] =
    useState<PopulatedLeaveGroup | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEdit = (policy: PopulatedLeaveGroup) => {
    setSelectedPolicy(policy);
    setIsEditOpen(true);
  };

  const handleDelete = (policy: PopulatedLeaveGroup) => {
    setSelectedPolicy(policy);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPolicy) return;
    startTransition(async () => {
      const result = await deleteLeavePolicyAction(selectedPolicy.id);
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
      setSelectedPolicy(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead className="text-center">Days Allowed</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveGroups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className="font-medium">{group.roleName}</TableCell>
              <TableCell>{group.leaveTypeName}</TableCell>
              <TableCell className="text-center">{group.daysAllowed}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(group)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(group)}
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
      <EditLeaveGroupDialog
        policy={selectedPolicy}
        roles={roles}
        leaveTypes={leaveTypes}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the leave policy."
        isPending={false}
      />
    </>
  );
}
