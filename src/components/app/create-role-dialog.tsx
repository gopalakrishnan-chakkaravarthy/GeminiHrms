"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
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
  createRoleAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useActionState, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Role
    </Button>
  );
}

function CreateRoleForm({ onClose }: { onClose: () => void }) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(createRoleAction, initialState);
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
            placeholder="e.g. Software Engineer"
            className="col-span-3"
          />
        </div>
        {state.errors?.name && (
          <p className="col-span-4 text-red-500 text-xs text-right">
            {state.errors.name[0]}
          </p>
        )}
      </div>
      <DialogFooter>
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Add a new role to the system. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <CreateRoleForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
