"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Clock, Pill, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtTime } from "@/lib/format";
import type { DoseOut } from "@/lib/types";

interface MedicineTimerProps {
  doses: DoseOut[];
  onLogDose?: (doseId: string, status: "TAKEN" | "SKIPPED") => void;
  elderName?: string;
}

export function playReminderChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch {}
}

export default function MedicineTimer({ doses, onLogDose, elderName }: MedicineTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDue, setIsDue] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  });

  // Find the next upcoming scheduled dose
  const nextScheduledDose = doses
    .filter((d) => d.status === "SCHEDULED")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

  useEffect(() => {
    if (!nextScheduledDose) {
      setTimeLeft("All doses taken for today!");
      setIsDue(false);
      return;
    }

    const targetTime = new Date(nextScheduledDose.scheduled_at).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        const overdueMin = Math.floor(Math.abs(diffMs) / 60000);
        setIsDue(true);
        if (overdueMin === 0) {
          setTimeLeft("Dose due right now!");
        } else {
          setTimeLeft(`Due ${overdueMin}m ago — please take now`);
        }
      } else {
        setIsDue(false);
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextScheduledDose]);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser push notifications are not supported on this device.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        playReminderChime();
        toast.success("Medicine notifications enabled! You will be reminded when it's time.");
        new Notification("CareCircle Alerts Active", {
          body: "Dose reminders and escalation alerts are now active on this device.",
          icon: "/favicon.ico",
        });
      } else {
        toast.info("Notifications were not enabled. You can enable them anytime from site settings.");
      }
    } catch {
      toast.error("Unable to configure browser notifications.");
    }
  };

  const speakDoseAlert = () => {
    if (!nextScheduledDose || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const msg = isDue
      ? `Attention. It is time for your ${nextScheduledDose.medication_name} ${nextScheduledDose.medication_strength}. ${nextScheduledDose.instructions || ""}.`
      : `Next medicine is ${nextScheduledDose.medication_name} ${nextScheduledDose.medication_strength} in ${timeLeft}.`;
    const utter = new SpeechSynthesisUtterance(msg);
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
    playReminderChime();
    toast.success("Playing medicine reminder audio aloud 🔊");
  };

  if (!nextScheduledDose) {
    return (
      <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">All daily medications logged</p>
            <p className="text-xs text-muted-foreground">Great job staying on track with your health routine today!</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-300">
          100% Adherent Today
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl border transition-all p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDue
          ? "border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 animate-pulse"
          : "border-border/60 bg-card text-foreground"
      }`}
      data-testid="medicine-timer-banner"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            isDue
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
              : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
          }`}
        >
          {isDue ? <Clock className="h-6 w-6 animate-spin" /> : <Pill className="h-6 w-6" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isDue ? "⚠️ Medicine Due" : "⏳ Next Dose Timer"}
            </span>
            <Badge
              variant={isDue ? "default" : "secondary"}
              className={`text-xs font-mono font-bold ${
                isDue ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-teal-500/20 text-teal-700 dark:text-teal-300"
              }`}
            >
              {timeLeft}
            </Badge>
          </div>
          <p className="mt-1 font-heading text-base sm:text-lg font-bold truncate">
            {nextScheduledDose.medication_name} ({nextScheduledDose.medication_strength})
          </p>
          <p className="text-xs text-muted-foreground">
            Scheduled at {fmtTime(nextScheduledDose.scheduled_at)} · {nextScheduledDose.instructions || "Take with water"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-1.5 text-xs"
          onClick={speakDoseAlert}
          title="Read medication reminder aloud"
        >
          <Volume2 className="h-4 w-4" />
          <span className="hidden md:inline">Voice</span>
        </Button>

        {!notificationsEnabled ? (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-1.5 text-xs border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
            onClick={requestNotificationPermission}
            title="Enable push reminders"
          >
            <Bell className="h-4 w-4" />
            <span>Enable Alerts</span>
          </Button>
        ) : (
          <Badge variant="outline" className="border-teal-500/30 text-teal-600 text-[11px] gap-1 px-2 py-1">
            <BellRing className="h-3 w-3 text-teal-500" />
            <span className="hidden sm:inline">Alerts On</span>
          </Badge>
        )}

        {onLogDose && (
          <Button
            size="sm"
            className={`h-9 px-4 gap-1.5 text-xs font-semibold ${
              isDue
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
            onClick={() => {
              playReminderChime();
              onLogDose(nextScheduledDose.id, "TAKEN");
            }}
          >
            <Check className="h-4 w-4" />
            <span>Take Dose</span>
          </Button>
        )}
      </div>
    </div>
  );
}
