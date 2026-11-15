import { motion } from "motion/react";
import { AlarmClock, Check, CircleSlash, Clock3, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtTime, relativeFromNow } from "@/lib/format";
import { INSTRUCTIONS_LABELS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DoseOut } from "@/lib/types";

interface DoseCardProps {
  dose: DoseOut;
  onLog: (dose: DoseOut, status: "TAKEN" | "SNOOZED" | "SKIPPED") => void;
  pending?: boolean;
  variant?: "standard" | "elder";
}

const STATUS_STYLES: Record<string, string> = {
  TAKEN: "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]",
  MISSED: "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]",
  SKIPPED: "bg-[#F1F5F9] text-[#52636F] border border-[#E2E8F0]",
  SCHEDULED: "bg-[#E6F0EF] text-[#0F4C50] border border-[#C7E0DF]",
};

const CRITICALITY_STYLES: Record<string, string> = {
  LOW: "bg-[#F1F5F9] text-[#52636F]",
  MEDIUM: "bg-[#FEF3C7] text-[#78350F]",
  HIGH: "bg-[#FFEDD5] text-[#9A3412]",
  CRITICAL: "bg-[#FEE2E2] text-[#991B1B]",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[status] ?? STATUS_STYLES.SCHEDULED)}
      data-testid={`dose-status-chip-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

// The one-tap dose row. Elder variant scales everything up (56px+ touch targets).
export default function DoseCard({ dose, onLog, pending, variant = "standard" }: DoseCardProps) {
  const elder = variant === "elder";
  const decided = dose.status === "TAKEN" || dose.status === "SKIPPED";
  const scheduled = new Date(dose.scheduled_at);
  const now = new Date();
  const isFuture = scheduled.getTime() > now.getTime();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center",
        elder && "p-6",
        dose.status === "MISSED" && "border-[#FECACA] bg-[#FFF7F7]"
      )}
      data-testid={`dose-card-${dose.id}`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:w-64">
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-xl bg-[#E6F0EF] text-[#0F4C50]",
            elder ? "h-16 w-16" : "h-12 w-14"
          )}
        >
          <Clock3 className="h-4 w-4" aria-hidden />
          <span className={cn("font-mono font-semibold leading-none", elder ? "text-base" : "text-sm")}>
            {fmtTime(dose.scheduled_at)}
          </span>
        </div>
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", elder ? "text-xl" : "text-base")} data-testid={`dose-med-name-${dose.id}`}>
            {dose.medication_name} {dose.medication_strength}
          </p>
          <p className={cn("text-muted-foreground", elder ? "text-base" : "text-xs")}>
            {INSTRUCTIONS_LABELS[dose.instructions] ?? dose.instructions} · {relativeFromNow(dose.scheduled_at)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("border-transparent", CRITICALITY_STYLES[dose.criticality] ?? "")}>
          {dose.criticality}
        </Badge>
        <StatusChip status={dose.status} />
        {dose.status === "MISSED" && dose.escalation_level > 0 && (
          <Badge variant="destructive" className="animate-soft-pulse" data-testid={`dose-escalation-${dose.id}`}>
            <AlarmClock className="mr-1 h-3 w-3" aria-hidden />
            Escalation L{dose.escalation_level}
          </Badge>
        )}
        {dose.logged_by_name && (
          <span className="text-xs text-muted-foreground">
            by {dose.logged_by_name}
            {dose.note ? ` · ${dose.note}` : ""}
          </span>
        )}
      </div>

      <div className={cn("flex gap-2 sm:ml-auto", elder && "w-full flex-col sm:w-auto sm:flex-row")}>
        {!decided && (
          <>
            <Button
              size={elder ? "lg" : "default"}
              className={cn(!elder && "min-h-11")}
              disabled={pending}
              onClick={() => onLog(dose, "TAKEN")}
              data-testid={`dose-taken-btn-${dose.id}`}
            >
              <Check className="h-4 w-4" aria-hidden /> Taken
            </Button>
            {!isFuture && (
              <Button
                variant="outline"
                size={elder ? "lg" : "default"}
                disabled={pending}
                onClick={() => onLog(dose, "SNOOZED")}
                data-testid={`dose-snooze-btn-${dose.id}`}
              >
                Snooze 15m
              </Button>
            )}
            <Button
              variant="ghost"
              size={elder ? "lg" : "default"}
              disabled={pending}
              onClick={() => onLog(dose, "SKIPPED")}
              data-testid={`dose-skip-btn-${dose.id}`}
            >
              <CircleSlash className="h-4 w-4" aria-hidden /> Skip
            </Button>
          </>
        )}
        {decided && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`dose-logged-info-${dose.id}`}>
            <Pill className="h-4 w-4" aria-hidden />
            Logged {dose.logged_at ? fmtTime(dose.logged_at) : ""} via {dose.source === "EMAIL_LINK" ? "email link" : dose.source === "WEB" ? "web" : "—"}
          </span>
        )}
      </div>
    </motion.div>
  );
}
