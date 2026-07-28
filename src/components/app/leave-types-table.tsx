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
import type { LeaveType } from "@/lib/data";
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
import { Textarea } from "@/components/ui/textarea";
import {
  updateLeaveTypeAction,
  deleteLeaveTypeAction,
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

function EditLeaveTypeForm({
  leaveType,
  onClose,
}: {
  leaveType: LeaveType;
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(updateLeaveTypeAction, initialState);
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
      <input type="hidden" name="id" value={leaveType.id} />
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={leaveType.name}
            className="col-span-3"
          />
          {state.errors?.name && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.name[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={leaveType.description}
            className="col-span-3"
          />
          {state.errors?.description && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.description[0]}
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

function EditLeaveTypeDialog({
  leaveType,
  open,
  onOpenChange,
}: {
  leaveType: LeaveType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!leaveType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Leave Type</DialogTitle>
          <DialogDescription>
            Update the details for this leave type.
          </DialogDescription>
        </DialogHeader>
        <EditLeaveTypeForm
          leaveType={leaveType}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Main Table Component
type LeaveTypesTableProps = {
  leaveTypes: LeaveType[];
};

export function LeaveTypesTable({ leaveTypes }: LeaveTypesTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEdit = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setIsEditOpen(true);
  };

  const handleDelete = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLeaveType) return;
    startTransition(async () => {
      const result = await deleteLeaveTypeAction(selectedLeaveType.id);
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
      setSelectedLeaveType(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Leave Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveTypes.map((leaveType) => (
            <TableRow key={leaveType.id}>
              <TableCell className="font-medium">{leaveType.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {leaveType.description}
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
                    <DropdownMenuItem onClick={() => handleEdit(leaveType)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(leaveType)}
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
      <EditLeaveTypeDialog
        leaveType={selectedLeaveType}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the leave type."
        isPending={false}
      />
    </>
  );
}
