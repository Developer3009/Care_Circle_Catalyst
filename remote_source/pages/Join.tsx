import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hourglass, KeyRound, PartyPopper } from "lucide-react";
import { apiErrorMessage } from "@/lib/format";
import { apiGet, apiPost } from "@/lib/api";
import type { JoinOut, UserOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Passcode entry — works signed-out (redirects to login and comes back) and signed-in.
export default function Join() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [role, setRole] = useState("FAMILY");
  const [result, setResult] = useState<JoinOut | null>(null);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => apiGet<UserOut>("/auth/me"), retry: false, staleTime: 5 * 60 * 1000 });

  const join = useMutation({
    mutationFn: () => apiPost<JoinOut>("/circles/join", { passcode: code.trim().toUpperCase(), requested_role: role }),
    onSuccess: (data) => {
      setResult(data);
      if (data.status === "ACTIVE") navigate("/app");
      else toast.info(`Request sent — ${data.circle_name} will see it in their Consent Center.`);
    },
    onError: (err) => {
      const message = apiErrorMessage(err);
      if (message.includes("Sign in")) {
        sessionStorage.setItem("cc_pending_passcode", code.trim().toUpperCase());
        navigate(`/login?next=${encodeURIComponent(`/join?code=${code.trim().toUpperCase()}`)}`);
        return;
      }
      toast.error(message);
    },
  });

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F8F9FA] p-6" data-testid="join-page">
      <div className="w-full max-w-md space-y-6 rounded-3xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-[#116B70]" aria-hidden />
          <h1 className="font-heading text-2xl font-semibold">Join a care circle</h1>
        </div>

        {result && result.status === "PENDING" ? (
          <div className="space-y-4 text-center" data-testid="join-pending-card">
            <Hourglass className="mx-auto h-10 w-10 text-[#B45309]" aria-hidden />
            <p className="font-heading text-xl font-semibold">Waiting for {result.circle_name}</p>
            <p className="text-sm text-muted-foreground">
              The elder has been notified and will approve your membership in their Consent Center. You’ll
              see the circle here the moment you’re approved.
            </p>
            <Button variant="outline" render={<Link to="/app" />} data-testid="join-pending-home-button">
              Back to my home
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              join.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="join-passcode">Circle passcode</Label>
              <Input
                id="join-passcode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CARE-8492KQ"
                autoFocus
                required
                minLength={4}
                className="font-mono text-lg tracking-widest"
                data-testid="join-passcode-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Joining as</Label>
              <Select value={role} onValueChange={(v: string) => setRole(v)}>
                <SelectTrigger data-testid="join-role-select">
                  <SelectValue>{role === "FAMILY" ? "Family member" : role === "CARETAKER" ? "Caretaker" : "Doctor (read-only)"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAMILY">Family member</SelectItem>
                  <SelectItem value="CARETAKER">Caretaker</SelectItem>
                  <SelectItem value="DOCTOR_VIEWER">Doctor (read-only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={join.isPending} data-testid="join-submit-button">
              {join.isPending ? "Joining…" : meQuery.data ? "Request to join" : "Continue"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              The elder approves every member — joining creates a pending request, never direct access.
            </p>
          </form>
        )}

        {result && result.status === "PENDING" && (
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <PartyPopper className="h-3 w-3" aria-hidden /> You’ll be notified once approved.
          </p>
        )}
        {!meQuery.data && (
          <p className="text-center text-sm text-muted-foreground">
            Have an account?{" "}
            <Link to="/login?next=/join" className="font-medium text-[#116B70] underline underline-offset-4" data-testid="join-to-login-link">
              Sign in first
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
