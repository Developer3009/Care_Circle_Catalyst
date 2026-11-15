'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Pill, 
  Calendar, 
  Users, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Volume2, 
  ChevronRight,
  RefreshCw,
  UserCheck,
  Share2,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { 
  CURRENT_USER, 
  INITIAL_CIRCLE, 
  INITIAL_MEDICATIONS, 
  INITIAL_DOSES, 
  INITIAL_APPOINTMENTS, 
  INITIAL_VITALS, 
  INITIAL_NOTIFICATIONS 
} from '@/lib/mockData';
import { DoseEvent, Medication, Circle, Appointment, VitalLog, NotificationItem } from '@/types';

export default function CareCircleDashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'medications' | 'circle' | 'vitals' | 'appointments'>('today');
  const [elderMode, setElderMode] = useState(true); // Big text, high contrast, audio prompt
  
  // State
  const [doses, setDoses] = useState<DoseEvent[]>(INITIAL_DOSES);
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [circle, setCircle] = useState<Circle>(INITIAL_CIRCLE);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [vitals, setVitals] = useState<VitalLog[]>(INITIAL_VITALS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Form states
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [showAddVital, setShowAddVital] = useState(false);
  const [vitalType, setVitalType] = useState<'BP' | 'Sugar' | 'HeartRate'>('BP');
  const [vitalVal, setVitalVal] = useState('');

  // Fetch live Supabase data on mount
  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    try {
      const [resDoses, resMeds, resCircle, resApts, resVitals, resNotifs] = await Promise.all([
        fetch('/api/carecircle?resource=doses').then(r => r.json()),
        fetch('/api/carecircle?resource=medications').then(r => r.json()),
        fetch('/api/carecircle?resource=circle').then(r => r.json()),
        fetch('/api/carecircle?resource=appointments').then(r => r.json()),
        fetch('/api/carecircle?resource=vitals').then(r => r.json()),
        fetch('/api/carecircle?resource=notifications').then(r => r.json())
      ]);

      if (Array.isArray(resDoses)) setDoses(resDoses);
      if (Array.isArray(resMeds)) setMedications(resMeds);
      if (resCircle && resCircle.members) setCircle(resCircle);
      if (Array.isArray(resApts)) setAppointments(resApts);
      if (Array.isArray(resVitals)) setVitals(resVitals);
      if (Array.isArray(resNotifs)) setNotifications(resNotifs);
    } catch (e) {
      console.error('Data fetch error, using robust fallback state:', e);
    }
  };

  // Text-To-Speech for Elder Mode
  const speakSchedule = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const scheduled = doses.filter(d => d.status === 'SCHEDULED');
    let text = `Namaste Ramesh ji. You have ${scheduled.length} remaining medicines scheduled today. `;
    if (scheduled.length > 0) {
      text += `Your next medicine is ${scheduled[0].medicationName}, ${scheduled[0].dosage} at ${scheduled[0].scheduledTime}.`;
    } else {
      text += "All your doses for today have been taken on time. Wonderful job!";
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Mark Dose as Taken
  const handleMarkDose = async (doseId: string, status: 'TAKEN' | 'SKIPPED' | 'SCHEDULED') => {
    const updated = doses.map(d => {
      if (d.id === doseId) {
        return {
          ...d,
          status,
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          loggedBy: CURRENT_USER.name
        };
      }
      return d;
    });
    setDoses(updated);

    // Save to Supabase API
    const targetDose = doses.find(d => d.id === doseId);
    await fetch('/api/carecircle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'log_dose',
        doseId,
        status,
        loggedBy: CURRENT_USER.name,
        medicationId: targetDose?.medicationId
      })
    });

    // Refresh stock if taken
    if (status === 'TAKEN' && targetDose?.medicationId) {
      setMedications(prev => prev.map(m => m.id === targetDose.medicationId ? { ...m, stock: Math.max(0, m.stock - 1) } : m));
    }
  };

  // Approve Member in Consent Center
  const handleApproveMember = async (memberId: string) => {
    setCircle(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, status: 'ACTIVE' } : m)
    }));

    await fetch('/api/carecircle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_member', memberId })
    });
  };

  // Rotate Circle Passcode
  const handleRotatePasscode = async () => {
    setLoading(true);
    const res = await fetch('/api/carecircle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rotate_passcode', circleId: circle.id })
    }).then(r => r.json());

    if (res?.passcode) {
      setCircle(prev => ({ ...prev, passcode: res.passcode }));
    }
    setLoading(false);
  };

  // Add Medication
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;
    const newMed: Medication = {
      id: 'med_' + Date.now(),
      circleId: circle.id,
      name: newMedName,
      dosage: newMedDosage || '1 Tablet',
      instructions: 'after_food',
      frequency: 'daily',
      timeSlots: [newMedTime],
      stock: 30,
      criticality: 'NORMAL',
      color: 'emerald'
    };

    setMedications([...medications, newMed]);
    setShowAddMed(false);
    setNewMedName('');
    setNewMedDosage('');

    await fetch('/api/carecircle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_medication', medication: newMed })
    });
    fetchSupabaseData();
  };

  // Add Vital
  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalVal) return;
    const unit = vitalType === 'BP' ? 'mmHg' : vitalType === 'Sugar' ? 'mg/dL' : 'bpm';
    const newV: VitalLog = {
      id: 'vit_' + Date.now(),
      circleId: circle.id,
      type: vitalType,
      value: vitalVal,
      unit,
      status: 'NORMAL',
      timestamp: 'Just now'
    };

    setVitals([newV, ...vitals]);
    setShowAddVital(false);
    setVitalVal('');

    await fetch('/api/carecircle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_vital', vital: newV })
    });
  };

  const takenCount = doses.filter(d => d.status === 'TAKEN').length;
  const adherenceRate = Math.round((takenCount / (doses.length || 1)) * 100);

  return (
    <div className={`min-h-screen ${elderMode ? 'bg-amber-50/40 text-slate-900 text-lg' : 'bg-slate-50 text-slate-800'}`}>
      {/* Top Elder Care Navigation Banner */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white text-emerald-800 p-2 rounded-2xl shadow-sm">
              <Heart className="w-7 h-7 fill-emerald-600 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">CareCircle</h1>
              <p className="text-xs text-emerald-100 flex items-center gap-1">
                <span>Circle: {circle.name}</span>
                <span className="text-emerald-300">• Connected to Supabase</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/emergency"
              className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>SOS Emergency Card</span>
            </Link>

            <button 
              onClick={() => setElderMode(!elderMode)}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition flex items-center gap-1.5 ${
                elderMode ? 'bg-amber-400 text-slate-900 shadow-sm' : 'bg-emerald-800 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {elderMode ? 'Elder Mode: ON (High Contrast)' : 'Elder Mode: OFF'}
            </button>
            
            <button 
              onClick={speakSchedule}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 shadow-sm"
              title="Voice Reader for Elder"
            >
              <Volume2 className={`w-4 h-4 ${speaking ? 'animate-pulse text-amber-300' : ''}`} />
              <span className="hidden sm:inline">Voice Assistant</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto px-4 flex space-x-2 border-t border-emerald-600/60 overflow-x-auto text-sm">
          {[
            { id: 'today', label: "Today's Doses", icon: Pill },
            { id: 'medications', label: 'Medications', icon: ShieldCheck },
            { id: 'circle', label: 'Consent & Circle', icon: Users },
            { id: 'vitals', label: 'Health Vitals', icon: Activity },
            { id: 'appointments', label: 'Doctor Visits', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
                  active 
                    ? 'border-amber-400 text-amber-300' 
                    : 'border-transparent text-emerald-100 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Status Callout Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              {adherenceRate}%
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                Hello, {circle.elderName}!
              </h2>
              <p className="text-sm text-slate-600">
                {takenCount} of {doses.length} medicines taken today. Family & Caregiver connected.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-slate-100 px-3 py-2 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Passcode: <strong className="text-slate-900 font-mono text-sm">{circle.passcode}</strong></span>
            </div>
            <button 
              onClick={() => setActiveTab('circle')} 
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1"
            >
              <span>Manage Circle</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TAB 1: TODAY'S DOSES */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Today's Medication Schedule</h3>
                <p className="text-sm text-slate-500">Tap "Mark as Taken" after taking your medication.</p>
              </div>
              <button 
                onClick={() => setShowAddMed(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="grid gap-4">
              {doses.map((dose) => {
                const isTaken = dose.status === 'TAKEN';
                return (
                  <div 
                    key={dose.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isTaken 
                        ? 'bg-emerald-50/70 border-emerald-200' 
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3.5 rounded-2xl ${
                          isTaken ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Pill className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-600 flex items-center gap-1">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {dose.scheduledTime}
                            </span>
                            {isTaken && (
                              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Taken at {dose.loggedAt || 'On Time'}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xl font-bold text-slate-900 mt-0.5">{dose.medicationName}</h4>
                          <p className="text-sm text-slate-600 font-medium">Dosage: {dose.dosage}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        {!isTaken ? (
                          <button
                            onClick={() => handleMarkDose(dose.id, 'TAKEN')}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-base md:text-lg"
                          >
                            <CheckCircle2 className="w-6 h-6" />
                            <span>Mark as Taken</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkDose(dose.id, 'SCHEDULED')}
                            className="text-xs text-slate-500 hover:text-slate-700 underline px-2 py-1"
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MEDICATIONS & INVENTORY */}
        {activeTab === 'medications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Active Prescriptions & Stock</h3>
                <p className="text-sm text-slate-500">Auto-decrements with each taken dose; alerts caregiver at low stock.</p>
              </div>
              <button 
                onClick={() => setShowAddMed(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Prescription</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {medications.map(med => (
                <div key={med.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                        med.criticality === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {med.criticality} Criticality
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mt-2">{med.name}</h4>
                      <p className="text-sm text-slate-600 font-medium">Dosage: {med.dosage} • {med.instructions.replace('_', ' ')}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500">Stock Count</span>
                      <p className={`text-2xl font-black ${med.stock <= 5 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                        {med.stock}
                      </p>
                      {med.stock <= 5 && (
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1 justify-end">
                          <AlertTriangle className="w-3 h-3" /> Refill Alert
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Times: {med.timeSlots.join(', ')}</span>
                    <span className="text-emerald-700 font-medium">Managed by Circle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CONSENT CENTER & CIRCLE MEMBERS */}
        {activeTab === 'circle' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-3xl shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-700/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    Elder Consent & Access Center
                  </div>
                  <h3 className="text-2xl font-bold">Secure Circle Passcode: <span className="text-amber-300 font-mono">{circle.passcode}</span></h3>
                  <p className="text-sm text-emerald-100 mt-1">
                    Invite family or caretakers with this code. They only get access after <strong>you approve them below</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleRotatePasscode}
                    disabled={loading}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Rotate Passcode</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Circle Members & Pending Approvals</h4>
              <div className="grid gap-3">
                {circle.members.map(member => (
                  <div key={member.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900">{member.name}</h5>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            member.role === 'ELDER_OWNER' ? 'bg-amber-100 text-amber-800' :
                            member.role === 'CARETAKER' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'FAMILY' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {member.role.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>

                    <div>
                      {member.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApproveMember(member.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Approve Access</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          Active Member
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification / Escalation Log */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notification & Escalation History
              </h4>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-sm flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${n.type === 'REFILL' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800 font-semibold">{n.title}</strong>
                        <span className="text-xs text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HEALTH VITALS */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Health Vitals Log</h3>
                <p className="text-sm text-slate-500">Track Blood Pressure, Sugar, and Pulse across the Care Circle.</p>
              </div>
              <button 
                onClick={() => setShowAddVital(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Reading</span>
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {vitals.map(v => (
                <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>{v.type === 'BP' ? 'Blood Pressure' : v.type === 'Sugar' ? 'Blood Sugar' : 'Heart Rate'}</span>
                    <span>{v.timestamp}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{v.value}</span>
                    <span className="text-sm font-semibold text-slate-500">{v.unit}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Normal Range
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Doctor Visits & Consultations</h3>
                <p className="text-sm text-slate-500">All circle members receive automated appointment reminders.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {appointments.map(apt => (
                <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{apt.doctorName}</h4>
                      <p className="text-xs text-emerald-700 font-semibold">{apt.speciality}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                      {apt.clinic}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2 text-sm text-slate-700 font-semibold">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{apt.dateTime}</span>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-slate-500">
                      <strong>Notes:</strong> {apt.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD MEDICATION */}
      {showAddMed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Medication to Circle</h3>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Amlodipine 5mg"
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dosage / Instructions</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1 Tablet after breakfast"
                  value={newMedDosage}
                  onChange={e => setNewMedDosage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Time</label>
                <input 
                  type="text" 
                  value={newMedTime}
                  onChange={e => setNewMedTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddMed(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VITAL */}
      {showAddVital && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Log Health Vital</h3>
            <form onSubmit={handleAddVital} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vital Type</label>
                <select 
                  value={vitalType} 
                  onChange={e => setVitalType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="BP">Blood Pressure (mmHg)</option>
                  <option value="Sugar">Blood Sugar (mg/dL)</option>
                  <option value="HeartRate">Heart Rate (bpm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reading Value</label>
                <input 
                  type="text" 
                  required
                  placeholder={vitalType === 'BP' ? '120/80' : vitalType === 'Sugar' ? '110' : '72'}
                  value={vitalVal}
                  onChange={e => setVitalVal(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddVital(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
