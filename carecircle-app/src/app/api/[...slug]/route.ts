import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper for cookie/session user simulation
const DEFAULT_USER = {
  id: 'usr_elder_01',
  email: 'ramesh.sharma@example.com',
  name: 'Ramesh Sharma',
  full_name: 'Ramesh Sharma',
  role: 'ELDER_OWNER'
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');

  try {
    // 1. /auth/me
    if (path === '/auth/me') {
      return NextResponse.json(DEFAULT_USER);
    }

    // 2. /circles/mine
    if (path === '/circles/mine') {
      const { data: circleData } = await supabase.from('circles').select('*').limit(1).single();
      const { data: membersData } = await supabase.from('circle_members').select('*');
      
      const res = [{
        id: circleData?.id || 'circle_01',
        name: circleData?.name || "Dad's Health Circle",
        elder_name: circleData?.elder_name || "Ramesh Sharma (Age 74)",
        timezone: 'Asia/Kolkata',
        role: 'ELDER_OWNER',
        member_count: membersData?.length || 4,
        members: (membersData || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.status,
          escalation_level: 0
        }))
      }];
      return NextResponse.json(res);
    }

    // 3. /circles/:id/doses
    if (path.match(/^\/circles\/[^\/]+\/doses/)) {
      const { data } = await supabase.from('dose_events').select('*');
      const doses = (data || []).map((d: any) => ({
        id: d.id,
        circle_id: d.circle_id,
        medication_id: d.medication_id,
        medication_name: d.medication_name,
        medication_strength: d.dosage,
        scheduled_at: `${d.scheduled_date}T${d.scheduled_time}:00Z`,
        status: d.status,
        logged_at: d.logged_at,
        logged_by: d.logged_by,
        logged_by_name: d.logged_by,
        instructions: 'Take after food',
        criticality: 'HIGH',
        escalation_level: d.escalation_level || 0
      }));
      return NextResponse.json(doses);
    }

    // 4. /circles/:id/medications
    if (path.match(/^\/circles\/[^\/]+\/medications/)) {
      const { data } = await supabase.from('medications').select('*');
      const meds = (data || []).map((m: any) => ({
        id: m.id,
        circle_id: m.circle_id,
        name: m.name,
        strength: m.dosage,
        instructions: m.instructions,
        criticality: m.criticality,
        stock_count: m.stock,
        refill_threshold_days: 5,
        is_active: true,
        schedules: [{
          id: 'sch_' + m.id,
          frequency_type: 'DAILY',
          times_of_day: m.time_slots || ['09:00'],
          dose_amount: m.dosage
        }]
      }));
      return NextResponse.json(meds);
    }

    // 5. /circles/:id/members
    if (path.match(/^\/circles\/[^\/]+\/members/)) {
      const { data } = await supabase.from('circle_members').select('*');
      const members = (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        full_name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        escalation_level: 0,
        permissions: { view: true, log_doses: true }
      }));
      return NextResponse.json(members);
    }

    // 6. /circles/:id/pending-members
    if (path.match(/^\/circles\/[^\/]+\/pending-members/)) {
      const { data } = await supabase.from('circle_members').select('*').eq('status', 'PENDING');
      return NextResponse.json((data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        full_name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        escalation_level: 0
      })));
    }

    // 7. /circles/:id/passcode
    if (path.match(/^\/circles\/[^\/]+\/passcode/)) {
      return NextResponse.json({
        has_active: true,
        has_passcode: true,
        passcode: 'CARE789',
        uses: 2,
        max_uses: 5,
        expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        expires_in_hours: 48
      });
    }

    // 8. /circles/:id/reports/adherence
    if (path.match(/^\/circles\/[^\/]+\/reports\/adherence/)) {
      return NextResponse.json({
        score: 92,
        streak: 7,
        streak_days: 7,
        best_slot: 'Morning (08:30)',
        worst_slot: 'Night (21:30)',
        total_taken: 28,
        total_scheduled: 30,
        totals: { taken: 28, missed: 1, skipped: 1 },
        weekly: [
          { week: 'W1', score: 88 },
          { week: 'W2', score: 92 }
        ],
        days: [
          { date: '2026-11-10', taken: 4, missed: 0, skipped: 0 },
          { date: '2026-11-11', taken: 4, missed: 0, skipped: 0 },
          { date: '2026-11-12', taken: 3, missed: 1, skipped: 0 },
          { date: '2026-11-13', taken: 4, missed: 0, skipped: 0 },
          { date: '2026-11-14', taken: 4, missed: 0, skipped: 0 },
          { date: '2026-11-15', taken: 2, missed: 0, skipped: 0 }
        ],
        refills: [
          { medication_name: 'Calcium & Vitamin D3', days_left: 4, stock: 4, refill_threshold_days: 5 }
        ]
      });
    }

    // 9. /circles/:id/appointments
    if (path.match(/^\/circles\/[^\/]+\/appointments/)) {
      const { data } = await supabase.from('appointments').select('*');
      return NextResponse.json((data || []).map((a: any) => ({
        id: a.id,
        title: `${a.speciality} Checkup`,
        doctor_name: a.doctor_name,
        speciality: a.speciality,
        clinic: a.clinic,
        location: a.clinic,
        scheduled_at: a.date_time,
        status: 'UPCOMING',
        notes: a.notes
      })));
    }

    // 10. /circles/:id/vitals
    if (path.match(/^\/circles\/[^\/]+\/vitals/)) {
      const { data } = await supabase.from('vitals').select('*');
      return NextResponse.json((data || []).map((v: any) => ({
        id: v.id,
        type: v.type,
        value: v.value,
        unit: v.unit,
        measured_at: v.timestamp,
        status: v.status,
        alert: v.status === 'ELEVATED'
      })));
    }

    // 11. /circles/:id/emergency or /emergency/:token
    if (path.match(/\/emergency/)) {
      return NextResponse.json({
        name: 'Ramesh Sharma',
        elder_name: 'Ramesh Sharma',
        age: 74,
        blood_group: 'O+ Positive',
        allergies: ['Penicillin', 'Sulfa'],
        conditions: ['Type 2 Diabetes', 'Hypertension'],
        contacts: [
          { name: 'Sunita Verma', relation: 'Daily Caretaker', phone: '+91 98765 43210' },
          { name: 'Ananya Sharma', relation: 'Daughter', phone: '+91 98111 22334' },
          { name: 'Dr. K. Nair', relation: 'Cardiologist', phone: '+91 98222 33445' }
        ],
        hospital: 'Apollo Hospital, Sector 4, Bangalore',
        doctor_name: 'Dr. K. Nair',
        emergency_notes: 'Carries medication pouch. Mild hearing impairment in right ear.',
        notes: 'Carries medication pouch. Mild hearing impairment in right ear.',
        medications: [
          { name: 'Metformin', strength: '500 mg', instructions: 'After food', times: ['08:30 AM', '08:30 PM'] },
          { name: 'Telmisartan', strength: '40 mg', instructions: 'Before food', times: ['09:00 AM'] }
        ]
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const body = await request.json().catch(() => ({}));

  try {
    // 1. /auth/login or /auth/register
    if (path === '/auth/login' || path === '/auth/register') {
      return NextResponse.json(DEFAULT_USER);
    }

    // 2. /auth/logout
    if (path === '/auth/logout') {
      return NextResponse.json({ success: true });
    }

    // 3. /circles/join
    if (path === '/circles/join') {
      return NextResponse.json({ circle_id: 'circle_01', circle_name: "Dad's Health Circle", status: 'PENDING' });
    }

    // 4. /circles/:id/passcode/rotate
    if (path.match(/\/passcode\/rotate/)) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let passcode = 'CARE';
      for (let i = 0; i < 4; i++) passcode += chars.charAt(Math.floor(Math.random() * chars.length));
      return NextResponse.json({ passcode, expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString() });
    }

    // 5. /circles/:id/doses/:doseId/log
    if (path.match(/\/doses\/[^\/]+\/log/)) {
      const doseId = path.split('/')[4];
      const status = body.status || 'TAKEN';
      await supabase.from('dose_events').update({
        status,
        logged_at: new Date().toISOString(),
        logged_by: DEFAULT_USER.name
      }).eq('id', doseId);
      return NextResponse.json({ success: true, status });
    }

    // 6. /circles/:id/vitals
    if (path.match(/\/vitals$/)) {
      const id = 'vit_' + Date.now();
      await supabase.from('vitals').insert({
        id,
        circle_id: 'circle_01',
        type: body.type,
        value: body.value,
        unit: body.unit,
        status: 'NORMAL'
      });
      return NextResponse.json({ id, ...body });
    }

    // 7. /circles/:id/medications
    if (path.match(/\/medications$/)) {
      const id = 'med_' + Date.now();
      await supabase.from('medications').insert({
        id,
        circle_id: 'circle_01',
        name: body.name,
        dosage: body.strength || '500 mg',
        instructions: body.instructions || 'after_food',
        frequency: 'DAILY',
        time_slots: body.schedules?.[0]?.times_of_day || ['09:00'],
        stock: Number(body.stock_count) || 30,
        criticality: body.criticality || 'NORMAL'
      });
      return NextResponse.json({ id, ...body, is_active: true });
    }

    // 8. /circles/:id/members/:memberId/approve
    if (path.match(/\/members\/[^\/]+\/approve/)) {
      const memberId = path.split('/')[4];
      await supabase.from('circle_members').update({ status: 'ACTIVE' }).eq('id', memberId);
      return NextResponse.json({ id: memberId, status: 'ACTIVE' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');

  try {
    if (path.match(/\/medications\/[^\/]+$/)) {
      const medId = path.split('/')[4];
      await supabase.from('medications').delete().eq('id', medId);
      return NextResponse.json({ success: true });
    }

    if (path.match(/\/members\/[^\/]+$/)) {
      const memberId = path.split('/')[4];
      await supabase.from('circle_members').delete().eq('id', memberId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
