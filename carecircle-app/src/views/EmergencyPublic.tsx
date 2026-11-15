import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Droplet, Phone, Pill, Printer, ShieldAlert, Stethoscope } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { EmergencyOut } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Public SOS emergency card — reachable by QR / capability URL, no login.
export default function EmergencyPublic() {
  const { token } = useParams<{ token: string }>();
  const query = useQuery({
    queryKey: ["emergency-public", token],
    queryFn: () => apiGet<EmergencyOut>(`/emergency/${token}`),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="h-64 w-full max-w-2xl animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[#991B1B] p-6 text-center text-white" data-testid="sos-unavailable">
        <ShieldAlert className="h-12 w-12" aria-hidden />
        <h1 className="font-heading text-3xl font-semibold">Emergency card unavailable</h1>
        <p className="max-w-md text-[#FECACA]">
          This card is private right now — the elder has turned it off, or the link is wrong. In a real
          emergency, call your local emergency number.
        </p>
      </div>
    );
  }

  const card = query.data;

  return (
    <div className="min-h-svh bg-[#F8F9FA]" data-testid="sos-page">
      <div className="bg-[#991B1B] px-4 py-8 text-center text-white">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#FECACA]">Emergency</p>
        <h1 className="mt-2 font-heading text-5xl font-semibold" data-testid="sos-elder-name">
          {card.elder_name}
        </h1>
        {card.blood_group && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-2xl font-bold text-[#991B1B]" data-testid="sos-blood-group">
            <Droplet className="h-6 w-6" aria-hidden /> {card.blood_group}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        {card.allergies.length > 0 && (
          <div className="rounded-2xl border border-[#FECACA] bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#B91C1C]">Allergies</p>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="sos-allergies">
              {card.allergies.map((a) => (
                <span key={a} className="rounded-full bg-[#FEE2E2] px-3 py-1 text-base font-semibold text-[#991B1B]">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.conditions.length > 0 && (
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#52636F]">Conditions</p>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="sos-conditions">
              {card.conditions.map((c) => (
                <span key={c} className="rounded-full bg-[#FEF3C7] px-3 py-1 text-base font-medium text-[#78350F]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.medications.length > 0 && (
          <div className="rounded-2xl border bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#52636F]">
              <Pill className="h-4 w-4" aria-hidden /> Current medications
            </p>
            <ul className="mt-2 space-y-1" data-testid="sos-medications">
              {card.medications.map((m) => (
                <li key={m.name} className="text-base">
                  <strong>{m.name} {m.strength}</strong>
                  {m.times ? ` — ${m.times}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#52636F]">Call — in order</p>
          <ul className="mt-2 space-y-2" data-testid="sos-contacts">
            {card.contacts.map((c) => (
              <li key={c.phone + c.name} className="flex items-center justify-between gap-3">
                <span className="text-base">
                  <strong>{c.name}</strong>
                  {c.relation ? ` · ${c.relation}` : ""}
                </span>
                <Button variant="outline" size="sm" render={<a href={`tel:${c.phone.replace(/\s+/g, "")}`} />} data-testid={`sos-call-${c.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Phone className="h-4 w-4" aria-hidden /> {c.phone}
                </Button>
              </li>
            ))}
            {card.contacts.length === 0 && <li className="text-sm text-muted-foreground">No contacts listed.</li>}
          </ul>
        </div>

        {(card.doctor_name || card.hospital) && (
          <div className="rounded-2xl border bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#52636F]">
              <Stethoscope className="h-4 w-4" aria-hidden /> Doctor
            </p>
            <p className="mt-1 text-base" data-testid="sos-doctor">
              {card.doctor_name}
              {card.hospital ? ` · ${card.hospital}` : ""}
            </p>
          </div>
        )}

        {card.emergency_notes && (
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#78350F]">Notes for responders</p>
            <p className="mt-1 text-base text-[#44403C]" data-testid="sos-notes">{card.emergency_notes}</p>
          </div>
        )}

        <div className="flex justify-center py-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()} data-testid="sos-print-button">
            <Printer className="h-4 w-4" aria-hidden /> Print this card
          </Button>
        </div>
      </div>
    </div>
  );
}
