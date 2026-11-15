import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import { apiErrorMessage } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { beginSession, endSession } from "@/lib/session";
import { speak, ttsAvailable } from "@/lib/tts";
import { ROLE_LABELS } from "@/lib/permissions";
import type { UserOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_PERSONAS = [
  { label: "Elder Owner", email: "elder@carecircle.demo", testid: "persona-switch-elder" },
  { label: "Caretaker", email: "caretaker@carecircle.demo", testid: "persona-switch-caretaker" },
  { label: "Family", email: "family@carecircle.demo", testid: "persona-switch-family" },
  { label: "Doctor (read-only)", email: "doctor@carecircle.demo", testid: "persona-switch-doctor" },
];

// Settings: profile, Elder Mode, language, demo persona switch, sign out.
export default function SettingsPage() {
  const { me, circle, role, elderMode, toggleElderMode } = useApp();
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState("");

  const switchPersona = useMutation({
    mutationFn: (email: string) => apiPost<UserOut>("/auth/login", { email, password: "care1234" }),
    onSuccess: (user, email) => {
      beginSession();
      toast.success(`Now viewing as ${user.full_name}`);
      const label = DEMO_PERSONAS.find((p) => p.email === email)?.label ?? "member";
      setBusy("");
      window.location.assign("/app");
      void label;
    },
    onError: (err) => {
      setBusy("");
      toast.error(apiErrorMessage(err));
    },
  });

  if (!circle) return <NoCircle />;

  return (
    <div className="w-full space-y-6 p-4 md:p-8" data-testid="settings-page">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account, how CareCircle looks, and demo tools.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6" data-testid="settings-profile-card">
        <h2 className="font-heading text-lg font-semibold">Profile</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between" data-testid="settings-name-row">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{me?.full_name}</dd>
          </div>
          <div className="flex justify-between" data-testid="settings-email-row">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{me?.email}</dd>
          </div>
          <div className="flex justify-between" data-testid="settings-role-row">
            <dt className="text-muted-foreground">Role in {circle.name}</dt>
            <dd className="font-medium">{ROLE_LABELS[role] ?? role}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border bg-card p-6" data-testid="settings-elder-card">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Volume2 className="h-5 w-5 text-primary" aria-hidden /> Elder Mode
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bigger text everywhere, stronger contrast, and a simplified Elder View with a voice that reads
          the schedule aloud.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Button variant={elderMode ? "default" : "outline"} onClick={toggleElderMode} data-testid="elder-mode-switch">
            {elderMode ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
            {elderMode ? "Elder Mode is ON" : "Elder Mode is off"}
          </Button>
          {ttsAvailable() && (
            <Button variant="ghost" size="sm" onClick={() => speak("Elder mode voice is working. All good.")} data-testid="elder-voice-test-button">
              Test voice
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="mt-3" render={<a href="/app/elder" />} data-testid="settings-open-elder-view">
          Open the Elder View
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-6" data-testid="settings-language-card">
        <h2 className="font-heading text-lg font-semibold">Language</h2>
        <p className="mt-1 text-sm text-muted-foreground">Interface language (voice prompts follow it too).</p>
        <Select value={language} onValueChange={(v: string) => setLanguage(v)}>
          <SelectTrigger className="mt-3 w-56" data-testid="language-select">
            <SelectValue>{language === "en" ? "English" : language === "hi" ? "हिन्दी" : "मराठी"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
            <SelectItem value="mr">मराठी (Marathi)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card p-6" data-testid="settings-demo-card">
        <h2 className="font-heading text-lg font-semibold">Demo personas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hop between roles to see how the same circle looks for each member.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_PERSONAS.map((p) => (
            <Button
              key={p.email}
              variant="outline"
              size="sm"
              disabled={switchPersona.isPending || busy !== ""}
              onClick={() => {
                setBusy(p.email);
                switchPersona.mutate(p.email);
              }}
              data-testid={p.testid}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <Button variant="destructive" onClick={() => endSession()} data-testid="settings-signout-button">
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </Button>
    </div>
  );
}
