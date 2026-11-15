import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Users } from "lucide-react";
import { apiErrorMessage } from "@/lib/format";
import { apiPost } from "@/lib/api";
import type { CircleOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
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

// Shown inside /app pages when the signed-in user has no circle yet.
export default function NoCircle() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const createCircle = useMutation({
    mutationFn: () => apiPost<CircleOut>("/circles", { name: name.trim() || "My Care Circle", timezone: "Asia/Kolkata" }),
    onSuccess: () => {
      toast.success("Your care circle is ready. You are the Elder Owner.");
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      setOpen(false);
      setName("");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8" data-testid="no-circle-onboarding">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Welcome to CareCircle</h1>
        <p className="mt-2 text-muted-foreground">
          A care circle is your private team around one elder — medications, doses, appointments and
          emergency info, shared only with people the elder approves.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <Users className="h-8 w-8 text-primary" aria-hidden />
          <h2 className="mt-3 font-heading text-xl font-semibold">I am the elder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your circle, add your medications, and invite family with a passcode you control.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="mt-4" data-testid="create-circle-open-button" />}>
              Create a circle
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create your care circle</DialogTitle>
                <DialogDescription>
                  Name it after you or your home — e.g. “Ramesh’s Care Circle”.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="circle-name">Circle name</Label>
                <Input
                  id="circle-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Care Circle"
                  data-testid="create-circle-name-input"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createCircle.mutate()}
                  disabled={createCircle.isPending}
                  data-testid="create-circle-submit-button"
                >
                  {createCircle.isPending ? "Creating…" : "Create circle"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <KeyRound className="h-8 w-8 text-primary" aria-hidden />
          <h2 className="mt-3 font-heading text-xl font-semibold">I have a passcode</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Someone shared a circle passcode with you (looks like CARE-8492KQ). Join and wait for the
            elder’s approval.
          </p>
          <Button variant="outline" className="mt-4" render={<Link to="/join" />} data-testid="no-circle-join-link">
            Join with passcode
          </Button>
        </div>
      </div>
    </div>
  );
}
