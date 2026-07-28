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
  Loader2,
  PlusCircle,
} from "lucide-react";
import type {
  PopulatedScreenPermission,
  RouteInfo,
  Employee,
  Department,
  Role,
} from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  updateScreenPermissionAction,
  deleteScreenPermissionAction,
  createScreenPermissionAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { cn } from "@/lib/utils";

type CommonDialogProps = {
  routes: RouteInfo[];
  employees: Employee[];
  departments: Department[];
  roles: Role[];
};

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

function EditPermissionForm({
  permission,
  onClose,
  ...props
}: {
  permission: PopulatedScreenPermission;
  onClose: () => void;
} & CommonDialogProps) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    updateScreenPermissionAction,
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
      <input type="hidden" name="id" value={permission.id} />
      <input type="hidden" name="route" value={permission.route} />
      <input
        type="hidden"
        name="permissionType"
        value={permission.permissionType}
      />
      <input type="hidden" name="targetId" value={permission.targetId} />
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Route</Label>
          <p className="col-span-3 font-mono text-sm">{permission.route}</p>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Target</Label>
          <p className="col-span-3 text-sm">
            <span className="font-semibold capitalize">
              {permission.permissionType}:
            </span>{" "}
            {permission.targetName}
          </p>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isDefault" className="text-right">
            Set as Default
          </Label>
          <Switch
            id="isDefault"
            name="isDefault"
            defaultChecked={permission.isDefault}
          />
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

function EditPermissionDialog({
  permission,
  open,
  onOpenChange,
  ...props
}: {
  permission: PopulatedScreenPermission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & CommonDialogProps) {
  if (!permission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Permission</DialogTitle>
          <DialogDescription>
            Update the settings for this screen permission.
          </DialogDescription>
        </DialogHeader>
        <EditPermissionForm
          permission={permission}
          onClose={() => onOpenChange(false)}
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
}

// --- Main Table Component ---
type PermissionsTableProps = {
  permissions: PopulatedScreenPermission[];
} & CommonDialogProps;

export function PermissionsTable({
  permissions,
  ...props
}: PermissionsTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<PopulatedScreenPermission | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEdit = (permission: PopulatedScreenPermission) => {
    setSelectedPermission(permission);
    setIsEditOpen(true);
  };

  const handleDelete = (permission: PopulatedScreenPermission) => {
    setSelectedPermission(permission);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPermission) return;

    startTransition(async () => {
      const result = await deleteScreenPermissionAction(selectedPermission.id);
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
      setSelectedPermission(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target Type</TableHead>
            <TableHead>Target Name</TableHead>
            <TableHead>Route</TableHead>
            <TableHead className="text-center">Is Default</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium capitalize">
                {p.permissionType}
              </TableCell>
              <TableCell>{p.targetName}</TableCell>
              <TableCell className="font-mono">{p.route}</TableCell>
              <TableCell className="text-center">
                {p.isDefault ? "Yes" : "No"}
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
                    <DropdownMenuItem onClick={() => handleEdit(p)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(p)}
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
      <EditPermissionDialog
        permission={selectedPermission}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        {...props}
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This action cannot be undone. This will permanently delete the screen permission."
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
      Save Permission
    </Button>
  );
}

function CreatePermissionForm({
  onClose,
  ...props
}: { onClose: () => void } & CommonDialogProps) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    createScreenPermissionAction,
    initialState
  );
  const [permissionType, setPermissionType] = useState<
    "employee" | "department" | "role" | ""
  >("");
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
          <Label htmlFor="route" className="text-right">
            Route
          </Label>
          <Select name="route">
            <SelectTrigger id="route" className="col-span-3">
              <SelectValue placeholder="Select a route" />
            </SelectTrigger>
            <SelectContent>
              {props.routes.map((r) => (
                <SelectItem key={r.path} value={r.path}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.route && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.route[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="permissionType" className="text-right">
            Target Type
          </Label>
          <Select
            name="permissionType"
            onValueChange={(v) => setPermissionType(v as any)}
          >
            <SelectTrigger id="permissionType" className="col-span-3">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="role">Role</SelectItem>
            </SelectContent>
          </Select>
          {state.errors?.permissionType && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.permissionType[0]}
            </p>
          )}
        </div>
        <div
          className={cn(
            "grid grid-cols-4 items-center gap-4",
            !permissionType && "hidden"
          )}
        >
          <Label htmlFor="targetId" className="text-right">
            Target
          </Label>
          <Select name="targetId" disabled={!permissionType}>
            <SelectTrigger id="targetId" className="col-span-3">
              <SelectValue placeholder="Select a target" />
            </SelectTrigger>
            <SelectContent>
              {permissionType === "employee" &&
                props.employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              {permissionType === "department" &&
                props.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              {permissionType === "role" &&
                props.roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {state.errors?.targetId && (
            <p className="col-span-4 text-red-500 text-xs text-right">
              {state.errors.targetId[0]}
            </p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isDefault-create" className="text-right">
            Set as Default
          </Label>
          <Switch id="isDefault-create" name="isDefault" />
        </div>
      </div>
      <DialogFooter>
        <CreateSubmitButton />
      </DialogFooter>
    </form>
  );
}

export function CreatePermissionDialog(props: CommonDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Permission
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Screen Permission</DialogTitle>
          <DialogDescription>
            Define a new screen access rule.
          </DialogDescription>
        </DialogHeader>
        <CreatePermissionForm onClose={() => setOpen(false)} {...props} />
      </DialogContent>
    </Dialog>
  );
}
