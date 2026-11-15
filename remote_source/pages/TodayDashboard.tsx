import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Pill, Volume2 } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import DoseCard from "@/components/DoseCard";
import EscalationBanner from "@/components/EscalationBanner";
import AdherenceRing from "@/components/AdherenceRing";
import { useDoseLog } from "@/hooks/useDoseLog";
import { dayLabel, fmtDate, fmtDateTime, greeting } from "@/lib/format";
import { apiGet } from "@/lib/api";
import type { AdherenceOut, AppointmentOut, DoseOut } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Today: dose timeline + escalation + adherence ring + next appointment + refills.
export default function TodayDashboard() {
  const { me, circle, role } = useApp();
  const circleId = circle?.id ?? null;
  const logDose = useDoseLog(circleId);

  const dosesQuery = useQuery({
    queryKey: ["doses", circleId, "today"],
    queryFn: () => apiGet<DoseOut[]>(`/circles/${circleId}/doses?days=0`),
    enabled: !!circleId,
  });
  const adherenceQuery = useQuery({
    queryKey: ["adherence", circleId, "week"],
    queryFn: () => apiGet<AdherenceOut>(`/circles/${circleId}/reports/adherence?days=7`),
    enabled: !!circleId,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", circleId, "upcoming"],
    queryFn: () => apiGet<AppointmentOut[]>(`/circles/${circleId}/appointments?scope=upcoming`),
    enabled: !!circleId,
  });

  if (!circle) return <NoCircle />;

  const doses = dosesQuery.data ?? [];
  const missed = doses.filter((d) => d.status === "MISSED");
  const nextAppointment = appointmentsQuery.data?.[0];
  const adherence = adherenceQuery.data;
  const lowStock = (adherence?.refills ?? []).filter(
    (r) => r.days_left !== null && r.days_left <= r.refill_threshold_days
  );

  // Group doses by day for the timeline (server already sorted by scheduled_at).
  const groups = new Map<string, DoseOut[]>();
  for (const d of doses) {
    const key = new Date(d.scheduled_at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-4 md:p-8 lg:grid-cols-12" data-testid="today-dashboard">
      <section className="space-y-5 lg:col-span-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold" data-testid="today-greeting">
              {greeting()}, {me?.full_name.split(" ")[0] || "there"}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="today-circle-line">
              {circle.name} · {fmtDate(new Date().toISOString())}
            </p>
          </div>
          <Button variant="outline" size="sm" render={<Link to="/app/elder" />} data-testid="today-open-elder-view">
            <Volume2 className="h-4 w-4" aria-hidden /> Elder View
          </Button>
        </div>

        {missed.length > 0 && <EscalationBanner missed={missed} />}

        <div className="flex flex-wrap gap-3" data-testid="today-stat-chips">
          <span className="rounded-xl border bg-card px-4 py-2 text-sm" data-testid="stat-total-today">
            <strong>{doses.length}</strong> dose{doses.length === 1 ? "" : "s"} in the window
          </span>
          <span className="rounded-xl border bg-card px-4 py-2 text-sm" data-testid="stat-pending-today">
            <strong>{doses.filter((d) => d.status === "SCHEDULED").length}</strong> still to log
          </span>
          <span className="rounded-xl border bg-card px-4 py-2 text-sm" data-testid="stat-missed-today">
            <strong>{missed.length}</strong> missed
          </span>
        </div>

        {dosesQuery.isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : doses.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center" data-testid="today-empty-state">
            <Pill className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-heading text-xl font-semibold">No doses in view yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a medication with a schedule — the dose engine fills this timeline automatically.
            </p>
            <Button className="mt-4" render={<Link to="/app/medications" />} data-testid="today-empty-add-medication">
              <Pill className="h-4 w-4" aria-hidden /> Add medication
            </Button>
          </div>
        ) : (
          [...groups.entries()].map(([key, dayDoses]) => (
            <div key={key} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground" data-testid={`today-day-heading-${key}`}>
                {dayLabel(dayDoses[0].scheduled_at)}
              </h2>
              {dayDoses.map((dose) => (
                <DoseCard key={dose.id} dose={dose} onLog={(d, s) => logDose.mutate({ dose: d, status: s })} pending={logDose.isPending} />
              ))}
            </div>
          ))
        )}
      </section>

      <aside className="space-y-5 lg:col-span-4">
        <div className="rounded-2xl border bg-card p-6" data-testid="adherence-card">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Adherence</h2>
            <Button variant="ghost" size="sm" render={<Link to="/app/reports" />} data-testid="adherence-reports-link">
              Reports
            </Button>
          </div>
          {adherenceQuery.isLoading || !adherence ? (
            <div className="mx-auto mt-4 h-32 w-32 animate-pulse rounded-full bg-muted" />
          ) : (
            <div className="mt-2 space-y-3">
              <AdherenceRing score={adherence.score} />
              <p className="text-center text-sm text-muted-foreground" data-testid="adherence-streak-line">
                {adherence.streak_days > 0
                  ? `${adherence.streak_days}-day all-taken streak`
                  : "No active streak — today is a fresh start"}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {adherence.totals.taken} taken · {adherence.totals.missed} missed · {adherence.totals.skipped} skipped (7 days)
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6" data-testid="next-appointment-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <CalendarPlus className="h-5 w-5 text-primary" aria-hidden /> Next appointment
          </h2>
          {nextAppointment ? (
            <div className="mt-3">
              <p className="font-semibold" data-testid="next-appointment-title">{nextAppointment.title}</p>
              <p className="text-sm text-muted-foreground" data-testid="next-appointment-when">
                {fmtDateTime(nextAppointment.scheduled_at)}
              </p>
              {nextAppointment.doctor_name && <p className="text-sm text-muted-foreground">{nextAppointment.doctor_name}</p>}
              {nextAppointment.location && <p className="text-sm text-muted-foreground">{nextAppointment.location}</p>}
              <Button variant="outline" size="sm" className="mt-3" render={<Link to="/app/appointments" />} data-testid="next-appointment-open-link">
                All appointments
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled — a calm week.</p>
          )}
        </div>

        {lowStock.length > 0 && (
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-6" data-testid="refill-alerts-card">
            <h2 className="font-heading text-lg font-semibold text-[#78350F]">Refill soon</h2>
            <ul className="mt-2 space-y-2">
              {lowStock.map((r) => (
                <li key={r.medication_id} className="text-sm text-[#78350F]" data-testid={`refill-alert-${r.medication_id}`}>
                  <strong>{r.name} {r.strength}</strong> — about {r.days_left} day{r.days_left === 1 ? "" : "s"} of stock left
                  ({r.stock_count} pills at {r.doses_per_day}/day)
                </li>
              ))}
            </ul>
          </div>
        )}

        {role === "DOCTOR_VIEWER" && (
          <p className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground" data-testid="doctor-readonly-note">
            You are viewing as a doctor — this circle is read-only for you.
          </p>
        )}
      </aside>
    </div>
  );
}
