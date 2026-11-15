const { Client } = require('pg');

async function seed() {
  const connectionString = 'postgresql://postgres:Care_Circle_30@db.xuedgbtguelwqeorhtte.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Seeding initial data to Supabase...');

    // Clear existing for clean start
    await client.query('DELETE FROM dose_events');
    await client.query('DELETE FROM medications');
    await client.query('DELETE FROM circle_members');
    await client.query('DELETE FROM circles');
    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM vitals');
    await client.query('DELETE FROM notifications');

    // 1. Circle
    await client.query(`
      INSERT INTO circles (id, name, elder_name, passcode, passcode_expiry)
      VALUES ('circle_01', 'Dad''s Health Circle', 'Ramesh Sharma (Age 74)', 'CARE789', NOW() + INTERVAL '48 hours')
    `);

    // 2. Members
    await client.query(`
      INSERT INTO circle_members (id, circle_id, user_id, name, email, role, status) VALUES
      ('m1', 'circle_01', 'usr_elder_01', 'Ramesh Sharma', 'ramesh.sharma@example.com', 'ELDER_OWNER', 'ACTIVE'),
      ('m2', 'circle_01', 'usr_care_01', 'Sunita Verma', 'sunita.care@gmail.com', 'CARETAKER', 'ACTIVE'),
      ('m3', 'circle_01', 'usr_fam_01', 'Ananya Sharma (Daughter)', 'ananya.sharma@gmail.com', 'FAMILY', 'ACTIVE'),
      ('m4', 'circle_01', 'usr_fam_02', 'Dr. K. Nair', 'dr.nair.cardio@apollo.org', 'DOCTOR_VIEWER', 'PENDING')
    `);

    // 3. Medications
    await client.query(`
      INSERT INTO medications (id, circle_id, name, dosage, instructions, frequency, time_slots, stock, criticality, color) VALUES
      ('med_01', 'circle_01', 'Metformin Hydrochloride', '500 mg', 'after_food', 'twice_daily', ARRAY['08:30', '20:30'], 14, 'CRITICAL', 'emerald'),
      ('med_02', 'circle_01', 'Telmisartan (Blood Pressure)', '40 mg', 'before_food', 'daily', ARRAY['09:00'], 22, 'CRITICAL', 'blue'),
      ('med_03', 'circle_01', 'Calcium & Vitamin D3', '1 Tablet', 'with_food', 'daily', ARRAY['13:00'], 4, 'NORMAL', 'amber'),
      ('med_04', 'circle_01', 'Atorvastatin (Cholesterol)', '10 mg', 'after_food', 'daily', ARRAY['21:30'], 18, 'HIGH', 'purple')
    `);

    // 4. Dose events for today
    await client.query(`
      INSERT INTO dose_events (id, medication_id, circle_id, medication_name, dosage, scheduled_time, scheduled_date, status, logged_at, logged_by) VALUES
      ('dose_01', 'med_01', 'circle_01', 'Metformin Hydrochloride', '500 mg', '08:30 AM', CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '4 hours', 'Ramesh Sharma'),
      ('dose_02', 'med_02', 'circle_01', 'Telmisartan (Blood Pressure)', '40 mg', '09:00 AM', CURRENT_DATE, 'TAKEN', NOW() - INTERVAL '3 hours 30 minutes', 'Ramesh Sharma'),
      ('dose_03', 'med_03', 'circle_01', 'Calcium & Vitamin D3', '1 Tablet', '01:00 PM', CURRENT_DATE, 'SCHEDULED', NULL, NULL),
      ('dose_04', 'med_01', 'circle_01', 'Metformin Hydrochloride', '500 mg', '08:30 PM', CURRENT_DATE, 'SCHEDULED', NULL, NULL),
      ('dose_05', 'med_04', 'circle_01', 'Atorvastatin (Cholesterol)', '10 mg', '09:30 PM', CURRENT_DATE, 'SCHEDULED', NULL, NULL)
    `);

    // 5. Appointments
    await client.query(`
      INSERT INTO appointments (id, circle_id, doctor_name, speciality, clinic, date_time, notes) VALUES
      ('apt_01', 'circle_01', 'Dr. K. Nair', 'Cardiologist', 'Apollo Clinic, Sector 4', 'Tomorrow at 10:30 AM', 'Bring recent Blood Pressure and Lipid profile reports.'),
      ('apt_02', 'circle_01', 'Dr. Meenakshi Sundaram', 'Endocrinologist', 'CareMax Diabetes Center', 'Thursday, 20 Nov at 4:00 PM', 'Routine HbA1c review.')
    `);

    // 6. Vitals
    await client.query(`
      INSERT INTO vitals (id, circle_id, type, value, unit, status) VALUES
      ('vit_01', 'circle_01', 'BP', '124/82', 'mmHg', 'NORMAL'),
      ('vit_02', 'circle_01', 'Sugar', '118', 'mg/dL (Fasting)', 'NORMAL'),
      ('vit_03', 'circle_01', 'HeartRate', '72', 'bpm', 'NORMAL')
    `);

    // 7. Notifications
    await client.query(`
      INSERT INTO notifications (id, circle_id, title, message, type, read) VALUES
      ('notif_01', 'circle_01', 'Refill Warning', 'Calcium & Vitamin D3 has only 4 tablets remaining (~4 days). Caretaker notified.', 'REFILL', FALSE),
      ('notif_02', 'circle_01', 'Dr. K. Nair requested Circle access', 'Approval pending from Elder in Consent Center.', 'APPROVAL', FALSE),
      ('notif_03', 'circle_01', 'Dose Confirmation', 'Morning Metformin & Telmisartan marked Taken on time (Adherence 100% this week).', 'REMINDER', TRUE)
    `);

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

seed();
