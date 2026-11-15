import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock3, Pencil, Pill, Plus, PackageOpen } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import MedicationWizard from "@/components/MedicationWizard";
import { apiErrorMessage } from "@/lib/format";
import { apiDelete, apiGet } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { MedicationOut } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function scheduleSummary(med: MedicationOut): string {
  const s = med.schedules[0];
  if (!s) return "No schedule";
  if (s.frequency_type === "AS_NEEDED") return "As needed";
  const times = s.times_of_day.join(", ");
  if (s.frequency_type === "DAILY") return `Daily at ${times}`;
  if (s.frequency_type === "SPECIFIC_DAYS") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${s.times_of_day.join(", ")} on ${(s.days_of_week ?? []).map((d) => days[d]).join(", ") || "chosen days"}`;
  }
  if (s.frequency_type === "INTERVAL") return `Every ${s.interval_days} day(s) at ${times}`;
  return times;
}

// Medications list + add/edit wizard + stop flow + stock/refill visibility.
export default function Medications() {
  const { circle, role } = useApp();
  const circleId = circle?.id ?? null;
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<MedicationOut | null>(null);
  const [stopping, setStopping] = useState<MedicationOut | null>(null);

  const medsQuery = useQuery({
    queryKey: ["medications", circleId],
    queryFn: () => apiGet<MedicationOut[]>(`/circles/${circleId}/medications`),
    enabled: !!circleId,
  });

  const stopMed = useMutation({
    mutationFn: (med: MedicationOut) => apiDelete(`/circles/${circleId}/medications/${med.id}`),
    onSuccess: () => {
      toast.success("Medication stopped — future doses were cancelled (history kept).");
      queryClient.invalidateQueries({ queryKey: ["medications", circleId] });
      queryClient.invalidateQueries({ queryKey: ["doses", circleId] });
      setStopping(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!circle) return <NoCircle />;

  const meds = medsQuery.data ?? [];
  const active = meds.filter((m) => m.is_active);
  const stopped = meds.filter((m) => !m.is_active);
  const canEdit = can({ role, permissions: {} }, "edit_medications") || role === "FAMILY";

  return (
    <div className="space-y-6 p-4 md:p-8" data-testid="medications-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Medications</h1>
          <p className="text-sm text-muted-foreground">
            {role === "FAMILY"
              ? "You can propose changes — the elder or caretaker approves them."
              : role === "DOCTOR_VIEWER"
                ? "Read-only view of the medication plan."
                : "Schedules, stock and interaction advisories."}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setWizardOpen(true);
            }}
            data-testid="medication-add-button"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add medication
          </Button>
        )}
      </div>

      {medsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : active.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center" data-testid="medications-empty-state">
          <Pill className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-heading text-xl font-semibold">No active medications</p>
          <p className="mt-1 text-sm text-muted-foreground">Add the first one to start the dose engine.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="medication-grid">
          {active.map((med) => {
            const lowStock = med.stock_count <= med.refill_threshold_days;
            return (
              <div key={med.id} className="rounded-2xl border bg-card p-5" data-testid={`medication-card-${med.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-xl font-semibold" data-testid={`medication-name-${med.id}`}>
                      {med.name} {med.strength}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[med.generic_name, med.form].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      med.criticality === "CRITICAL" || med.criticality === "HIGH"
                        ? "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]"
                        : med.criticality === "MEDIUM"
                          ? "border-[#FDE68A] bg-[#FEF3C7] text-[#78350F]"
                          : "border-[#E2E8F0] bg-[#F1F5F9] text-[#52636F]"
                    }
                  >
                    {med.criticality}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="flex items-center gap-1.5 rounded-lg bg-[#E6F0EF] px-2.5 py-1 text-[#0F4C50]">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden /> {scheduleSummary(med)}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${lowStock ? "bg-[#FEF3C7] text-[#78350F]" : "bg-[#F1F5F9] text-[#52636F]"}`}
                    data-testid={`medication-stock-${med.id}`}
                  >
                    <PackageOpen className="h-3.5 w-3.5" aria-hidden /> {med.stock_count} in stock
                    {lowStock ? " — refill soon" : ""}
                  </span>
                  <span className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-[#52636F]">
                    {med.instructions.replace("_", " ").toLowerCase()}
                  </span>
                </div>

                {canEdit && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(med);
                        setWizardOpen(true);
                      }}
                      data-testid={`medication-edit-${med.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> {role === "FAMILY" ? "Propose change" : "Edit"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setStopping(med)} data-testid={`medication-stop-${med.id}`}>
                      Stop
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {stopped.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stopped</h2>
          <div className="space-y-2">
            {stopped.map((med) => (
              <div key={med.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 opacity-60" data-testid={`medication-stopped-${med.id}`}>
                <span>
                  {med.name} {med.strength} {med.end_date ? `· ended ${med.end_date}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <MedicationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        circleId={circle.id}
        medication={editing}
        isFamily={role === "FAMILY"}
        onSaved={() => setEditing(null)}
      />

      <Dialog open={!!stopping} onOpenChange={(open) => !open && setStopping(null)}>
        <DialogContent data-testid="medication-stop-dialog">
          <DialogHeader>
            <DialogTitle>Stop {stopping?.name}?</DialogTitle>
            <DialogDescription>
              Future scheduled doses will be cancelled. History, adherence and audit stay untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopping(null)} data-testid="medication-stop-cancel">
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => stopping && stopMed.mutate(stopping)}
              disabled={stopMed.isPending}
              data-testid="medication-stop-confirm"
            >
              {stopMed.isPending ? "Stopping…" : "Stop medication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
