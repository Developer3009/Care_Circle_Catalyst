import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Plus, TriangleAlert } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import { apiErrorMessage, fmtDateTime, relativeFromNow } from "@/lib/format";
import { apiGet, apiPost } from "@/lib/api";
import { can, ROLE_LABELS } from "@/lib/permissions";
import type { CareNoteOut, RoutineTaskOut, VitalOut } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const VITAL_LABELS: Record<string, string> = { BP: "Blood pressure", SUGAR: "Blood sugar", WEIGHT: "Weight", PULSE: "Pulse" };

function VitalsTab({ circleId, canAdd }: { circleId: string; canAdd: boolean }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("BP");
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");

  const vitalsQuery = useQuery({
    queryKey: ["vitals", circleId],
    queryFn: () => apiGet<VitalOut[]>(`/circles/${circleId}/vitals?limit=60`),
  });

  const add = useMutation({
    mutationFn: () =>
      apiPost<VitalOut>(`/circles/${circleId}/vitals`, {
        type,
        value: Number(value),
        secondary_value: type === "BP" && secondary ? Number(secondary) : null,
      }),
    onSuccess: (v) => {
      toast.success(v.alert ? `${VITAL_LABELS[v.type]} logged — out of range, the circle has been alerted.` : `${VITAL_LABELS[v.type]} logged.`);
      queryClient.invalidateQueries({ queryKey: ["vitals", circleId] });
      setValue("");
      setSecondary("");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const all = vitalsQuery.data ?? [];
  const bp = all.filter((v) => v.type === "BP").slice(0, 14).reverse();
  const sugar = all.filter((v) => v.type === "SUGAR").slice(0, 14).reverse();
  const chartData = (bp.length ? bp : sugar).map((v) => ({
    when: new Date(v.measured_at).toLocaleDateString([], { day: "numeric", month: "short" }),
    sys: v.type === "BP" ? v.value : undefined,
    dia: v.secondary_value ?? undefined,
    sugar: v.type === "SUGAR" ? v.value : undefined,
  }));

  return (
    <div className="space-y-4">
      {canAdd && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!value || Number.isNaN(Number(value))) {
              toast.error("Enter the measured value");
              return;
            }
            add.mutate();
          }}
          data-testid="vitals-add-form"
        >
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v: string) => setType(v)}>
              <SelectTrigger className="w-40" data-testid="vitals-type-select">
                <SelectValue>{VITAL_LABELS[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VITAL_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vital-value">{type === "BP" ? "Systolic" : "Value"}</Label>
            <Input id="vital-value" type="number" className="w-28" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "BP" ? "128" : "110"} data-testid="vitals-value-input" />
          </div>
          {type === "BP" && (
            <div className="space-y-1.5">
              <Label htmlFor="vital-dia">Diastolic</Label>
              <Input id="vital-dia" type="number" className="w-28" value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder="82" data-testid="vitals-diastolic-input" />
            </div>
          )}
          <Button type="submit" disabled={add.isPending} data-testid="vitals-add-button">Log reading</Button>
        </form>
      )}

      {vitalsQuery.isLoading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      ) : chartData.length > 0 ? (
        <div className="rounded-2xl border bg-card p-4" data-testid="vitals-chart-card">
          <p className="mb-2 text-sm font-semibold">{bp.length ? "Blood pressure (mmHg)" : "Blood sugar (mg/dL)"}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="when" fontSize={12} stroke="#52636F" />
              <YAxis fontSize={12} stroke="#52636F" />
              <Tooltip />
              {bp.length ? (
                <>
                  <Line type="monotone" dataKey="sys" name="Systolic" stroke="#116B70" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#52636F" strokeWidth={2} dot />
                  <ReferenceLine y={140} stroke="#B91C1C" strokeDasharray="4 4" label="140" />
                  <ReferenceLine y={90} stroke="#B45309" strokeDasharray="4 4" label="90" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="sugar" name="Sugar" stroke="#D97706" strokeWidth={2} dot />
                  <ReferenceLine y={140} stroke="#B91C1C" strokeDasharray="4 4" label="140" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div className="space-y-2" data-testid="vitals-list">
        {all.slice(0, 12).map((v) => (
          <div key={v.id} className={`flex items-center justify-between rounded-xl border bg-card p-3 ${v.alert ? "border-[#FECACA] bg-[#FFF7F7]" : ""}`} data-testid={`vital-row-${v.id}`}>
            <div>
              <p className="font-medium">
                {VITAL_LABELS[v.type]}: <strong>{v.value}{v.secondary_value !== null && v.secondary_value !== undefined ? `/${v.secondary_value}` : ""} {v.unit}</strong>
                {v.alert && (
                  <Badge variant="destructive" className="ml-2" data-testid={`vital-alert-${v.id}`}>
                    <TriangleAlert className="mr-1 h-3 w-3" aria-hidden /> out of range
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{fmtDateTime(v.measured_at)} · {v.recorded_by_name}</p>
            </div>
          </div>
        ))}
        {all.length === 0 && !vitalsQuery.isLoading && <p className="text-sm text-muted-foreground">No vitals logged yet.</p>}
      </div>
    </div>
  );
}

function RoutineTab({ circleId, canManage, canComplete }: { circleId: string; canManage: boolean; canComplete: boolean }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const tasksQuery = useQuery({
    queryKey: ["tasks", circleId],
    queryFn: () => apiGet<RoutineTaskOut[]>(`/circles/${circleId}/tasks`),
  });
  const complete = useMutation({
    mutationFn: (id: string) => apiPost<RoutineTaskOut>(`/circles/${circleId}/tasks/${id}/complete`),
    onSuccess: (t) => {
      toast.success(`"${t.title}" checked off`);
      queryClient.invalidateQueries({ queryKey: ["tasks", circleId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
  const create = useMutation({
    mutationFn: () => apiPost<RoutineTaskOut>(`/circles/${circleId}/tasks`, { title: title.trim(), schedule: "Daily" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", circleId] });
      setTitle("");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-3">
      {canManage && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (title.trim().length >= 2) create.mutate(); }} data-testid="task-add-form">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a routine task — e.g. Evening walk" data-testid="task-title-input" />
          <Button type="submit" disabled={create.isPending} data-testid="task-add-button">
            <Plus className="h-4 w-4" aria-hidden /> Add
          </Button>
        </form>
      )}
      {(tasksQuery.data ?? []).map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-xl border bg-card p-3" data-testid={`task-row-${t.id}`}>
          <div>
            <p className="font-medium">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {t.schedule} · {t.last_completed_at ? `done ${relativeFromNow(t.last_completed_at)}` : "not done yet"}
            </p>
          </div>
          {canComplete && (
            <Button variant="outline" size="sm" onClick={() => complete.mutate(t.id)} disabled={complete.isPending} data-testid={`task-complete-${t.id}`}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Done
            </Button>
          )}
        </div>
      ))}
      {tasksQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">No routine tasks yet.</p>}
    </div>
  );
}

function NotesTab({ circleId, canAdd }: { circleId: string; canAdd: boolean }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const notesQuery = useQuery({
    queryKey: ["notes", circleId],
    queryFn: () => apiGet<CareNoteOut[]>(`/circles/${circleId}/notes`),
  });
  const add = useMutation({
    mutationFn: () => apiPost<CareNoteOut>(`/circles/${circleId}/notes`, { body: body.trim(), tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    onSuccess: () => {
      toast.success("Note added to the circle feed");
      queryClient.invalidateQueries({ queryKey: ["notes", circleId] });
      setBody("");
      setTags("");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      {canAdd && (
        <form
          className="space-y-2 rounded-2xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim().length >= 2) add.mutate();
          }}
          data-testid="note-add-form"
        >
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Shift handover or an observation — e.g. “Appetite low since yesterday”" data-testid="note-body-input" />
          <div className="flex gap-2">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated — fell last night, appetite low" data-testid="note-tags-input" />
            <Button type="submit" disabled={add.isPending} data-testid="note-add-button">Post note</Button>
          </div>
        </form>
      )}
      <div className="space-y-3" data-testid="notes-feed">
        {(notesQuery.data ?? []).map((n) => (
          <div key={n.id} className="rounded-2xl border bg-card p-4" data-testid={`note-card-${n.id}`}>
            <p>{n.body}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">{n.author_name}</span>
              <span>· {ROLE_LABELS[n.author_role] ?? n.author_role}</span>
              <span>· {fmtDateTime(n.created_at)}</span>
              {n.tags.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>
              ))}
            </div>
          </div>
        ))}
        {notesQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">No notes yet — the caretaker’s handover lives here.</p>}
      </div>
    </div>
  );
}

export default function HealthLog() {
  const { circle, role } = useApp();
  if (!circle) return <NoCircle />;
  return (
    <div className="space-y-6 p-4 md:p-8" data-testid="health-log-page">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Health log</h1>
        <p className="text-sm text-muted-foreground">Vitals with out-of-range alerts, daily routine and the care-notes feed.</p>
      </div>
      <Tabs defaultValue="vitals">
        <TabsList data-testid="health-tabs">
          <TabsTrigger value="vitals" data-testid="health-tab-vitals">Vitals</TabsTrigger>
          <TabsTrigger value="routine" data-testid="health-tab-routine">Routine</TabsTrigger>
          <TabsTrigger value="notes" data-testid="health-tab-notes">Care notes</TabsTrigger>
        </TabsList>
        <TabsContent value="vitals">
          <VitalsTab circleId={circle.id} canAdd={can({ role, permissions: {} }, "add_vitals")} />
        </TabsContent>
        <TabsContent value="routine">
          <RoutineTab circleId={circle.id} canManage={can({ role, permissions: {} }, "manage_tasks")} canComplete={can({ role, permissions: {} }, "log_doses")} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab circleId={circle.id} canAdd={can({ role, permissions: {} }, "add_notes")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
