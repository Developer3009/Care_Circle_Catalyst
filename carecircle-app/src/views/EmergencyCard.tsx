import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Copy, 
  ExternalLink, 
  Printer, 
  Siren, 
  QrCode, 
  Camera, 
  Share2, 
  ShieldCheck, 
  Phone,
  Heart
} from "lucide-react";
import QRCode from "react-qr-code";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import QRScannerModal from "@/components/QRScannerModal";
import { apiErrorMessage } from "@/lib/format";
import { apiGet, apiPut } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { EmergencyContactIO, EmergencyOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    enabled: true,
  });
  const [contacts, setContacts] = useState<EmergencyContactIO[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const query = useQuery({
    queryKey: ["emergency", circleId],
    queryFn: () => apiGet<EmergencyOut>(`/circles/${circleId}/emergency`),
    enabled: !!circleId,
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      blood_group: query.data.blood_group || "O+ Positive",
      allergies: (query.data.allergies || []).join(", "),
      conditions: (query.data.conditions || []).join(", "),
      emergency_notes: query.data.emergency_notes || query.data.notes || "",
      doctor_name: query.data.doctor_name || "",
      hospital: query.data.hospital || query.data.hospital_preference || "",
      enabled: query.data.enabled ?? true,
    });
    setContacts(query.data.contacts?.length ? query.data.contacts : [{ name: "", relation: "", phone: "" }]);
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
      toast.success("Emergency card saved successfully");
      queryClient.invalidateQueries({ queryKey: ["emergency", circleId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!circle) return <NoCircle />;

  const data = query.data;
  const editable = can({ role, permissions: {} }, "edit_emergency");
  const emergencyToken = data?.emergency_token || "sos_emergency_01";
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/sos/${emergencyToken}` : `/sos/${emergencyToken}`;

  const handleScanResult = (decodedText: string) => {
    setShowScanner(false);
    toast.success("QR Code detected!");
    if (decodedText.startsWith("http")) {
      window.open(decodedText, "_blank");
    } else {
      window.location.href = `/sos/${decodedText}`;
    }
  };

  if (query.isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-muted m-4 md:m-8" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8" data-testid="emergency-card-page">
      {/* Header & Quick Scanner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-slate-900">
            <Siren className="h-7 w-7 text-rose-600" aria-hidden /> Emergency SOS Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Public-by-QR SOS page: critical vitals, allergies, conditions, and contacts for first responders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowScanner(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 font-bold shadow-sm"
          >
            <Camera className="w-4 h-4 text-rose-400" />
            <span>Scan Other's SOS QR</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Wallet Card</span>
          </Button>
        </div>
      </div>

      {/* QR CODE SHARE BANNER (THE HIGHLIGHTED SECTION) */}
      <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0">
          <QRCode
            value={publicUrl}
            size={140}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
          <p className="text-[10px] text-center font-bold text-slate-600 mt-2 flex items-center justify-center gap-1">
            <QrCode className="w-3 h-3 text-rose-600" /> SCAN FOR SOS
          </p>
        </div>

        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Emergency First-Responder QR
          </div>
          <h2 className="text-2xl font-black">Scan to View {circle.elder_name}'s Medical Info</h2>
          <p className="text-xs text-rose-100 leading-relaxed max-w-lg">
            Emergency doctors or responders can scan this QR code with any mobile camera to view blood group, drug allergies, active prescriptions, and dial emergency contacts directly without logging in.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 justify-center md:justify-start">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Emergency SOS link copied!");
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs rounded-xl"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy SOS Link
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(publicUrl, "_blank")}
              className="bg-white text-rose-900 hover:bg-rose-50 text-xs font-bold rounded-xl"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Preview SOS Page
            </Button>
          </div>
        </div>
      </div>

      {/* EMERGENCY FORM EDITOR */}
      <form
        className="space-y-5 rounded-3xl border bg-card p-6 sm:p-8 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (editable) save.mutate();
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            Medical Identifiers & Hospital
          </h3>
          <span className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full">
            {editable ? "Elder Editing Enabled" : "Read-Only View"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sos-blood" className="font-bold text-slate-700">Blood Group</Label>
            <Input
              id="sos-blood"
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              placeholder="e.g. O+ Positive"
              disabled={!editable}
              className="rounded-xl font-bold text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sos-doctor" className="font-bold text-slate-700">Primary Doctor</Label>
            <Input
              id="sos-doctor"
              value={form.doctor_name}
              onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
              placeholder="e.g. Dr. K. Nair"
              disabled={!editable}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sos-allergies" className="font-bold text-slate-700">Known Drug Allergies</Label>
            <Input
              id="sos-allergies"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Sulfa"
              disabled={!editable}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sos-hospital" className="font-bold text-slate-700">Preferred Hospital</Label>
            <Input
              id="sos-hospital"
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              placeholder="e.g. Apollo Hospital, Sector 4"
              disabled={!editable}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sos-conditions" className="font-bold text-slate-700">Medical Conditions</Label>
            <Input
              id="sos-conditions"
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="e.g. Type 2 Diabetes, Hypertension, Mild Arthritis"
              disabled={!editable}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sos-notes" className="font-bold text-slate-700">Notes for Responders / Paramedics</Label>
            <Textarea
              id="sos-notes"
              value={form.emergency_notes}
              onChange={(e) => setForm({ ...form, emergency_notes: e.target.value })}
              placeholder="e.g. Mild hearing loss in right ear. Carries medicine container in jacket."
              disabled={!editable}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Emergency Contacts - Tap to Call */}
        <div className="pt-4 border-t border-slate-100">
          <Label className="font-bold text-slate-900 text-base">Emergency Contacts (Tap-to-Call on QR Scan)</Label>
          <div className="mt-3 space-y-2.5">
            {contacts.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <Input
                  value={c.name}
                  onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Contact Name"
                  className="w-40 rounded-xl bg-white"
                  disabled={!editable}
                />
                <Input
                  value={c.relation}
                  onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)))}
                  placeholder="Relationship (e.g. Daughter)"
                  className="w-36 rounded-xl bg-white"
                  disabled={!editable}
                />
                <Input
                  value={c.phone}
                  onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))}
                  placeholder="Phone Number"
                  className="w-44 rounded-xl bg-white font-mono"
                  disabled={!editable}
                />
                {editable && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 rounded-xl"
                    onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          {editable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl font-semibold"
              onClick={() => setContacts([...contacts, { name: "", relation: "", phone: "" }])}
            >
              + Add Contact
            </Button>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 cursor-pointer">
          <Checkbox
            checked={form.enabled}
            onCheckedChange={(checked) => editable && setForm({ ...form, enabled: checked === true })}
            disabled={!editable}
          />
          <span className="text-xs sm:text-sm text-slate-800">
            <strong>Public Emergency QR Enabled:</strong> Anyone scanning your physical card or QR code can view this emergency sheet without needing an account.
          </span>
        </label>

        {editable && (
          <Button
            type="submit"
            disabled={save.isPending}
            className="w-full bg-[#116B70] hover:bg-[#0d5357] text-white font-bold py-3 rounded-2xl shadow-md text-base"
          >
            {save.isPending ? "Saving..." : "Save Emergency Card & Update QR"}
          </Button>
        )}
      </form>

      {/* SCANNER MODAL */}
      {showScanner && (
        <QRScannerModal
          onScanSuccess={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
