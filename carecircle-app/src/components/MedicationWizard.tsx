import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { apiErrorMessage, isChangeRequestRequired } from "@/lib/format";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { InteractionWarning, MedicationOut } from "@/lib/types";
import { INSTRUCTIONS_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MedicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  medication: MedicationOut | null; // null → create
  isFamily: boolean;
  onSaved: () => void;
}

interface FormState {
  name: string;
  generic_name: string;
  strength: string;
  form: string;
  instructions: string;
  criticality: string;
  stock_count: string;
  refill_threshold_days: string;
  start_date: string;
  frequency_type: string;
  times: string[];
  days_of_week: number[];
  interval_days: string;
  grace_minutes: string;
  lead_minutes: string;
}

function blankForm(): FormState {
  return {
    name: "",
    generic_name: "",
    strength: "",
    form: "Tablet",
    instructions: "AFTER_FOOD",
    criticality: "MEDIUM",
    stock_count: "30",
    refill_threshold_days: "7",
    start_date: "",
    frequency_type: "DAILY",
    times: ["08:00"],
    days_of_week: [1],
    interval_days: "1",
    grace_minutes: "30",
    lead_minutes: "15",
  };
}

// Add/edit medication dialog with schedule builder + live advisory interaction check.
export default function MedicationWizard({ open, onOpenChange, circleId, medication, isFamily, onSaved }: MedicationWizardProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(blankForm());
  const [requestNote, setRequestNote] = useState("");

  useEffect(() => {
    if (!open) return;
    if (medication) {
      const sched = medication.schedules[0];
      setForm({
        name: medication.name,
        generic_name: medication.generic_name,
        strength: medication.strength,
        form: medication.form,
        instructions: medication.instructions,
        criticality: medication.criticality,
        stock_count: String(medication.stock_count),
        refill_threshold_days: String(medication.refill_threshold_days),
        start_date: medication.start_date,
        frequency_type: sched?.frequency_type ?? "DAILY",
        times: sched?.times_of_day?.length ? [...sched.times_of_day] : ["08:00"],
        days_of_week: sched?.days_of_week?.length ? [...sched.days_of_week] : [1],
        interval_days: String(sched?.interval_days ?? 1),
        grace_minutes: String(sched?.grace_minutes ?? 30),
        lead_minutes: String(sched?.lead_minutes ?? 15),
      });
    } else {
      setForm(blankForm());
    }
    setRequestNote("");
  }, [open, medication]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const trimmedName = form.name.trim();
  const interactionQuery = useQuery({
    queryKey: ["interaction-check", circleId, trimmedName, medication?.id ?? "new"],
    queryFn: () =>
      apiGet<{ warnings: InteractionWarning[] }>(
        `/circles/${circleId}/medications/interaction-check?name=${encodeURIComponent(trimmedName)}${medication ? `&exclude_id=${medication.id}` : ""}`
      ),
    enabled: open && trimmedName.length >= 2,
  });
  const warnings = interactionQuery.data?.warnings ?? [];

  const save = useMutation({
    mutationFn: () => {
      const schedule = {
        frequency_type: form.frequency_type,
        times_of_day: form.times.filter((t) => t),
        days_of_week: form.days_of_week,
        interval_days: Number(form.interval_days) || 1,
        dose_amount: 1,
        grace_minutes: Number(form.grace_minutes) || 30,
        lead_minutes: Number(form.lead_minutes) || 15,
      };
      const payload = {
        name: trimmedName,
        generic_name: form.generic_name.trim(),
        strength: form.strength.trim(),
        form: form.form.trim(),
        instructions: form.instructions,
        criticality: form.criticality,
        stock_count: Number(form.stock_count) || 0,
        refill_threshold_days: Number(form.refill_threshold_days) || 7,
        start_date: form.start_date,
        schedule,
      };
      if (medication) return apiPatch<MedicationOut>(`/circles/${circleId}/medications/${medication.id}`, payload);
      return apiPost<MedicationOut>(`/circles/${circleId}/medications`, payload);
    },
    onSuccess: () => {
      toast.success(medication ? "Medication updated — schedule re-planned." : "Medication added — doses scheduled for the next 7 days.");
      queryClient.invalidateQueries({ queryKey: ["medications", circleId] });
      queryClient.invalidateQueries({ queryKey: ["doses", circleId] });
      queryClient.invalidateQueries({ queryKey: ["adherence"] });
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => {
      if (isChangeRequestRequired(err)) {
        toast.info("Family members propose changes — fill the note and send it to the elder for approval.");
        setRequestNote((n) => n || `Update ${form.name}: strength ${form.strength}, stock ${form.stock_count}`);
        return;
      }
      toast.error(apiErrorMessage(err));
    },
  });

  const sendChangeRequest = useMutation({
    mutationFn: () =>
      apiPost(`/circles/${circleId}/change-requests`, {
        entity_type: "medication",
        entity_id: medication?.id,
        payload: {
          name: trimmedName,
          strength: form.strength.trim(),
          stock_count: Number(form.stock_count) || 0,
          instructions: form.instructions,
        },
        note: requestNote,
      }),
    onSuccess: () => {
      toast.success("Change request sent — the elder or caretaker will approve it.");
      queryClient.invalidateQueries({ queryKey: ["change-requests", circleId] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const submit = () => {
    if (trimmedName.length < 2) {
      toast.error("Medication name needs at least 2 characters");
      return;
    }
    if (form.times.filter((t) => t).length === 0) {
      toast.error("Add at least one time of day");
      return;
    }
    if (form.frequency_type === "SPECIFIC_DAYS" && form.days_of_week.length === 0) {
      toast.error("Pick at least one day of the week");
      return;
    }
    save.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl" data-testid="medication-wizard-dialog">
        <DialogHeader>
          <DialogTitle>{medication ? `Edit ${medication.name}` : "Add medication"}</DialogTitle>
          <DialogDescription>
            {isFamily
              ? "Your edit will be sent as a change request for the elder to approve."
              : "The dose engine plans the next 7 days from this schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="med-name">Medication name</Label>
              <Input id="med-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Metformin" data-testid="medication-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-generic">Generic name</Label>
              <Input id="med-generic" value={form.generic_name} onChange={(e) => set({ generic_name: e.target.value })} placeholder="Metformin HCl" data-testid="medication-generic-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-strength">Strength</Label>
              <Input id="med-strength" value={form.strength} onChange={(e) => set({ strength: e.target.value })} placeholder="500 mg" data-testid="medication-strength-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-form">Form</Label>
              <Input id="med-form" value={form.form} onChange={(e) => set({ form: e.target.value })} placeholder="Tablet" data-testid="medication-form-input" />
            </div>
            <div className="space-y-1.5">
              <Label>Food instruction</Label>
              <Select value={form.instructions} onValueChange={(v: string) => set({ instructions: v })}>
                <SelectTrigger data-testid="medication-instructions-select">
                  <SelectValue>{INSTRUCTIONS_LABELS[form.instructions]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSTRUCTIONS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Criticality</Label>
              <Select value={form.criticality} onValueChange={(v: string) => set({ criticality: v })}>
                <SelectTrigger data-testid="medication-criticality-select">
                  <SelectValue>{form.criticality}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-stock">Stock (pills left)</Label>
              <Input id="med-stock" type="number" min={0} value={form.stock_count} onChange={(e) => set({ stock_count: e.target.value })} data-testid="medication-stock-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-refill">Refill alert (days left)</Label>
              <Input id="med-refill" type="number" min={0} value={form.refill_threshold_days} onChange={(e) => set({ refill_threshold_days: e.target.value })} data-testid="medication-refill-input" />
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <p className="mb-2 text-sm font-semibold">Schedule</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.frequency_type} onValueChange={(v: string) => set({ frequency_type: v })}>
                  <SelectTrigger data-testid="medication-frequency-select">
                    <SelectValue>{form.frequency_type}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Every day</SelectItem>
                    <SelectItem value="SPECIFIC_DAYS">Specific days</SelectItem>
                    <SelectItem value="INTERVAL">Every N days</SelectItem>
                    <SelectItem value="AS_NEEDED">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-start">Start date</Label>
                <Input id="med-start" type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} data-testid="medication-start-input" />
              </div>
              {form.frequency_type === "INTERVAL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="med-interval">Interval (days)</Label>
                  <Input id="med-interval" type="number" min={1} value={form.interval_days} onChange={(e) => set({ interval_days: e.target.value })} data-testid="medication-interval-input" />
                </div>
              )}
            </div>

            {form.frequency_type !== "AS_NEEDED" && (
              <div className="mt-3 space-y-2">
                <Label>Times of day</Label>
                {form.times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={t}
                      onChange={(e) => set({ times: form.times.map((x, j) => (j === i ? e.target.value : x)) })}
                      className="w-32"
                      data-testid={`medication-time-input-${i}`}
                    />
                    {form.times.length > 1 && (
                      <Button variant="ghost" size="icon-sm" aria-label="Remove time" data-testid={`medication-time-remove-${i}`} onClick={() => set({ times: form.times.filter((_, j) => j !== i) })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" data-testid="medication-time-add-button" onClick={() => set({ times: [...form.times, "20:00"] })}>
                  <Plus className="h-4 w-4" aria-hidden /> Add time
                </Button>
              </div>
            )}

            {form.frequency_type === "SPECIFIC_DAYS" && (
              <div className="mt-3">
                <Label>Days of week</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {DAYS.map((day, idx) => (
                    <label key={day} className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-sm" data-testid={`medication-day-${day.toLowerCase()}`}>
                      <Checkbox
                        checked={form.days_of_week.includes(idx)}
                        onCheckedChange={(checked) =>
                          set({
                            days_of_week: checked
                              ? [...form.days_of_week, idx].sort()
                              : form.days_of_week.filter((d) => d !== idx),
                          })
                        }
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-grace">Grace window (min)</Label>
                <Input id="med-grace" type="number" min={0} value={form.grace_minutes} onChange={(e) => set({ grace_minutes: e.target.value })} data-testid="medication-grace-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-lead">Reminder lead (min)</Label>
                <Input id="med-lead" type="number" min={0} value={form.lead_minutes} onChange={(e) => set({ lead_minutes: e.target.value })} data-testid="medication-lead-input" />
              </div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="space-y-2" data-testid="medication-interaction-warnings">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border p-3 text-sm"
                  style={{
                    background: w.severity === "HIGH" ? "#FEE2E2" : w.severity === "MEDIUM" ? "#FEF3C7" : "#F1F5F9",
                    borderColor: w.severity === "HIGH" ? "#FECACA" : w.severity === "MEDIUM" ? "#FDE68A" : "#E2E8F0",
                  }}
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" aria-hidden />
                  <span>
                    <strong>{w.with_medication}:</strong> {w.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {save.error && isChangeRequestRequired(save.error) && (
            <div className="space-y-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
              <p className="text-sm font-medium text-[#78350F]">Send as change request</p>
              <Textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Why is this change needed?"
                data-testid="change-request-note-input"
              />
              <Button size="sm" onClick={() => sendChangeRequest.mutate()} disabled={!medication || sendChangeRequest.isPending} data-testid="change-request-send-button">
                {sendChangeRequest.isPending ? "Sending…" : "Send to elder for approval"}
              </Button>
              {!medication && (
                <p className="text-xs text-[#92400E]">
                  New medicines need an elder or caretaker — propose edits to existing medicines here.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="medication-wizard-cancel-button">
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending} data-testid="medication-wizard-save-button">
            {save.isPending ? "Saving…" : isFamily ? "Propose change" : medication ? "Save changes" : "Add medication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
