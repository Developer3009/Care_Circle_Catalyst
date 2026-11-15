import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { HeartHandshake } from "lucide-react";
import { apiErrorMessage } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { UserOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HERO_IMG =
  "https://images.unsplash.com/photo-1765896387398-1e1ae8d2eb85?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGVsZGVybHklMjBwZXJzb24lMjBkb2N0b3IlMjBjYXJlZ2l2ZXJ8ZW58MHx8fHwxNzk0NzMxMDEwfDA&ixlib=rb-4.1.0&q=85";

const DEMO_ACCOUNTS = [
  { label: "Elder", email: "elder@carecircle.demo", testid: "demo-login-elder" },
  { label: "Caretaker", email: "caretaker@carecircle.demo", testid: "demo-login-caretaker" },
  { label: "Family", email: "family@carecircle.demo", testid: "demo-login-family" },
  { label: "Doctor", email: "doctor@carecircle.demo", testid: "demo-login-doctor" },
];

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: (creds: { email: string; password: string }) => apiPost<UserOut>("/auth/login", creds),
    onSuccess: (user) => {
      beginSession();
      toast.success(`Welcome back, ${user.full_name}`);
      navigate(next, { replace: true });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-2" data-testid="login-page">
      <div
        className="relative hidden flex-col justify-between p-10 lg:flex"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15,40,42,0.85) 0%, rgba(17,107,112,0.75) 100%), url(${HERO_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Link to="/" className="flex items-center gap-2 text-white" data-testid="login-back-home">
          <HeartHandshake className="h-7 w-7" aria-hidden />
          <span className="font-heading text-xl font-semibold">CareCircle</span>
        </Link>
        <div className="max-w-md">
          <p className="font-heading text-3xl font-semibold leading-snug text-white">
            The elder owns the circle. Everyone else is invited in — with consent, and only as far as
            the elder allows.
          </p>
          <ul className="mt-6 space-y-2 text-[#E2ECE9]">
            <li>· Passcode-based joining, elder-approved memberships</li>
            <li>· Missed doses escalate: elder → caretaker → family</li>
            <li>· Every change logged with who and when</li>
          </ul>
        </div>
        <p className="text-sm text-[#CBD5E1]">Private by design. Auditable by default.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your email and password, or a demo persona below.</p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({ email: email.trim(), password });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                data-testid="login-email-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="login-password-input"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={login.isPending} data-testid="login-submit-button">
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="rounded-2xl border bg-card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo personas — password “care1234”
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <Button
                  key={d.email}
                  variant="outline"
                  size="sm"
                  disabled={login.isPending}
                  onClick={() => login.mutate({ email: d.email, password: "care1234" })}
                  data-testid={d.testid}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-medium text-[#116B70] underline underline-offset-4" data-testid="login-to-register-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
