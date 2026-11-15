'use client';

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Phone, 
  MapPin, 
  Share2, 
  Printer, 
  Heart, 
  ShieldAlert, 
  UserCheck, 
  FileText,
  Clock,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function EmergencyCardPage() {
  const [copied, setCopied] = useState(false);

  // In production, this data is fetched based on the public token
  const elderData = {
    name: 'Ramesh Sharma',
    age: 74,
    gender: 'Male',
    bloodGroup: 'O+ Positive',
    allergies: ['Penicillin', 'Sulfa Drugs'],
    conditions: ['Type 2 Diabetes', 'Hypertension (Blood Pressure)', 'Mild Arthritis'],
    emergencyContacts: [
      { name: 'Sunita Verma', relation: 'Daily Caretaker', phone: '+91 98765 43210' },
      { name: 'Ananya Sharma', relation: 'Daughter (Family)', phone: '+91 98111 22334' },
      { name: 'Dr. K. Nair', relation: 'Primary Cardiologist', phone: '+91 98222 33445' }
    ],
    currentMedications: [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', timing: 'Twice daily after food' },
      { name: 'Telmisartan', dosage: '40 mg', timing: 'Morning before food' },
      { name: 'Atorvastatin', dosage: '10 mg', timing: 'Night after dinner' }
    ],
    hospitalPreference: 'Apollo Hospital, Sector 4, Bangalore',
    notes: 'Elder is hard of hearing in right ear. Carries medication box in backpack.'
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/40 text-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-rose-800 hover:text-rose-950 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CareCircle</span>
          </Link>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyLink} 
              className="bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied QR Link!' : 'Share SOS Link'}</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
          </div>
        </div>

        {/* SOS Alert Banner */}
        <div className="bg-rose-600 text-white rounded-3xl p-6 shadow-xl flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <AlertOctagon className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase">
              Emergency Medical Profile
            </div>
            <h1 className="text-2xl md:text-3xl font-black mt-1">EMERGENCY SOS CARD</h1>
            <p className="text-xs md:text-sm text-rose-100 mt-1">
              For first responders, emergency services, and doctors. Authorized by CareCircle.
            </p>
          </div>
        </div>

        {/* Primary Patient Identifiers */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{elderData.name}</h2>
              <p className="text-sm text-slate-500 font-medium">
                {elderData.age} Years Old • {elderData.gender}
              </p>
            </div>
            <div className="bg-rose-100 text-rose-800 px-4 py-2 rounded-2xl text-center self-start sm:self-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-600">Blood Group</span>
              <strong className="text-xl font-black">{elderData.bloodGroup}</strong>
            </div>
          </div>

          {/* Allergies & Conditions Alert */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Known Allergies
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {elderData.allergies.map(a => (
                  <span key={a} className="bg-amber-200/60 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1">
                <Heart className="w-4 h-4 text-blue-600" />
                Medical Conditions
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {elderData.conditions.map(c => (
                  <span key={c} className="bg-blue-200/60 text-blue-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts - Tap to Call */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 space-y-3">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-rose-600" />
            Emergency Contacts (Tap to Call)
          </h3>
          <div className="grid gap-2.5">
            {elderData.emergencyContacts.map(c => (
              <a 
                key={c.name}
                href={`tel:${c.phone}`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition group"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{c.relation}</p>
                </div>
                <div className="bg-rose-600 group-hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{c.phone}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Current Active Medications */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 space-y-3">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" />
            Active Medications
          </h3>
          <div className="divide-y divide-slate-100">
            {elderData.currentMedications.map(m => (
              <div key={m.name} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{m.name}</h4>
                  <p className="text-xs text-slate-500">{m.timing}</p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  {m.dosage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Preference & Special Notes */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
            <MapPin className="w-4 h-4" />
            Preferred Hospital & Clinic
          </div>
          <p className="font-semibold text-sm">{elderData.hospitalPreference}</p>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            <strong>Care Note:</strong> {elderData.notes}
          </p>
        </div>
      </div>
    </div>
  );
}
