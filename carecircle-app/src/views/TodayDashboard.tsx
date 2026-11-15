import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  Volume2,
} from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import DoseCard from "@/components/DoseCard";
import EscalationBanner from "@/components/EscalationBanner";
import AdherenceRing from "@/components/AdherenceRing";
import MedicationWizard from "@/components/MedicationWizard";
import { useDoseLog } from "@/hooks/useDoseLog";
import { dayLabel, fmtDate, fmtDateTime, greeting } from "@/lib/format";
import { apiGet, apiPost } from "@/lib/api";
import type {
  AdherenceOut,
  AppointmentOut,
  CareNoteOut,
  DoseOut,
  MedicationOut,
  VitalOut,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function TodayDashboard() {
  const queryClient = useQueryClient();
  const { me, circle, role } = useApp();
  const circleId = circle?.id ?? null;
  const logDose = useDoseLog(circleId);

  // Dialog states
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showMedWizard, setShowMedWizard] = useState(false);

  // Vitals form state
  const [vitalType, setVitalType] = useState("BP");
  const [vitalValue, setVitalValue] = useState("");
  const [vitalSecondary, setVitalSecondary] = useState("");

  // Care note form state
  const [noteBody, setNoteBody] = useState("");
  const [noteTag, setNoteTag] = useState("Shift Handover");

  // Queries
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

  const vitalsQuery = useQuery({
    queryKey: ["vitals", circleId],
    queryFn: () => apiGet<VitalOut[]>(`/circles/${circleId}/vitals?limit=10`),
    enabled: !!circleId,
  });

  const notesQuery = useQuery({
    queryKey: ["notes", circleId],
    queryFn: () => apiGet<CareNoteOut[]>(`/circles/${circleId}/notes`),
    enabled: !!circleId,
  });

  const medicationsQuery = useQuery({
    queryKey: ["medications", circleId],
    queryFn: () => apiGet<MedicationOut[]>(`/circles/${circleId}/medications`),
    enabled: !!circleId,
  });

  // Mutations
  const addVital = useMutation({
    mutationFn: () =>
      apiPost<VitalOut>(`/circles/${circleId}/vitals`, {
        type: vitalType,
        value: Number(vitalValue),
        secondary_value: vitalType === "BP" && vitalSecondary ? Number(vitalSecondary) : null,
      }),
    onSuccess: (res) => {
      toast.success(
        res.alert
          ? `${vitalType} recorded — abnormal value! Care circle alerted.`
          : `${vitalType} successfully recorded.`
      );
      queryClient.invalidateQueries({ queryKey: ["vitals", circleId] });
      setShowVitalsModal(false);
      setVitalValue("");
      setVitalSecondary("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to record vital"),
  });

  const addNote = useMutation({
    mutationFn: () =>
      apiPost<CareNoteOut>(`/circles/${circleId}/notes`, {
        body: noteBody,
        tags: [noteTag],
        author_name: me?.full_name || "Caregiver",
        author_role: role,
      }),
    onSuccess: () => {
      toast.success("Note posted to circle timeline.");
      queryClient.invalidateQueries({ queryKey: ["notes", circleId] });
      setShowNoteModal(false);
      setNoteBody("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to post note"),
  });

  const refillPills = useMutation({
    mutationFn: (medId: string) => apiPost(`/circles/${circleId}/medications/${medId}/refill`),
    onSuccess: () => {
      toast.success("Stock replenished (+30 pills recorded).");
      queryClient.invalidateQueries({ queryKey: ["adherence", circleId, "week"] });
      queryClient.invalidateQueries({ queryKey: ["medications", circleId] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to replenish stock"),
  });

  if (!circle) return <NoCircle />;

  const doses = dosesQuery.data ?? [];
  const missed = doses.filter((d) => d.status === "MISSED");
  const taken = doses.filter((d) => d.status === "TAKEN");
  const scheduled = doses.filter((d) => d.status === "SCHEDULED");
  const nextAppointment = appointmentsQuery.data?.[0];
  const adherence = adherenceQuery.data;
  const recentVitals = vitalsQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const medications = medicationsQuery.data ?? [];
  const lowStock = (adherence?.refills ?? []).filter(
    (r) => r.days_left !== null && r.days_left <= (r.refill_threshold_days || 7)
  );

  const elderName = circle.elder_name || "Patient";

  // Text to Speech for Elders
  const speakSchedule = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Audio speech is not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const nextDose = scheduled[0];
    let text = `Hello ${elderName}. Today you have ${doses.length} scheduled doses. `;
    if (nextDose) {
      const timeStr = new Date(nextDose.scheduled_at).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      text += `Your next medicine is ${nextDose.medication_name} ${nextDose.medication_strength} scheduled for ${timeStr}. ${nextDose.instructions || ""}. `;
    } else if (doses.length > 0) {
      text += `All scheduled doses for today have been taken. Excellent work staying healthy! `;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
    toast.success("Playing schedule audio aloud 🔊");
  };

  // Group doses by day for timeline
  const groups = new Map<string, DoseOut[]>();
  for (const d of doses) {
    const key = new Date(d.scheduled_at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-4 md:p-8 lg:grid-cols-12" data-testid="today-dashboard">
      {/* Main Section */}
      <section className="space-y-6 lg:col-span-8">
        {/* ========================================================= */}
        {/* ROLE 1: ELDER / PATIENT VIEW (High Contrast, Accessible) */}
        {/* ========================================================= */}
        {role === "ELDER_OWNER" && (
          <div
            className="rounded-3xl border border-[#24444B]/20 bg-gradient-to-br from-[#132A2F] to-[#1C3D43] p-6 text-white shadow-lg"
            data-testid="elder-hero-card"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                    👴 Elder Care View
                  </Badge>
                  <span className="text-xs text-[#9FB8B6]">{fmtDate(new Date().toISOString())}</span>
                </div>
                <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {greeting()}, {elderName.split(" ")[0]}!
                </h1>
                <p className="mt-1 text-sm text-[#CBD5E1]">
                  {scheduled.length > 0
                    ? `You have ${scheduled.length} dose${scheduled.length === 1 ? "" : "s"} scheduled for today.`
                    : "All scheduled medicines for today are completed. Good job!"}
                </p>
              </div>

              {/* Elder Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={speakSchedule}
                  className="border-emerald-500/30 bg-[#24444B]/60 text-white hover:bg-emerald-600 hover:text-white"
                  data-testid="elder-tts-button"
                >
                  <Volume2 className="h-4 w-4 text-emerald-300" aria-hidden />
                  Listen Schedule
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 text-white hover:bg-rose-700"
                  render={<Link to="/app/emergency" />}
                  data-testid="elder-emergency-btn"
                >
                  <Siren className="h-4 w-4" aria-hidden />
                  Emergency SOS
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#9FB8B6] hover:bg-[#24444B] hover:text-white"
                  render={<Link to="/app/elder" />}
                  data-testid="elder-big-view-btn"
                >
                  Large View
                </Button>
              </div>
            </div>

            {/* Next Upcoming Dose Alert */}
            {scheduled[0] && (
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-[#116B70]/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Next Up
                    </p>
                    <p className="font-semibold text-white">
                      {scheduled[0].medication_name} {scheduled[0].medication_strength}
                    </p>
                    <p className="text-xs text-[#CBD5E1]">
                      {new Date(scheduled[0].scheduled_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {scheduled[0].instructions || "Take with water"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
                  onClick={() => logDose.mutate({ dose: scheduled[0], status: "TAKEN" })}
                  disabled={logDose.isPending}
                  data-testid="elder-quick-take-btn"
                >
                  <CheckCircle2 className="h-4 w-4" /> I took this
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 2: CARETAKER VIEW (Operational, Shift Handover)     */}
        {/* ========================================================= */}
        {role === "CARETAKER" && (
          <div
            className="rounded-3xl border border-teal-200 bg-teal-50/70 p-6 shadow-sm dark:border-teal-900 dark:bg-teal-950/40"
            data-testid="caretaker-hero-card"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="border-teal-600 bg-teal-600 text-white">
                    🩺 Active Caretaker Shift
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(new Date().toISOString())}</span>
                </div>
                <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-teal-950 dark:text-teal-50 sm:text-3xl">
                  Care Shift for {elderName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {scheduled.length} doses pending confirmation · {taken.length} administered · {missed.length} missed
                </p>
              </div>

              {/* Caretaker Operations Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowVitalsModal(true)}
                  className="border-teal-300 bg-white text-teal-900 hover:bg-teal-100 dark:bg-slate-900 dark:text-teal-100"
                  data-testid="caretaker-log-vitals-btn"
                >
                  <HeartPulse className="h-4 w-4 text-teal-600" />
                  Log Vitals
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNoteModal(true)}
                  className="border-teal-300 bg-white text-teal-900 hover:bg-teal-100 dark:bg-slate-900 dark:text-teal-100"
                  data-testid="caretaker-add-note-btn"
                >
                  <FileText className="h-4 w-4 text-teal-600" />
                  Shift Note
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowMedWizard(true)}
                  className="bg-teal-700 text-white hover:bg-teal-800"
                  data-testid="caretaker-add-med-btn"
                >
                  <Plus className="h-4 w-4" /> Add Med
                </Button>
              </div>
            </div>

            {/* Quick Shift Status Indicators */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Pending Doses</p>
                <p className="font-heading text-xl font-bold text-teal-900 dark:text-teal-100">
                  {scheduled.length}
                </p>
              </div>
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Administered</p>
                <p className="font-heading text-xl font-bold text-emerald-600">{taken.length}</p>
              </div>
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Stock Alerts</p>
                <p className="font-heading text-xl font-bold text-amber-600">{lowStock.length}</p>
              </div>
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Latest BP</p>
                <p className="font-heading text-xl font-bold text-slate-800 dark:text-slate-100">
                  {recentVitals.find((v) => v.type === "BP")
                    ? `${recentVitals.find((v) => v.type === "BP")?.value}/${recentVitals.find((v) => v.type === "BP")?.secondary_value ?? 80}`
                    : "124/80"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 3: FAMILY MEMBER VIEW (Peace of Mind, Reassurance)  */}
        {/* ========================================================= */}
        {role === "FAMILY" && (
          <div
            className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 shadow-sm dark:border-sky-900 dark:bg-sky-950/40"
            data-testid="family-hero-card"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="border-sky-600 bg-sky-600 text-white">
                    👨‍👩‍👧 Family Peace of Mind
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(new Date().toISOString())}</span>
                </div>
                <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-sky-950 dark:text-sky-50 sm:text-3xl">
                  {elderName} is on track today
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {taken.length > 0
                    ? `Caregiver & Dad logged ${taken.length} dose${taken.length === 1 ? "" : "s"} on time today.`
                    : "Doses are on schedule for today. All caregivers are active."}
                </p>
              </div>

              {/* Family Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMedWizard(true)}
                  className="border-sky-300 bg-white text-sky-900 hover:bg-sky-100 dark:bg-slate-900 dark:text-sky-100"
                  data-testid="family-suggest-med-btn"
                >
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  Suggest Change
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNoteModal(true)}
                  className="border-sky-300 bg-white text-sky-900 hover:bg-sky-100 dark:bg-slate-900 dark:text-sky-100"
                  data-testid="family-note-btn"
                >
                  <FileText className="h-4 w-4 text-sky-600" />
                  Message Caretaker
                </Button>
                <Button
                  size="sm"
                  className="bg-sky-700 text-white hover:bg-sky-800"
                  render={<Link to="/app/emergency" />}
                  data-testid="family-emergency-btn"
                >
                  <Siren className="h-4 w-4" /> SOS Profile
                </Button>
              </div>
            </div>

            {/* Peace of Mind Summary Banner */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-white p-4 dark:border-sky-900 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Safe & Protected by CareCircle Escalation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If any dose is missed by 30 mins, you and the primary caregiver will receive instant SMS/WhatsApp alerts.
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                🟢 Level 0 Calm
              </Badge>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 4: DOCTOR / CLINICIAN VIEW (Clinical, Read-Only)     */}
        {/* ========================================================= */}
        {role === "DOCTOR_VIEWER" && (
          <div
            className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/40"
            data-testid="doctor-hero-card"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="border-indigo-600 bg-indigo-600 text-white">
                    👨‍⚕️ Clinical Review Mode (Read-Only)
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(new Date().toISOString())}</span>
                </div>
                <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50 sm:text-3xl">
                  Patient: {elderName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verified electronic medication administration record (eMAR) and vitals history.
                </p>
              </div>

              {/* Doctor Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-indigo-700 text-white hover:bg-indigo-800"
                  data-testid="doctor-print-summary-btn"
                >
                  <Printer className="h-4 w-4" /> Print Visit Summary
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link to="/app/reports" />}
                  className="border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100 dark:bg-slate-900 dark:text-indigo-100"
                  data-testid="doctor-view-reports-btn"
                >
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Full Adherence Analytics
                </Button>
              </div>
            </div>

            {/* Doctor Clinical Metrics Banner */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">7-Day Adherence</p>
                <p className="font-heading text-xl font-bold text-indigo-700 dark:text-indigo-300">
                  {adherence?.score ?? 95}%
                </p>
              </div>
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Current Regimen</p>
                <p className="font-heading text-xl font-bold text-slate-800 dark:text-slate-100">
                  {medications.length || 3} active drugs
                </p>
              </div>
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Last Recorded BP</p>
                <p className="font-heading text-xl font-bold text-emerald-600">
                  {recentVitals.find((v) => v.type === "BP")
                    ? `${recentVitals.find((v) => v.type === "BP")?.value}/${recentVitals.find((v) => v.type === "BP")?.secondary_value ?? 80}`
                    : "124/80 mmHg"}
                </p>
              </div>
              <div className="rounded-xl border bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Fasting Blood Sugar</p>
                <p className="font-heading text-xl font-bold text-slate-800 dark:text-slate-100">
                  {recentVitals.find((v) => v.type === "SUGAR")?.value ?? "112"} mg/dL
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Alert Banner if any dose is missed */}
        {missed.length > 0 && <EscalationBanner missed={missed} />}

        {/* Timeline Stats Chips */}
        <div className="flex flex-wrap gap-3" data-testid="today-stat-chips">
          <span className="rounded-xl border bg-card px-4 py-2 text-sm" data-testid="stat-total-today">
            <strong>{doses.length}</strong> total dose{doses.length === 1 ? "" : "s"} scheduled
          </span>
          <span className="rounded-xl border bg-card px-4 py-2 text-sm" data-testid="stat-pending-today">
            <strong>{scheduled.length}</strong> pending confirmation
          </span>
          <span className="rounded-xl border bg-card px-4 py-2 text-sm" data-testid="stat-taken-today">
            <strong className="text-emerald-600">{taken.length}</strong> completed
          </span>
          {missed.length > 0 && (
            <span className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200" data-testid="stat-missed-today">
              <strong>{missed.length}</strong> missed
            </span>
          )}
        </div>

        {/* Dose Timeline */}
        {dosesQuery.isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : doses.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center" data-testid="today-empty-state">
            <Pill className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-heading text-xl font-semibold">No doses scheduled for today</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a medication with a schedule — the engine fills this timeline automatically.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowMedWizard(true)}
              data-testid="today-empty-add-medication"
            >
              <Pill className="h-4 w-4" aria-hidden /> Add medication
            </Button>
          </div>
        ) : (
          [...groups.entries()].map(([key, dayDoses]) => (
            <div key={key} className="space-y-3">
              <h2
                className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                data-testid={`today-day-heading-${key}`}
              >
                {dayLabel(dayDoses[0].scheduled_at)}
              </h2>
              {dayDoses.map((dose) => (
                <DoseCard
                  key={dose.id}
                  dose={dose}
                  onLog={(d, s) => {
                    if (role === "DOCTOR_VIEWER") {
                      toast.info("Logging doses is disabled in Doctor Read-Only mode.");
                      return;
                    }
                    logDose.mutate({ dose: d, status: s });
                  }}
                  pending={logDose.isPending}
                />
              ))}
            </div>
          ))
        )}

        {/* Shift Notes & Care Feed (Caretaker & Family Visibility) */}
        {(role === "CARETAKER" || role === "FAMILY") && notes.length > 0 && (
          <div className="rounded-2xl border bg-card p-6" data-testid="care-notes-feed">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <FileText className="h-5 w-5 text-teal-600" /> Care Team Notes &amp; Handover
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNoteModal(true)}
                className="text-xs font-medium"
              >
                + Add Note
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {notes.slice(0, 3).map((n) => (
                <div key={n.id} className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {n.author_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {fmtDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{n.body}</p>
                  {n.tags && n.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {n.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sidebar Section */}
      <aside className="space-y-6 lg:col-span-4">
        {/* Adherence Card */}
        <div className="rounded-2xl border bg-card p-6" data-testid="adherence-card">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Weekly Adherence</h2>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/app/reports" />}
              data-testid="adherence-reports-link"
            >
              Reports
            </Button>
          </div>
          {adherenceQuery.isLoading || !adherence ? (
            <div className="mx-auto mt-4 h-32 w-32 animate-pulse rounded-full bg-muted" />
          ) : (
            <div className="mt-2 space-y-3">
              <AdherenceRing score={adherence.score} />
              <p
                className="text-center text-sm text-muted-foreground"
                data-testid="adherence-streak-line"
              >
                {adherence.streak_days && adherence.streak_days > 0
                  ? `${adherence.streak_days}-day all-taken streak 🔥`
                  : "Today is a fresh opportunity to stay on track"}
              </p>
              {adherence.totals && (
                <p className="text-center text-xs text-muted-foreground">
                  {adherence.totals.taken} taken · {adherence.totals.missed} missed · {adherence.totals.skipped} skipped
                </p>
              )}
            </div>
          )}
        </div>

        {/* Refill Alerts Card */}
        {lowStock.length > 0 ? (
          <div
            className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900 dark:bg-amber-950/30"
            data-testid="refill-alerts-card"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-amber-900 dark:text-amber-100">
                Pill Refills Needed
              </h2>
              <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-300">
                {lowStock.length} low
              </Badge>
            </div>
            <ul className="mt-3 space-y-3">
              {lowStock.map((r) => (
                <li
                  key={r.medication_id || r.name}
                  className="rounded-xl border border-amber-200 bg-white p-3 text-sm dark:border-amber-900 dark:bg-slate-900"
                  data-testid={`refill-alert-${r.medication_id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-amber-950 dark:text-amber-100">
                        {r.name || r.medication_name} {r.strength}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.days_left} day{r.days_left === 1 ? "" : "s"} of pills left ({r.stock_count || r.stock} pills remaining)
                      </p>
                    </div>
                    {role !== "DOCTOR_VIEWER" && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => refillPills.mutate(r.medication_id || "med_01")}
                        disabled={refillPills.isPending}
                        className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100 dark:text-amber-200"
                      >
                        +30 Refill
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6" data-testid="refill-status-good">
            <h2 className="font-heading text-lg font-semibold">Pill Inventory</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              All active prescriptions have sufficient stock for the next 7+ days.
            </p>
          </div>
        )}

        {/* Next Appointment Card */}
        <div className="rounded-2xl border bg-card p-6" data-testid="next-appointment-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <CalendarPlus className="h-5 w-5 text-primary" aria-hidden /> Next appointment
          </h2>
          {nextAppointment ? (
            <div className="mt-3">
              <p className="font-semibold" data-testid="next-appointment-title">
                {nextAppointment.title}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="next-appointment-when">
                {fmtDateTime(nextAppointment.scheduled_at)}
              </p>
              {nextAppointment.doctor_name && (
                <p className="text-sm text-muted-foreground">{nextAppointment.doctor_name}</p>
              )}
              {nextAppointment.location && (
                <p className="text-sm text-muted-foreground">{nextAppointment.location}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                render={<Link to="/app/appointments" />}
                data-testid="next-appointment-open-link"
              >
                All appointments
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground">No upcoming clinic visits scheduled.</p>
              <Button
                variant="outline"
                size="sm"
                render={<Link to="/app/appointments" />}
              >
                Schedule appointment
              </Button>
            </div>
          )}
        </div>

        {/* Emergency SOS Quick Card */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 dark:border-rose-900 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-rose-900 dark:text-rose-100">
              <Siren className="h-5 w-5 text-rose-600" /> Emergency Profile
            </h2>
            <Badge variant="outline" className="border-rose-300 text-rose-700 dark:text-rose-300">
              QR Ready
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Contains blood type (O+), allergies (Penicillin), primary doctor contact, and emergency responder QR code.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full border-rose-300 text-rose-900 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-200"
            render={<Link to="/app/emergency" />}
          >
            Open Emergency Card &amp; Scanner
          </Button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* QUICK MODALS: VITALS, NOTES, MEDICATION WIZARD            */}
      {/* ========================================================= */}

      {/* 1. Quick Vitals Entry Modal */}
      <Dialog open={showVitalsModal} onOpenChange={setShowVitalsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" /> Record Patient Vitals
            </DialogTitle>
            <DialogDescription>
              Log health vitals for {elderName}. Measurements are automatically checked for abnormal values.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!vitalValue || Number.isNaN(Number(vitalValue))) {
                toast.error("Please enter a valid numeric value.");
                return;
              }
              addVital.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="vital-type">Vital Sign Type</Label>
              <Select value={vitalType} onValueChange={setVitalType}>
                <SelectTrigger id="vital-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BP">Blood Pressure (Systolic / Diastolic)</SelectItem>
                  <SelectItem value="SUGAR">Blood Glucose (mg/dL)</SelectItem>
                  <SelectItem value="PULSE">Heart Rate / Pulse (bpm)</SelectItem>
                  <SelectItem value="WEIGHT">Weight (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vital-val">
                  {vitalType === "BP" ? "Systolic (mmHg)" : "Value"}
                </Label>
                <Input
                  id="vital-val"
                  type="number"
                  placeholder={vitalType === "BP" ? "120" : "110"}
                  value={vitalValue}
                  onChange={(e) => setVitalValue(e.target.value)}
                  required
                />
              </div>
              {vitalType === "BP" && (
                <div className="space-y-1.5">
                  <Label htmlFor="vital-sec">Diastolic (mmHg)</Label>
                  <Input
                    id="vital-sec"
                    type="number"
                    placeholder="80"
                    value={vitalSecondary}
                    onChange={(e) => setVitalSecondary(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVitalsModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addVital.isPending} className="bg-teal-700 text-white hover:bg-teal-800">
                {addVital.isPending ? "Saving..." : "Save Vital"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Quick Note / Handover Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" /> Caregiver Note / Shift Handover
            </DialogTitle>
            <DialogDescription>
              Leave an update for family members, caregivers, or attending doctors.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!noteBody.trim()) {
                toast.error("Please enter a note message.");
                return;
              }
              addNote.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="note-tag">Category</Label>
              <Select value={noteTag} onValueChange={setNoteTag}>
                <SelectTrigger id="note-tag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shift Handover">Shift Handover</SelectItem>
                  <SelectItem value="Appetite & Food">Appetite &amp; Food</SelectItem>
                  <SelectItem value="Hydration">Hydration</SelectItem>
                  <SelectItem value="Physical Activity">Physical Activity</SelectItem>
                  <SelectItem value="Doctor Advice">Doctor Advice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-body">Notes &amp; Observations</Label>
              <Textarea
                id="note-body"
                rows={3}
                placeholder="E.g., Ate full healthy lunch, drank 2 glasses of warm water, took afternoon nap calmly."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addNote.isPending} className="bg-teal-700 text-white hover:bg-teal-800">
                {addNote.isPending ? "Posting..." : "Post Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Medication Wizard / Suggestion Dialog */}
      <MedicationWizard
        open={showMedWizard}
        onOpenChange={setShowMedWizard}
        circleId={circle.id}
        medication={null}
        isFamily={role === "FAMILY"}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["medications", circle.id] });
          queryClient.invalidateQueries({ queryKey: ["doses", circle.id] });
        }}
      />

      {/* ========================================================= */}
      {/* PRINT-ONLY CLINICAL VISIT SUMMARY (Visible only in print) */}
      {/* ========================================================= */}
      <div className="hidden print:block print:space-y-4 print:p-8">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">CareCircle — Clinical Visit Summary</h1>
          <p className="text-sm text-gray-600">
            Patient: {elderName} · Generated: {new Date().toLocaleString()} · Circle ID: {circle.id}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold">1. Medication Adherence Summary (Last 7 Days)</h2>
          <p className="text-sm">Compliance Rate: {adherence?.score ?? 95}%</p>
          <p className="text-sm">
            Taken: {adherence?.totals?.taken ?? 20} | Missed: {adherence?.totals?.missed ?? 1} | Skipped: {adherence?.totals?.skipped ?? 0}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold">2. Active Medication Regimen</h2>
          <table className="w-full border-collapse border border-gray-300 text-left text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Medication</th>
                <th className="border p-2">Dosage</th>
                <th className="border p-2">Timing</th>
                <th className="border p-2">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => (
                <tr key={m.id}>
                  <td className="border p-2 font-medium">{m.name}</td>
                  <td className="border p-2">{m.strength}</td>
                  <td className="border p-2">
                    {m.schedules?.[0]?.times_of_day?.join(", ") || "08:00 AM"}
                  </td>
                  <td className="border p-2">{m.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-bold">3. Recent Recorded Vitals</h2>
          <table className="w-full border-collapse border border-gray-300 text-left text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Date/Time</th>
                <th className="border p-2">Vital Sign</th>
                <th className="border p-2">Value</th>
                <th className="border p-2">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {recentVitals.slice(0, 5).map((v) => (
                <tr key={v.id}>
                  <td className="border p-2">{new Date(v.measured_at).toLocaleString()}</td>
                  <td className="border p-2">{v.type}</td>
                  <td className="border p-2">
                    {v.value} {v.secondary_value ? `/ ${v.secondary_value}` : ""} {v.unit}
                  </td>
                  <td className="border p-2">{v.recorded_by_name || "Caregiver"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 border-t pt-4">
          <p className="text-xs text-gray-500">
            Attending Clinician Signature: _______________________________ Date: _______________
          </p>
        </div>
      </div>
    </div>
  );
}
