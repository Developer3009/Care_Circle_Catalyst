import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Stethoscope } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import { StatusChip } from "@/components/DoseCard";
import { dayLabel, fmtTime } from "@/lib/format";
import { apiGet } from "@/lib/api";
import type { AppointmentOut, DoseOut } from "@/lib/types";

// Week view: doses + appointments grouped per day.
export default function CalendarView() {
  const { circle } = useApp();
  const circleId = circle?.id ?? null;

  const dosesQuery = useQuery({
    queryKey: ["doses", circleId, "week"],
    queryFn: () => apiGet<DoseOut[]>(`/circles/${circleId}/doses?days=6`),
    enabled: !!circleId,
  });
  const apptsQuery = useQuery({
    queryKey: ["appointments", circleId, "upcoming"],
    queryFn: () => apiGet<AppointmentOut[]>(`/circles/${circleId}/appointments?scope=upcoming`),
    enabled: !!circleId,
  });

  if (!circle) return <NoCircle />;

  const doses = dosesQuery.data ?? [];
  const appointments = apptsQuery.data ?? [];

  const days = new Map<string, { doses: DoseOut[]; appointments: AppointmentOut[] }>();
  for (const d of doses) {
    const key = new Date(d.scheduled_at).toDateString();
    if (!days.has(key)) days.set(key, { doses: [], appointments: [] });
    days.get(key)!.doses.push(d);
  }
  for (const a of appointments) {
    if (a.status === "CANCELLED") continue;
    const key = new Date(a.scheduled_at).toDateString();
    if (!days.has(key)) days.set(key, { doses: [], appointments: [] });
    days.get(key)!.appointments.push(a);
  }

  const ordered = [...days.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const today = new Date().toDateString();

  return (
    <div className="space-y-6 p-4 md:p-8" data-testid="calendar-page">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Week ahead</h1>
        <p className="text-sm text-muted-foreground">Doses and appointments side by side, in the circle’s timezone.</p>
      </div>

      {dosesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="calendar-day-grid">
          {ordered.map(([key, entry]) => (
            <div
              key={key}
              className={`rounded-2xl border bg-card p-4 ${key === today ? "border-[#116B70] ring-1 ring-[#116B70]" : ""}`}
              data-testid={`calendar-day-${key}`}
            >
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <CalendarDays className="h-4 w-4 text-[#116B70]" aria-hidden />
                {dayLabel(entry.doses[0]?.scheduled_at ?? entry.appointments[0]?.scheduled_at ?? key)}
              </h2>
              <div className="mt-3 space-y-2">
                {entry.appointments.map((a) => (
                  <div key={a.id} className="rounded-xl bg-[#E6F0EF] p-3" data-testid={`calendar-appointment-${a.id}`}>
                    <p className="text-sm font-semibold text-[#0F4C50]">
                      <Stethoscope className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      {fmtTime(a.scheduled_at)} · {a.title}
                    </p>
                    <p className="text-xs text-[#0F4C50]">
                      {a.doctor_name}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                ))}
                {entry.doses.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`calendar-dose-${d.id}`}>
                    <span className="font-mono">{fmtTime(d.scheduled_at)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {d.medication_name} {d.medication_strength}
                    </span>
                    <StatusChip status={d.status} />
                  </div>
                ))}
                {entry.doses.length === 0 && entry.appointments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nothing planned.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {appointments.length === 0 && doses.length === 0 && !dosesQuery.isLoading && (
        <div className="flex items-center gap-2 rounded-2xl border bg-card p-6 text-sm text-muted-foreground" data-testid="calendar-empty-note">
          <MapPin className="h-4 w-4" aria-hidden /> No doses or appointments in the next 7 days.
        </div>
      )}
    </div>
  );
}
