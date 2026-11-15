import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INITIAL_DOSES, INITIAL_MEDICATIONS, INITIAL_CIRCLE, INITIAL_APPOINTMENTS, INITIAL_VITALS, INITIAL_NOTIFICATIONS } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource') || 'all';

  try {
    if (resource === 'doses') {
      const { data, error } = await supabase.from('dose_events').select('*').order('scheduled_time', { ascending: true });
      if (error || !data || data.length === 0) return NextResponse.json(INITIAL_DOSES);
      
      const mapped = data.map((d: any) => ({
        id: d.id,
        medicationId: d.medication_id,
        circleId: d.circle_id,
        medicationName: d.medication_name,
        dosage: d.dosage,
        scheduledTime: d.scheduled_time,
        scheduledDate: d.scheduled_date,
        status: d.status,
        loggedAt: d.logged_at,
        loggedBy: d.logged_by,
        escalationLevel: d.escalation_level
      }));
      return NextResponse.json(mapped);
    }

    if (resource === 'medications') {
      const { data, error } = await supabase.from('medications').select('*');
      if (error || !data || data.length === 0) return NextResponse.json(INITIAL_MEDICATIONS);
      const mapped = data.map((m: any) => ({
        id: m.id,
        circleId: m.circle_id,
        name: m.name,
        dosage: m.dosage,
        instructions: m.instructions,
        frequency: m.frequency,
        timeSlots: m.time_slots,
        stock: m.stock,
        criticality: m.criticality,
        color: m.color
      }));
      return NextResponse.json(mapped);
    }

    if (resource === 'circle') {
      const { data: circleData } = await supabase.from('circles').select('*').eq('id', 'circle_01').single();
      const { data: membersData } = await supabase.from('circle_members').select('*').eq('circle_id', 'circle_01');
      if (!circleData || !membersData) return NextResponse.json(INITIAL_CIRCLE);
      
      return NextResponse.json({
        id: circleData.id,
        name: circleData.name,
        elderName: circleData.elder_name,
        passcode: circleData.passcode,
        passcodeExpiry: '48 hours remaining',
        members: membersData.map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.status,
          joinedAt: m.joined_at
        }))
      });
    }

    if (resource === 'appointments') {
      const { data } = await supabase.from('appointments').select('*');
      if (!data || data.length === 0) return NextResponse.json(INITIAL_APPOINTMENTS);
      return NextResponse.json(data.map((a: any) => ({
        id: a.id,
        circleId: a.circle_id,
        doctorName: a.doctor_name,
        speciality: a.speciality,
        clinic: a.clinic,
        dateTime: a.date_time,
        notes: a.notes
      })));
    }

    if (resource === 'vitals') {
      const { data } = await supabase.from('vitals').select('*');
      if (!data || data.length === 0) return NextResponse.json(INITIAL_VITALS);
      return NextResponse.json(data.map((v: any) => ({
        id: v.id,
        circleId: v.circle_id,
        type: v.type,
        value: v.value,
        unit: v.unit,
        status: v.status,
        timestamp: v.timestamp
      })));
    }

    if (resource === 'notifications') {
      const { data } = await supabase.from('notifications').select('*');
      if (!data || data.length === 0) return NextResponse.json(INITIAL_NOTIFICATIONS);
      return NextResponse.json(data.map((n: any) => ({
        id: n.id,
        circleId: n.circle_id,
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: n.timestamp,
        read: n.read
      })));
    }

    return NextResponse.json({ success: true, message: 'CareCircle API active with Supabase integration' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Log dose taken/skipped
    if (action === 'log_dose') {
      const { doseId, status, loggedBy, medicationId } = body;
      const loggedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      await supabase
        .from('dose_events')
        .update({
          status,
          logged_at: new Date().toISOString(),
          logged_by: loggedBy || 'Ramesh Sharma'
        })
        .eq('id', doseId);

      // Decrement stock if status is TAKEN
      if (status === 'TAKEN' && medicationId) {
        const { data: med } = await supabase.from('medications').select('stock').eq('id', medicationId).single();
        if (med && med.stock > 0) {
          await supabase.from('medications').update({ stock: med.stock - 1 }).eq('id', medicationId);
        }
      }

      return NextResponse.json({ success: true, loggedAt });
    }

    // Action 2: Approve Circle Member in Consent Center
    if (action === 'approve_member') {
      const { memberId } = body;
      await supabase
        .from('circle_members')
        .update({ status: 'ACTIVE' })
        .eq('id', memberId);

      return NextResponse.json({ success: true });
    }

    // Action 3: Rotate Passcode
    if (action === 'rotate_passcode') {
      const { circleId } = body;
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newPasscode = 'CARE';
      for (let i = 0; i < 4; i++) {
        newPasscode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await supabase
        .from('circles')
        .update({
          passcode: newPasscode,
          passcode_expiry: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
        })
        .eq('id', circleId);

      return NextResponse.json({ success: true, passcode: newPasscode });
    }

    // Action 4: Add New Medication
    if (action === 'add_medication') {
      const { medication } = body;
      const id = 'med_' + Date.now();
      await supabase.from('medications').insert({
        id,
        circle_id: medication.circleId || 'circle_01',
        name: medication.name,
        dosage: medication.dosage,
        instructions: medication.instructions,
        frequency: medication.frequency,
        time_slots: medication.timeSlots,
        stock: Number(medication.stock) || 30,
        criticality: medication.criticality || 'NORMAL',
        color: medication.color || 'blue'
      });

      // Generate a dose event for today
      await supabase.from('dose_events').insert({
        id: 'dose_' + Date.now(),
        medication_id: id,
        circle_id: medication.circleId || 'circle_01',
        medication_name: medication.name,
        dosage: medication.dosage,
        scheduled_time: medication.timeSlots[0] || '12:00 PM',
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'SCHEDULED'
      });

      return NextResponse.json({ success: true, id });
    }

    // Action 5: Add Vital Log
    if (action === 'add_vital') {
      const { vital } = body;
      const id = 'vit_' + Date.now();
      await supabase.from('vitals').insert({
        id,
        circle_id: 'circle_01',
        type: vital.type,
        value: vital.value,
        unit: vital.unit,
        status: vital.status || 'NORMAL',
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
