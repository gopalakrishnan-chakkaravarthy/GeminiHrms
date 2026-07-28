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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PayrollComponent } from "@/lib/data";
import {
  createPayrollComponentAction,
  updatePayrollComponentAction,
  deletePayrollComponentAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

// --- Edit Dialog ---
function EditSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  );
}

function EditPayrollComponentForm({
  component,
  onClose,
}: {
  component: PayrollComponent;
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    updatePayrollComponentAction,
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
      <input type="hidden" name="id" value={component.id} />
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={component.name}
            className="col-span-3"
          />
          {state.errors?.name && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.name[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Type</Label>
          <RadioGroup
            defaultValue={component.type}
            name="type"
            className="col-span-3 flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Earning" id="r-edit-earning" />
              <Label htmlFor="r-edit-earning">Earning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Deduction" id="r-edit-deduction" />
              <Label htmlFor="r-edit-deduction">Deduction</Label>
            </div>
          </RadioGroup>
          {state.errors?.type && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.type[0]}
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
            defaultValue={component.description}
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
        <EditSubmitButton />
      </DialogFooter>
    </form>
  );
}

function EditPayrollComponentDialog({
  component,
  open,
  onOpenChange,
}: {
  component: PayrollComponent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!component) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Payroll Component</DialogTitle>
          <DialogDescription>
            Update the details of this payroll component.
          </DialogDescription>
        </DialogHeader>
        <EditPayrollComponentForm
          component={component}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// --- Table Component ---
type PayrollComponentsTableProps = {
  components: PayrollComponent[];
};

export function PayrollComponentsTable({
  components,
}: PayrollComponentsTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] =
    useState<PayrollComponent | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEdit = (component: PayrollComponent) => {
    setSelectedComponent(component);
    setIsEditOpen(true);
  };

  const handleDelete = (component: PayrollComponent) => {
    setSelectedComponent(component);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedComponent) return;
    startTransition(async () => {
      const result = await deletePayrollComponentAction(selectedComponent.id);
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
      setSelectedComponent(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.map((component) => (
            <TableRow key={component.id}>
              <TableCell className="font-medium">{component.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {component.description}
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
                    <DropdownMenuItem onClick={() => handleEdit(component)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(component)}
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
      <EditPayrollComponentDialog
        component={selectedComponent}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the payroll component."
        isPending={false}
      />
    </>
  );
}

// --- Create Dialog ---
function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Component
    </Button>
  );
}

function CreatePayrollComponentForm({ onClose }: { onClose: () => void }) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    createPayrollComponentAction,
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
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g. Basic Salary"
            className="col-span-3"
          />
          {state.errors?.name && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.name[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Type</Label>
          <RadioGroup
            defaultValue="Earning"
            name="type"
            className="col-span-3 flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Earning" id="r-earning" />
              <Label htmlFor="r-earning">Earning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Deduction" id="r-deduction" />
              <Label htmlFor="r-deduction">Deduction</Label>
            </div>
          </RadioGroup>
          {state.errors?.type && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.type[0]}
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
            placeholder="Type a description..."
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
        <CreateSubmitButton />
      </DialogFooter>
    </form>
  );
}

export function CreatePayrollComponentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Component
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Payroll Component</DialogTitle>
          <DialogDescription>
            Define a new earning or deduction for your payroll system.
          </DialogDescription>
        </DialogHeader>
        <CreatePayrollComponentForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
