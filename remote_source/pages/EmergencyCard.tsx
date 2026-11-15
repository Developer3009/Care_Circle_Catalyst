import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, Printer, Siren } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import { apiErrorMessage } from "@/lib/format";
import { apiGet, apiPut } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { EmergencyContactIO, EmergencyOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Emergency card editor (elder-only edits) + public link + print.
export default function EmergencyCard() {
  const { circle, role } = useApp();
  const circleId = circle?.id ?? null;
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    blood_group: "",
    allergies: "",
    conditions: "",
    emergency_notes: "",
    doctor_name: "",
    hospital: "",
    enabled: false,
  });
  const [contacts, setContacts] = useState<EmergencyContactIO[]>([]);

  const query = useQuery({
    queryKey: ["emergency", circleId],
    queryFn: () => apiGet<EmergencyOut>(`/circles/${circleId}/emergency`),
    enabled: !!circleId,
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      blood_group: query.data.blood_group,
      allergies: query.data.allergies.join(", "),
      conditions: query.data.conditions.join(", "),
      emergency_notes: query.data.emergency_notes,
      doctor_name: query.data.doctor_name,
      hospital: query.data.hospital,
      enabled: query.data.enabled,
    });
    setContacts(query.data.contacts.length ? query.data.contacts : [{ name: "", relation: "", phone: "", priority: 1 }]);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      apiPut<EmergencyOut>(`/circles/${circleId}/emergency`, {
        blood_group: form.blood_group.trim(),
        allergies: form.allergies.split(",").map((a) => a.trim()).filter(Boolean),
        conditions: form.conditions.split(",").map((c) => c.trim()).filter(Boolean),
        emergency_notes: form.emergency_notes.trim(),
        doctor_name: form.doctor_name.trim(),
        hospital: form.hospital.trim(),
        enabled: form.enabled,
        contacts: contacts.filter((c) => c.name.trim() && c.phone.trim()),
      }),
    onSuccess: () => {
      toast.success("Emergency card saved");
      queryClient.invalidateQueries({ queryKey: ["emergency", circleId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!circle) return <NoCircle />;

  const data = query.data;
  const editable = can({ role, permissions: {} }, "edit_emergency");
  const publicUrl = data?.emergency_token ? `${window.location.origin}/sos/${data.emergency_token}` : null;

  if (query.isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-muted m-4 md:m-8" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8" data-testid="emergency-card-page">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold">
          <Siren className="h-7 w-7 text-[#991B1B]" aria-hidden /> Emergency card
        </h1>
        <p className="text-sm text-muted-foreground">
          Public-by-QR SOS page: what a responder needs in the first minute. The elder controls the toggle.
        </p>
      </div>

      {publicUrl && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#FECACA] bg-[#FFF7F7] p-4" data-testid="emergency-public-link-card">
          <p className="min-w-0 flex-1 truncate text-sm" data-testid="emergency-public-url">{publicUrl}</p>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(publicUrl)} data-testid="emergency-copy-link-button">
            <Copy className="h-3.5 w-3.5" aria-hidden /> Copy link
          </Button>
          <Button size="sm" variant="outline" render={<a href={publicUrl} target="_blank" rel="noreferrer" />} data-testid="emergency-open-link-button">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open
          </Button>
        </div>
      )}

      <form
        className="space-y-4 rounded-2xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (editable) save.mutate();
        }}
        data-testid="emergency-form"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sos-blood">Blood group</Label>
            <Input id="sos-blood" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} placeholder="B+" disabled={!editable} data-testid="sos-blood-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sos-doctor">Doctor</Label>
            <Input id="sos-doctor" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="Dr. Anita Mehta" disabled={!editable} data-testid="sos-doctor-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sos-allergies">Allergies (comma separated)</Label>
            <Input id="sos-allergies" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Penicillin, Peanuts" disabled={!editable} data-testid="sos-allergies-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sos-hospital">Hospital</Label>
            <Input id="sos-hospital" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="Ruby Hall Clinic, Pune" disabled={!editable} data-testid="sos-hospital-input" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sos-conditions">Conditions (comma separated)</Label>
            <Input id="sos-conditions" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="Type 2 Diabetes, Hypertension" disabled={!editable} data-testid="sos-conditions-input" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sos-notes">Notes for responders</Label>
            <Textarea id="sos-notes" value={form.emergency_notes} onChange={(e) => setForm({ ...form, emergency_notes: e.target.value })} disabled={!editable} data-testid="sos-notes-input" />
          </div>
        </div>

        <div>
          <Label>Emergency contacts</Label>
          <div className="mt-2 space-y-2">
            {contacts.map((c, i) => (
              <div key={i} className="flex flex-wrap gap-2" data-testid={`sos-contact-row-${i}`}>
                <Input value={c.name} onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" className="w-40" disabled={!editable} data-testid={`sos-contact-name-${i}`} />
                <Input value={c.relation} onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)))} placeholder="Relation" className="w-32" disabled={!editable} data-testid={`sos-contact-relation-${i}`} />
                <Input value={c.phone} onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))} placeholder="Phone" className="w-40" disabled={!editable} data-testid={`sos-contact-phone-${i}`} />
                {editable && (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove contact" data-testid={`sos-contact-remove-${i}`} onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
          {editable && (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setContacts([...contacts, { name: "", relation: "", phone: "", priority: contacts.length + 1 }])} data-testid="sos-contact-add-button">
              Add contact
            </Button>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4" data-testid="sos-enable-row">
          <Checkbox checked={form.enabled} onCheckedChange={(checked) => editable && setForm({ ...form, enabled: checked === true })} disabled={!editable} data-testid="sos-enabled-checkbox" />
          <span className="text-sm">
            <strong>Public emergency card enabled</strong>
            <span className="block text-muted-foreground">Anyone with the link/QR can see this card — nothing else in the circle.</span>
          </span>
        </label>

        {editable ? (
          <Button type="submit" disabled={save.isPending} data-testid="emergency-save-button">
            {save.isPending ? "Saving…" : "Save emergency card"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="emergency-readonly-note">Only the elder can edit this card.</p>
        )}
      </form>

      <Button variant="outline" onClick={() => window.print()} data-testid="emergency-print-button">
        <Printer className="h-4 w-4" aria-hidden /> Print a copy
      </Button>
    </div>
  );
}
