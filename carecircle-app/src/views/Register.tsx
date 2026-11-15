import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { UserOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_PREVIEW = [
  { title: "Elder Owner", copy: "Owns the circle, approves members, controls visibility." },
  { title: "Caretaker", copy: "Hands-on: logs doses, vitals and shift-handover notes." },
  { title: "Family", copy: "Sees the day, proposes changes — the elder approves them." },
  { title: "Doctor", copy: "Read-only clinical view of meds, adherence and reports." },
];

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = useMutation({
    mutationFn: () => apiPost<UserOut>("/auth/register", { full_name: fullName.trim(), email: email.trim(), password }),
    onSuccess: (user) => {
      beginSession();
      toast.success(`Welcome to CareCircle, ${user.full_name.split(" ")[0]}!`);
      navigate("/app", { replace: true });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-2" data-testid="register-page">
      <div className="flex items-center justify-center bg-[#132A2F] p-10 text-white">
        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-semibold">Four ways to belong to a circle</h2>
          <ul className="mt-8 space-y-5">
            {ROLE_PREVIEW.map((r, i) => (
              <li key={r.title} className="flex gap-4" data-testid={`register-role-preview-${i}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#116B70] text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-[#CBD5E1]">{r.copy}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-[#9FB8B6]">
            After signing up, create your own circle — or join one with the passcode the elder shared.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">One account can belong to several circles.</p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              register.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="register-name">Full name</Label>
              <Input id="register-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ramesh Patel" required minLength={2} data-testid="register-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required data-testid="register-email-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-password">Password</Label>
              <Input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} data-testid="register-password-input" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={register.isPending} data-testid="register-submit-button">
              {register.isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#116B70] underline underline-offset-4" data-testid="register-to-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
