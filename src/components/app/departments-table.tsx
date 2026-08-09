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
import type { Department } from "@/lib/data";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
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

function EditDepartmentForm({
  department,
  onClose,
}: {
  department: Department;
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    updateDepartmentAction,
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
      <input type="hidden" name="id" value={department.id} />
      <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={department.name}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="signInTime" className="text-right">
            Sign-In Time
          </Label>
          <Input
            id="signInTime"
            name="signInTime"
            type="time"
            defaultValue={department.signInTime || "09:00"}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="graceTimeMinutes" className="text-right">
            Grace (Mins)
          </Label>
          <Input
            id="graceTimeMinutes"
            name="graceTimeMinutes"
            type="number"
            defaultValue={department.graceTimeMinutes ?? 15}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="businessAddress" className="text-right">
            Address
          </Label>
          <Input
            id="businessAddress"
            name="businessAddress"
            defaultValue={department.businessAddress || "100 Tech Park Way, San Francisco, CA"}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="businessLatitude" className="text-right">
            Latitude
          </Label>
          <Input
            id="businessLatitude"
            name="businessLatitude"
            type="number"
            step="any"
            defaultValue={department.businessLatitude ?? 37.7749}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="businessLongitude" className="text-right">
            Longitude
          </Label>
          <Input
            id="businessLongitude"
            name="businessLongitude"
            type="number"
            step="any"
            defaultValue={department.businessLongitude ?? -122.4194}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="allowedRadiusMeters" className="text-right">
            Radius (Meters)
          </Label>
          <Input
            id="allowedRadiusMeters"
            name="allowedRadiusMeters"
            type="number"
            defaultValue={department.allowedRadiusMeters ?? 500}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="ghost" onClick={onClose} type="button">
          Cancel
        </Button>
        <EditSubmitButton />
      </DialogFooter>
    </form>
  );
}

function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
}: {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!department) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Make changes to the department name. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <EditDepartmentForm
          department={department}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// --- Table Component ---
type DepartmentsTableProps = {
  departments: Department[];
};

export function DepartmentsTable({ departments }: DepartmentsTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEditClick = (department: Department) => {
    setSelectedDept(department);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (department: Department) => {
    setSelectedDept(department);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDept) return;
    startTransition(async () => {
      const result = await deleteDepartmentAction(selectedDept.id);
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
      setSelectedDept(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department Name</TableHead>
            <TableHead>Sign-In Time</TableHead>
            <TableHead>Grace Period</TableHead>
            <TableHead>Office Address</TableHead>
            <TableHead>Radius</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">{dept.name}</TableCell>
              <TableCell className="font-mono text-sm">{dept.signInTime || "09:00"}</TableCell>
              <TableCell>{dept.graceTimeMinutes ?? 15} mins</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs" title={dept.businessAddress}>
                {dept.businessAddress || "100 Tech Park Way, San Francisco, CA"}
              </TableCell>
              <TableCell className="text-xs font-semibold">{dept.allowedRadiusMeters ?? 500}m</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(dept)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDeleteClick(dept)}
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
      <EditDepartmentDialog
        department={selectedDept}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the department."
        isPending={isPending}
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
      Save Department
    </Button>
  );
}

function CreateDepartmentForm({ onClose }: { onClose: () => void }) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    createDepartmentAction,
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
      <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-name" className="text-right">
            Name
          </Label>
          <Input
            id="create-name"
            name="name"
            placeholder="e.g. Engineering"
            className="col-span-3"
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-signInTime" className="text-right">
            Sign-In Time
          </Label>
          <Input
            id="create-signInTime"
            name="signInTime"
            type="time"
            defaultValue="09:00"
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-graceTimeMinutes" className="text-right">
            Grace (Mins)
          </Label>
          <Input
            id="create-graceTimeMinutes"
            name="graceTimeMinutes"
            type="number"
            defaultValue={15}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-businessAddress" className="text-right">
            Address
          </Label>
          <Input
            id="create-businessAddress"
            name="businessAddress"
            defaultValue="100 Tech Park Way, San Francisco, CA 94105"
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-businessLatitude" className="text-right">
            Latitude
          </Label>
          <Input
            id="create-businessLatitude"
            name="businessLatitude"
            type="number"
            step="any"
            defaultValue={37.7749}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-businessLongitude" className="text-right">
            Longitude
          </Label>
          <Input
            id="create-businessLongitude"
            name="businessLongitude"
            type="number"
            step="any"
            defaultValue={-122.4194}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="create-allowedRadiusMeters" className="text-right">
            Radius (Meters)
          </Label>
          <Input
            id="create-allowedRadiusMeters"
            name="allowedRadiusMeters"
            type="number"
            defaultValue={500}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter className="mt-4">
        <CreateSubmitButton />
      </DialogFooter>
    </form>
  );
}

export function CreateDepartmentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Department
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>
            Add a new department to the system.
          </DialogDescription>
        </DialogHeader>
        <CreateDepartmentForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
