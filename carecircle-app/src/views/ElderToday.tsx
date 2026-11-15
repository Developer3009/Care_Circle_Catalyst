import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Volume2 } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import DoseCard from "@/components/DoseCard";
import MedicineTimer from "@/components/MedicineTimer";
import EscalationBanner from "@/components/EscalationBanner";
import { useDoseLog } from "@/hooks/useDoseLog";
import { fmtTime } from "@/lib/format";
import { speak, ttsAvailable } from "@/lib/tts";
import { apiGet } from "@/lib/api";
import type { DoseOut } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Elder Mode Today — high contrast, huge targets, voice. Same data, calmer surface.
export default function ElderToday() {
  const { circle } = useApp();
  const circleId = circle?.id ?? null;
  const logDose = useDoseLog(circleId, true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dosesQuery = useQuery({
    queryKey: ["doses", circleId, "today"],
    queryFn: () => apiGet<DoseOut[]>(`/circles/${circleId}/doses?days=0`),
    enabled: !!circleId,
    refetchInterval: 60_000,
  });

  if (!circle) return <NoCircle />;

  const doses = (dosesQuery.data ?? []).filter((d) => new Date(d.scheduled_at).toDateString() === now.toDateString());
  const missed = doses.filter((d) => d.status === "MISSED");
  const pending = doses.filter((d) => d.status === "SCHEDULED");

  const readSchedule = () => {
    if (pending.length === 0) {
      speak("All doses for today are logged. Well done.");
      return;
    }
    const list = pending
      .slice(0, 4)
      .map((d) => `${d.medication_name} ${d.medication_strength} at ${fmtTime(d.scheduled_at)}`)
      .join(", ");
    speak(`You have ${pending.length} dose${pending.length === 1 ? "" : "s"} coming: ${list}.`);
  };

  return (
    <div className="w-full space-y-8 p-4 md:p-8 text-xl" data-testid="elder-today-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[#52636F]" data-testid="elder-date-line">
            {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="font-heading text-4xl font-semibold" data-testid="elder-greeting">
            Namaste{circle.elder_name ? `, ${circle.elder_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 font-mono text-3xl font-semibold text-[#116B70]" data-testid="elder-clock">
            {fmtTime(now.toISOString())}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {ttsAvailable() && (
            <Button size="lg" className="h-16 px-6 text-xl" onClick={readSchedule} data-testid="elder-read-schedule-button">
              <Volume2 className="h-6 w-6" aria-hidden /> Read my schedule
            </Button>
          )}
          <Button variant="ghost" render={<Link to="/app" />} data-testid="elder-exit-link">
            <LayoutDashboard className="h-4 w-4" aria-hidden /> Full dashboard
          </Button>
        </div>
      </div>

      {missed.length > 0 && <EscalationBanner missed={missed} />}

      <MedicineTimer
        doses={doses}
        onLogDose={(id, status) => {
          const target = doses.find((d) => d.id === id);
          if (target) logDose.mutate({ dose: target, status });
        }}
        elderName={circle.elder_name}
      />

      {dosesQuery.isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : doses.length === 0 ? (
        <div className="rounded-3xl border-2 bg-card p-10 text-center" data-testid="elder-empty-state">
          <p className="font-heading text-2xl font-semibold">Nothing scheduled today</p>
          <p className="mt-2 text-[#52636F]">Enjoy the day. Your doses will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5" aria-live="polite">
          {doses.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={dose}
              variant="elder"
              onLog={(d, s) => logDose.mutate({ dose: d, status: s })}
              pending={logDose.isPending}
            />
          ))}
        </div>
      )}

      <p className="text-center text-base text-[#52636F]" data-testid="elder-footer-note">
        {pending.length === 0 && doses.length > 0
          ? "All doses logged for today. Well done!"
          : "Tap the big green button when you take a dose."}
      </p>
    </div>
  );
}
