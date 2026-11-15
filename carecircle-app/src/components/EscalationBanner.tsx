import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DoseOut } from "@/lib/types";

// Escalation ladder banner — visually graduates L0 (amber) → L1 (orange) → L2 (rose).
export default function EscalationBanner({ missed }: { missed: DoseOut[] }) {
  if (missed.length === 0) return null;
  const level = Math.max(...missed.map((d) => d.escalation_level));
  const names = missed.map((d) => `${d.medication_name} ${d.medication_strength}`.trim()).join(", ");
  const copy = [
    {
      bg: "bg-[#FEF3C7] border-[#FDE68A]",
      text: "text-[#78350F]",
      title: "Missed dose — elder reminder sent (Level 0)",
    },
    {
      bg: "bg-[#FFEDD5] border-[#FED7AA]",
      text: "text-[#9A3412]",
      title: "Missed dose — caretaker alerted (Level 1)",
    },
    {
      bg: "bg-[#FEE2E2] border-[#FECACA]",
      text: "text-[#991B1B]",
      title: "Missed dose — family alerted (Level 2)",
    },
  ][level];

  return (
    <div
      className={cn("flex items-start gap-3 rounded-2xl border p-4", copy.bg, level === 2 && "animate-soft-pulse")}
      data-testid="escalation-banner"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", copy.text)} aria-hidden />
      <div>
        <p className={cn("text-sm font-semibold", copy.text)} data-testid="escalation-banner-title">
          {copy.title}
        </p>
        <p className={cn("mt-0.5 text-sm", copy.text)}>
          {names} — {missed.length} dose{missed.length === 1 ? "" : "s"} missed today. Log it below once
          it’s taken, or mark it skipped with a reason.
        </p>
      </div>
    </div>
  );
}
