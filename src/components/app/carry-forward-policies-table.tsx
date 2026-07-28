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
import type { PopulatedCarryForwardPolicy, LeaveType } from "@/lib/data";
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
  updateCarryForwardPolicyAction,
  deleteCarryForwardPolicyAction,
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

function EditCarryForwardPolicyForm({
  policy,
  leaveTypes,
  onClose,
}: {
  policy: PopulatedCarryForwardPolicy;
  leaveTypes: LeaveType[];
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    updateCarryForwardPolicyAction,
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

  return (
    <form action={dispatch}>
      <input type="hidden" name="id" value={policy.id} />
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="leaveTypeId" className="text-right">
            Leave Type
          </Label>
          <Select
            name="leaveTypeId"
            defaultValue={
              leaveTypes.find((lt) => lt.name === policy.leaveTypeName)?.id
            }
          >
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
          <Label htmlFor="maxDays" className="text-right">
            Max Days
          </Label>
          <Input
            id="maxDays"
            name="maxDays"
            type="number"
            defaultValue={policy.maxDays}
            className="col-span-3"
          />
          {state.errors?.maxDays && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.maxDays[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="expiryMonths" className="text-right">
            Expires (Months)
          </Label>
          <Input
            id="expiryMonths"
            name="expiryMonths"
            type="number"
            defaultValue={policy.expiryMonths}
            className="col-span-3"
          />
          {state.errors?.expiryMonths && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.expiryMonths[0]}
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

function EditCarryForwardPolicyDialog({
  policy,
  leaveTypes,
  open,
  onOpenChange,
}: {
  policy: PopulatedCarryForwardPolicy | null;
  leaveTypes: LeaveType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Carry-Forward Policy</DialogTitle>
          <DialogDescription>
            Update the details for this carry-forward policy.
          </DialogDescription>
        </DialogHeader>
        <EditCarryForwardPolicyForm
          policy={policy}
          leaveTypes={leaveTypes}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Main Table Component
type CarryForwardPoliciesTableProps = {
  policies: PopulatedCarryForwardPolicy[];
  leaveTypes: LeaveType[];
};

export function CarryForwardPoliciesTable({
  policies,
  leaveTypes,
}: CarryForwardPoliciesTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] =
    useState<PopulatedCarryForwardPolicy | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEdit = (policy: PopulatedCarryForwardPolicy) => {
    setSelectedPolicy(policy);
    setIsEditOpen(true);
  };

  const handleDelete = (policy: PopulatedCarryForwardPolicy) => {
    setSelectedPolicy(policy);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPolicy) return;

    startTransition(async () => {
      const result = await deleteCarryForwardPolicyAction(selectedPolicy.id);
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
            <TableHead>Leave Type</TableHead>
            <TableHead className="text-center">
              Max Days to Carry Forward
            </TableHead>
            <TableHead className="text-center">
              Expires After (Months)
            </TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id}>
              <TableCell className="font-medium">
                {policy.leaveTypeName}
              </TableCell>
              <TableCell className="text-center">{policy.maxDays}</TableCell>
              <TableCell className="text-center">
                {policy.expiryMonths}
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
                    <DropdownMenuItem onClick={() => handleEdit(policy)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(policy)}
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
      <EditCarryForwardPolicyDialog
        policy={selectedPolicy}
        leaveTypes={leaveTypes}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the carry-forward policy."
        isPending={false}
      />
    </>
  );
}
