import { useQuery } from "@tanstack/react-query";
import { Flame, PackageOpen } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import AdherenceRing from "@/components/AdherenceRing";
import { apiGet } from "@/lib/api";
import type { AdherenceOut } from "@/lib/types";

// Adherence & reports: score, streak, stacked daily bars, weekly trend, refill predictions.
export default function AdherenceReports() {
  const { circle } = useApp();
  const circleId = circle?.id ?? null;
  const query = useQuery({
    queryKey: ["adherence", circleId, "14"],
    queryFn: () => apiGet<AdherenceOut>(`/circles/${circleId}/reports/adherence?days=14`),
    enabled: !!circleId,
  });

  if (!circle) return <NoCircle />;

  const data = query.data;
  const chartData = (data?.days ?? []).map((d) => ({
    day: d.date.slice(5),
    Taken: d.taken,
    Missed: d.missed,
    Skipped: d.skipped,
  }));

  return (
    <div className="space-y-6 p-4 md:p-8" data-testid="reports-page">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Adherence &amp; reports</h1>
        <p className="text-sm text-muted-foreground">The last 14 days of the dose log, summarised for the next doctor visit.</p>
      </div>

      {query.isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3" data-testid="reports-summary">
            <div className="flex items-center justify-center rounded-2xl border bg-card p-6">
              <AdherenceRing score={data.score} label="14-day adherence" />
            </div>
            <div className="rounded-2xl border bg-card p-6" data-testid="reports-streak-card">
              <Flame className="h-6 w-6 text-[#B45309]" aria-hidden />
              <p className="mt-2 font-heading text-4xl font-semibold" data-testid="reports-streak-days">{data.streak_days}</p>
              <p className="text-sm text-muted-foreground">day streak with every dose taken</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Best slot: <strong>{data.best_slot ?? "—"}</strong> · Needs attention: <strong>{data.worst_slot ?? "—"}</strong>
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6" data-testid="reports-totals-card">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Totals</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li data-testid="totals-taken"><strong className="text-[#15803D]">{data.totals.taken}</strong> taken</li>
                <li data-testid="totals-missed"><strong className="text-[#B91C1C]">{data.totals.missed}</strong> missed</li>
                <li data-testid="totals-skipped"><strong>{data.totals.skipped}</strong> skipped</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5" data-testid="reports-daily-chart">
            <p className="mb-3 font-heading text-lg font-semibold">Daily doses</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" fontSize={12} stroke="#52636F" />
                <YAxis allowDecimals={false} fontSize={12} stroke="#52636F" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Taken" stackId="a" fill="#15803D" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Missed" stackId="a" fill="#B91C1C" />
                <Bar dataKey="Skipped" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {data.weekly.length > 0 && (
            <div className="rounded-2xl border bg-card p-5" data-testid="reports-weekly-chart">
              <p className="mb-3 font-heading text-lg font-semibold">Weekly score</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.weekly.map((w) => ({ week: w.week, Score: w.score }))} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" fontSize={12} stroke="#52636F" />
                  <YAxis domain={[0, 100]} fontSize={12} stroke="#52636F" />
                  <Tooltip />
                  <Line type="monotone" dataKey="Score" stroke="#116B70" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-5" data-testid="reports-refills">
            <p className="flex items-center gap-2 font-heading text-lg font-semibold">
              <PackageOpen className="h-5 w-5 text-[#B45309]" aria-hidden /> Refill prediction
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Medication</th>
                    <th className="py-2 pr-4 font-medium">Stock</th>
                    <th className="py-2 pr-4 font-medium">Doses/day</th>
                    <th className="py-2 pr-4 font-medium">Days left</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.refills.map((r) => {
                    const low = r.days_left !== null && r.days_left <= r.refill_threshold_days;
                    return (
                      <tr key={r.medication_id} className="border-t" data-testid={`refill-row-${r.medication_id}`}>
                        <td className="py-2 pr-4 font-medium">{r.name} {r.strength}</td>
                        <td className="py-2 pr-4">{r.stock_count}</td>
                        <td className="py-2 pr-4">{r.doses_per_day}</td>
                        <td className="py-2 pr-4">{r.days_left ?? "—"}</td>
                        <td className={`py-2 font-medium ${low ? "text-[#B45309]" : "text-[#15803D]"}`}>
                          {low ? "Order soon" : "Okay"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
