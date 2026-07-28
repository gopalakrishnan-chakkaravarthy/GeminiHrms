"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { type LeaveType } from "@/lib/data";
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
  createCarryForwardPolicyAction,
  type FormState,
} from "@/app/dashboard/admin/actions";
import { useActionState, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Policy
    </Button>
  );
}

function CreateCarryForwardPolicyForm({
  leaveTypes,
  onClose,
}: {
  leaveTypes: LeaveType[];
  onClose: () => void;
}) {
  const initialState: FormState = { message: "", errors: {}, success: false };
  const [state, dispatch] = useActionState(
    createCarryForwardPolicyAction,
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
          <Label htmlFor="leaveTypeId" className="text-right">
            Leave Type
          </Label>
          <Select name="leaveTypeId">
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
            defaultValue="5"
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
            defaultValue="3"
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
        <SubmitButton />
      </DialogFooter>
    </form>
  );
}

export function CreateCarryForwardPolicyDialog({
  leaveTypes,
}: {
  leaveTypes: LeaveType[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Carry-Forward Policy</DialogTitle>
          <DialogDescription>
            Define rules for carrying forward unused leave.
          </DialogDescription>
        </DialogHeader>
        <CreateCarryForwardPolicyForm
          leaveTypes={leaveTypes}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
