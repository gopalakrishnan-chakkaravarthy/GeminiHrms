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
import { Textarea } from "@/components/ui/textarea";
import {
  createLeaveTypeAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useActionState, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Leave Type
    </Button>
  );
}

function CreateLeaveTypeForm({ onClose }: { onClose: () => void }) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(createLeaveTypeAction, initialState);
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
            placeholder="e.g. Vacation"
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
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}

export function CreateLeaveTypeDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Leave Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Leave Type</DialogTitle>
          <DialogDescription>
            Define a new type of leave available to employees.
          </DialogDescription>
        </DialogHeader>
        <CreateLeaveTypeForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
