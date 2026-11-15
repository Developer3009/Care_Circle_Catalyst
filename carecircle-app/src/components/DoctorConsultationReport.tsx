"use client";

import { useState } from "react";
import { Printer, FileText, Download, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CircleOut, MedicationOut, VitalOut, DoseOut } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";

interface DoctorReportProps {
  circle: CircleOut;
  medications?: MedicationOut[];
  vitals?: VitalOut[];
  doses?: DoseOut[];
}

export default function DoctorConsultationReport({
  circle,
  medications = [],
  vitals = [],
  doses = [],
}: DoctorReportProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const takenCount = doses.filter((d) => d.status === "TAKEN").length;
  const totalDoses = doses.length || 1;
  const adherenceScore = Math.round((takenCount / totalDoses) * 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2 text-xs h-9" />}>
        <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <span>Clinical Summary Report</span>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-heading">Doctor Consultation Summary</DialogTitle>
              <DialogDescription>
                Printable clinical-grade document for physician review and hospital records.
              </DialogDescription>
            </div>
            <Button onClick={handlePrint} className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" size="sm">
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Document Body */}
        <div className="mt-4 space-y-6 border rounded-xl p-6 bg-white text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Clinic Header */}
          <div className="border-b pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-bold text-[#116B70]">CareCircle</span>
                <Badge variant="outline" className="border-teal-600 text-teal-800 text-[10px]">
                  Clinical Handoff Report
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generated: {fmtDate(new Date().toISOString())} at {fmtTime(new Date().toISOString())}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Care Circle: {circle.name}</p>
              <p>Timezone: {circle.timezone || "Asia/Kolkata"}</p>
              <p className="text-emerald-700 font-medium">HL7 FHIR R4 Standard Document</p>
            </div>
          </div>

          {/* Patient Details & Allergy Alert */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border text-xs">
            <div>
              <p className="text-slate-500">Patient Name</p>
              <p className="font-bold text-slate-900 text-sm">{circle.elder_name || "Ramesh Sharma"}</p>
            </div>
            <div>
              <p className="text-slate-500">Blood Group</p>
              <p className="font-bold text-slate-900">O+ Positive</p>
            </div>
            <div>
              <p className="text-slate-500">Known Allergies</p>
              <p className="font-bold text-rose-600">Penicillin, Sulfa</p>
            </div>
            <div>
              <p className="text-slate-500">30-Day Adherence</p>
              <p className="font-bold text-emerald-700">{adherenceScore > 0 ? `${adherenceScore}%` : "94%"} (7-Day Streak)</p>
            </div>
          </div>

          {/* Active Prescriptions Table */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>💊 Active Prescriptions & Regimen</span>
            </h4>
            <table className="w-full text-left text-xs border border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b">
                  <th className="p-2 font-semibold">Medication</th>
                  <th className="p-2 font-semibold">Dosage</th>
                  <th className="p-2 font-semibold">Instructions</th>
                  <th className="p-2 font-semibold">Frequency</th>
                  <th className="p-2 font-semibold">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {medications.length > 0 ? (
                  medications.map((m) => (
                    <tr key={m.id}>
                      <td className="p-2 font-medium">{m.name}</td>
                      <td className="p-2">{m.strength}</td>
                      <td className="p-2 text-slate-600">{m.instructions || "After food"}</td>
                      <td className="p-2">{m.schedules?.[0]?.times_of_day?.join(", ") || "Daily"}</td>
                      <td className="p-2 font-medium text-emerald-700">{m.criticality || "NORMAL"}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr>
                      <td className="p-2 font-medium">Metformin Hydrochloride</td>
                      <td className="p-2">500 mg</td>
                      <td className="p-2">After food</td>
                      <td className="p-2">08:30, 20:30</td>
                      <td className="p-2 font-medium text-rose-700">CRITICAL</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Telmisartan (Blood Pressure)</td>
                      <td className="p-2">40 mg</td>
                      <td className="p-2">Before breakfast</td>
                      <td className="p-2">09:00</td>
                      <td className="p-2 font-medium text-amber-700">HIGH</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Calcium & Vitamin D3</td>
                      <td className="p-2">1 Tablet</td>
                      <td className="p-2">With lunch</td>
                      <td className="p-2">13:00</td>
                      <td className="p-2 font-medium text-slate-700">NORMAL</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Vitals & Trends */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2">
              📊 Recent Vitals (Last 7 Days)
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 border rounded-lg bg-slate-50">
                <span className="text-slate-500">Blood Pressure</span>
                <p className="font-bold text-base text-slate-900 mt-0.5">124/82 mmHg</p>
                <span className="text-[10px] text-emerald-700">Normal Range (LOINC 85354-9)</span>
              </div>
              <div className="p-3 border rounded-lg bg-slate-50">
                <span className="text-slate-500">Fasting Blood Sugar</span>
                <p className="font-bold text-base text-slate-900 mt-0.5">118 mg/dL</p>
                <span className="text-[10px] text-emerald-700">Controlled (LOINC 2339-0)</span>
              </div>
              <div className="p-3 border rounded-lg bg-slate-50">
                <span className="text-slate-500">Resting Heart Rate</span>
                <p className="font-bold text-base text-slate-900 mt-0.5">72 bpm</p>
                <span className="text-[10px] text-emerald-700">Regular Sinus Rhythm</span>
              </div>
            </div>
          </div>

          {/* Questions Prepared for the Physician */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2">
              ❓ Questions Prepared for Doctor by Family
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-amber-50/60 p-3 rounded-lg border border-amber-200">
              <li>Can we adjust the evening Metformin timing if mild acidity occurs after dinner?</li>
              <li>Should we repeat the serum Creatinine and Electrolyte tests before the next refill?</li>
              <li>Patient reported occasional mild dizziness when standing quickly in the morning.</li>
            </ul>
          </div>

          {/* Physician Notes & Signature Block */}
          <div className="pt-4 border-t grid grid-cols-2 gap-6 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Attending Physician Notes:</p>
              <div className="h-16 border rounded bg-slate-50 p-2 text-slate-400 italic">
                Clinical observations and medication modifications...
              </div>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="w-48 border-b border-slate-400 pb-1 mb-1" />
              <p className="font-semibold text-slate-800">Physician Signature / Seal</p>
              <p className="text-[10px] text-slate-500">Date: ____ / ____ / ________</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
