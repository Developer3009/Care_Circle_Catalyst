import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Plus, Stethoscope, XCircle } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import { apiErrorMessage, fmtDateTime } from "@/lib/format";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { AppointmentOut, DoctorOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

function AppointmentDialog({ circleId, doctors }: { circleId: string; doctors: DoctorOut[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [doctorId, setDoctorId] = useState("none");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: () =>
      apiPost<AppointmentOut>(`/circles/${circleId}/appointments`, {
        title: title.trim(),
        doctor_id: doctorId === "none" ? null : doctorId,
        scheduled_at: new Date(when).toISOString(),
        location: location.trim(),
        notes: notes.trim(),
      }),
    onSuccess: () => {
      toast.success("Appointment added — the circle will be reminded.");
      queryClient.invalidateQueries({ queryKey: ["appointments", circleId] });
      setOpen(false);
      setTitle("");
      setWhen("");
      setLocation("");
      setNotes("");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-testid="appointment-add-button" />}>
        <Plus className="h-4 w-4" aria-hidden /> Add appointment
      </DialogTrigger>
      <DialogContent data-testid="appointment-dialog">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>Doctor visits, tests, follow-ups — anything with a time and place.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="appt-title">Title</Label>
            <Input id="appt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cardiology follow-up" data-testid="appointment-title-input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Doctor</Label>
              <Select value={doctorId} onValueChange={(v: string) => setDoctorId(v)}>
                <SelectTrigger data-testid="appointment-doctor-select">
                  <SelectValue>{doctorId === "none" ? "No doctor chosen" : doctors.find((d) => d.id === doctorId)?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No doctor chosen</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.speciality ? `· ${d.speciality}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-when">When</Label>
              <Input id="appt-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} data-testid="appointment-when-input" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-location">Location</Label>
            <Input id="appt-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ruby Hall Clinic, Pune" data-testid="appointment-location-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-notes">Notes</Label>
            <Textarea id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Fasting required, bring reports…" data-testid="appointment-notes-input" />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!title.trim() || !when) {
                toast.error("Title and time are required");
                return;
              }
              create.mutate();
            }}
            disabled={create.isPending}
            data-testid="appointment-save-button"
          >
            {create.isPending ? "Saving…" : "Add appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDoctorDialog({ circleId }: { circleId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [phone, setPhone] = useState("");

  const create = useMutation({
    mutationFn: () => apiPost<DoctorOut>(`/circles/${circleId}/doctors`, { name: name.trim(), speciality: speciality.trim(), phone: phone.trim() }),
    onSuccess: () => {
      toast.success("Doctor saved");
      queryClient.invalidateQueries({ queryKey: ["doctors", circleId] });
      setOpen(false);
      setName("");
      setSpeciality("");
      setPhone("");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" data-testid="doctor-add-button" />}>Add doctor</DialogTrigger>
      <DialogContent data-testid="doctor-dialog">
        <DialogHeader>
          <DialogTitle>Add a doctor</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doctor-name">Name</Label>
            <Input id="doctor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Anita Mehta" data-testid="doctor-name-input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doctor-speciality">Speciality</Label>
              <Input id="doctor-speciality" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="Cardiology" data-testid="doctor-speciality-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doctor-phone">Phone</Label>
              <Input id="doctor-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" data-testid="doctor-phone-input" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => (name.trim().length >= 2 ? create.mutate() : toast.error("Name is required"))} disabled={create.isPending} data-testid="doctor-save-button">
            Save doctor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Appointments + doctors.
export default function Appointments() {
  const { circle, role } = useApp();
  const circleId = circle?.id ?? null;
  const queryClient = useQueryClient();

  const apptsQuery = useQuery({
    queryKey: ["appointments", circleId, "all"],
    queryFn: () => apiGet<AppointmentOut[]>(`/circles/${circleId}/appointments?scope=all`),
    enabled: !!circleId,
  });
  const doctorsQuery = useQuery({
    queryKey: ["doctors", circleId],
    queryFn: () => apiGet<DoctorOut[]>(`/circles/${circleId}/doctors`),
    enabled: !!circleId,
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch<AppointmentOut>(`/circles/${circleId}/appointments/${id}`, { status }),
    onSuccess: (a) => {
      toast.success(a.status === "COMPLETED" ? "Marked completed" : "Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["appointments", circleId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!circle) return <NoCircle />;

  const appts = apptsQuery.data ?? [];
  const doctors = doctorsQuery.data ?? [];
  const now = Date.now();
  const upcoming = appts.filter((a) => a.status !== "CANCELLED" && new Date(a.scheduled_at).getTime() >= now);
  const past = appts.filter((a) => a.status === "CANCELLED" || new Date(a.scheduled_at).getTime() < now);
  const editable = can({ role, permissions: {} }, "edit_appointments");

  const renderRow = (a: AppointmentOut, isPast: boolean) => (
    <div key={a.id} className={`rounded-2xl border bg-card p-4 ${a.status === "CANCELLED" ? "opacity-50" : ""}`} data-testid={`appointment-card-${a.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold" data-testid={`appointment-title-${a.id}`}>
            {a.title} {a.status === "CANCELLED" && <span className="text-xs uppercase text-[#B91C1C]">· cancelled</span>}
          </p>
          <p className="text-sm text-muted-foreground" data-testid={`appointment-when-${a.id}`}>{fmtDateTime(a.scheduled_at)}</p>
          <p className="text-sm text-muted-foreground">
            {a.doctor_name}
            {a.location ? ` · ${a.location}` : ""}
          </p>
          {a.notes && <p className="mt-1 text-sm text-muted-foreground">{a.notes}</p>}
        </div>
        {editable && !isPast && a.status === "SCHEDULED" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => update.mutate({ id: a.id, status: "COMPLETED" })} data-testid={`appointment-complete-${a.id}`}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Done
            </Button>
            <Button variant="ghost" size="sm" onClick={() => update.mutate({ id: a.id, status: "CANCELLED" })} data-testid={`appointment-cancel-${a.id}`}>
              <XCircle className="h-3.5 w-3.5" aria-hidden /> Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8" data-testid="appointments-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Appointments</h1>
          <p className="text-sm text-muted-foreground">Visits, tests and follow-ups for the elder.</p>
        </div>
        {editable && <AppointmentDialog circleId={circle.id} doctors={doctors} />}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList data-testid="appointments-tabs">
          <TabsTrigger value="upcoming" data-testid="appointments-tab-upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past" data-testid="appointments-tab-past">Past & cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-3">
          {apptsQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          ) : upcoming.length === 0 ? (
            <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground" data-testid="appointments-upcoming-empty">
              Nothing scheduled — add the next visit when you have it.
            </p>
          ) : (
            upcoming.map((a) => renderRow(a, false))
          )}
        </TabsContent>
        <TabsContent value="past" className="space-y-3">
          {past.length === 0 ? (
            <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">No past appointments yet.</p>
          ) : (
            past.map((a) => renderRow(a, true))
          )}
        </TabsContent>
      </Tabs>

      <div className="rounded-2xl border bg-card p-5" data-testid="doctors-card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Stethoscope className="h-5 w-5 text-primary" aria-hidden /> Doctors
          </h2>
          {editable && <AddDoctorDialog circleId={circle.id} />}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {doctors.map((d) => (
            <div key={d.id} className="rounded-xl border p-3" data-testid={`doctor-card-${d.id}`}>
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-muted-foreground">{[d.speciality, d.clinic].filter(Boolean).join(" · ")}</p>
              {d.phone && <p className="text-sm text-muted-foreground">{d.phone}</p>}
            </div>
          ))}
          {doctors.length === 0 && <p className="text-sm text-muted-foreground">No doctors saved yet.</p>}
        </div>
      </div>
    </div>
  );
}
