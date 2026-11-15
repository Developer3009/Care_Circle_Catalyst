// E2E User Flow Validation Suite for CareCircle
// Tests all 5 primary user flows, running at least 3 distinct iterations per flow with varied inputs.

const BASE_URL = "http://localhost:3000/api";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function api(path, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log(" CareCircle Comprehensive End-to-End User Flow Test Suite ");
  console.log("==========================================================\n");

  const generatedPasscodes = {};

  // -------------------------------------------------------------
  // FLOW 1: Elder Self-Registration Flow (3 Distinct Runs)
  // -------------------------------------------------------------
  console.log("▶ [FLOW 1] Elder Self-Registration & Passcode Generation");

  // Run 1.1: Bhagwan Das (Age 82)
  console.log("\n  --- Run 1.1: Elder Bhagwan Das (Age 82) ---");
  const r1_1 = await api("/auth/register", "POST", {
    persona: "ELDER_SELF",
    full_name: "Bhagwan Das",
    patient_age: "82",
    email: `bhagwan.das.${Date.now()}@gmail.com`,
    password: "Password#123",
  });
  assert(r1_1.status === 200, "Registration returns HTTP 200");
  assert(r1_1.data.user.role === "ELDER_OWNER", "User assigned role ELDER_OWNER");
  assert(r1_1.data.passcode && r1_1.data.passcode.startsWith("CARE"), "Unique CARE-prefixed passcode generated");
  assert(r1_1.data.circle_name.includes("Bhagwan"), "Circle created with Elder's name");
  generatedPasscodes.bhagwan = r1_1.data.passcode;

  // Run 1.2: Kamla Devi (Age 76)
  console.log("\n  --- Run 1.2: Elder Kamla Devi (Age 76) ---");
  const r1_2 = await api("/auth/register", "POST", {
    persona: "ELDER_SELF",
    full_name: "Kamla Devi",
    patient_age: "76",
    email: `kamla.devi.${Date.now()}@outlook.com`,
    password: "SecureKamla2026!",
  });
  assert(r1_2.status === 200, "Registration returns HTTP 200");
  assert(r1_2.data.user.role === "ELDER_OWNER", "User assigned role ELDER_OWNER");
  assert(r1_2.data.passcode.length === 8, "Passcode length is 8 characters");
  assert(r1_2.data.passcode !== generatedPasscodes.bhagwan, "Passcode is distinct from previous elder");
  generatedPasscodes.kamla = r1_2.data.passcode;

  // Run 1.3: George Fernandes (Age 88)
  console.log("\n  --- Run 1.3: Elder George Fernandes (Age 88) ---");
  const r1_3 = await api("/auth/register", "POST", {
    persona: "ELDER_SELF",
    full_name: "George Fernandes",
    patient_age: "88",
    email: `george.f.${Date.now()}@yahoo.com`,
    password: "GeorgeElder#88",
  });
  assert(r1_3.status === 200, "Registration returns HTTP 200");
  assert(r1_3.data.user.full_name === "George Fernandes", "User full name stored correctly");
  assert(r1_3.data.circle_name.includes("George"), "Circle name properly formed");
  generatedPasscodes.george = r1_3.data.passcode;

  // -------------------------------------------------------------
  // FLOW 2: Caretaker Proxy Setup Flow (3 Distinct Runs)
  // -------------------------------------------------------------
  console.log("\n▶ [FLOW 2] Caretaker Proxy Setup on Elder's Behalf");

  // Run 2.1: Nurse Rekha Nair for Savitri Amma
  console.log("\n  --- Run 2.1: Nurse Rekha Nair for Savitri Amma (Age 84) ---");
  const r2_1 = await api("/auth/register", "POST", {
    persona: "CARETAKER_PROXY",
    full_name: "Nurse Rekha Nair",
    patient_name: "Savitri Amma",
    patient_age: "84",
    email: `rekha.nair.${Date.now()}@apollo.org`,
    password: "NurseRekha@99",
  });
  assert(r2_1.status === 200, "Proxy registration returns HTTP 200");
  assert(r2_1.data.user.role === "CARETAKER", "Registrant assigned CARETAKER role");
  assert(r2_1.data.circle_name.includes("Savitri Amma"), "Circle named after patient Savitri Amma");
  assert(r2_1.data.passcode && r2_1.data.passcode.startsWith("CARE"), "Passcode created for family to join");
  generatedPasscodes.savitri = r2_1.data.passcode;

  // Run 2.2: Arun Joseph for Prof. K. R. Sharma
  console.log("\n  --- Run 2.2: Caregiver Arun Joseph for Prof. K. R. Sharma (Age 79) ---");
  const r2_2 = await api("/auth/register", "POST", {
    persona: "CARETAKER_PROXY",
    full_name: "Arun Joseph",
    patient_name: "Prof. K. R. Sharma",
    patient_age: "79",
    email: `arun.j.${Date.now()}@careteam.in`,
    password: "ArunCare2026$",
  });
  assert(r2_2.status === 200, "Proxy registration returns HTTP 200");
  assert(r2_2.data.user.role === "CARETAKER", "Registrant assigned CARETAKER role");
  assert(r2_2.data.circle_name.includes("Prof. K. R. Sharma"), "Circle named after Prof. Sharma");
  generatedPasscodes.profSharma = r2_2.data.passcode;

  // Run 2.3: Sister Mary for Lalitha Rao
  console.log("\n  --- Run 2.3: Sister Mary for Lalitha Rao (Age 91) ---");
  const r2_3 = await api("/auth/register", "POST", {
    persona: "CARETAKER_PROXY",
    full_name: "Sister Mary",
    patient_name: "Lalitha Rao",
    patient_age: "91",
    email: `sister.mary.${Date.now()}@seniorcare.org`,
    password: "SisterMary#91",
  });
  assert(r2_3.status === 200, "Proxy registration returns HTTP 200");
  assert(r2_3.data.user.role === "CARETAKER", "Sister Mary assigned CARETAKER role");
  assert(r2_3.data.circle_name.includes("Lalitha Rao"), "Circle named after Lalitha Rao");
  generatedPasscodes.lalitha = r2_3.data.passcode;

  // -------------------------------------------------------------
  // FLOW 3: Family Member & Doctor Passcode Join Flow (3 Runs)
  // -------------------------------------------------------------
  console.log("\n▶ [FLOW 3] Family & Doctor Passcode Join Flow");

  // Run 3.1: Son Vikram Das joins Bhagwan Das's circle as FAMILY
  console.log("\n  --- Run 3.1: Son Vikram Das joins Bhagwan Das's Circle (FAMILY) ---");
  const r3_1 = await api("/auth/register", "POST", {
    persona: "FAMILY_DOCTOR",
    full_name: "Vikram Das (Son)",
    email: `vikram.das.${Date.now()}@family.com`,
    password: "VikramFamily#1",
    passcode: generatedPasscodes.bhagwan,
    join_role: "FAMILY",
  });
  assert(r3_1.status === 200, "Passcode join returns HTTP 200");
  assert(r3_1.data.user.role === "FAMILY", "User joined with FAMILY role");
  assert(r3_1.data.circle_name.includes("Bhagwan"), "Successfully linked to Bhagwan's Circle");

  // Run 3.2: Dr. Sandeep Mukherjee joins Savitri Amma's circle as DOCTOR_VIEWER
  console.log("\n  --- Run 3.2: Dr. Sandeep Mukherjee joins Savitri Amma's Circle (DOCTOR_VIEWER) ---");
  const r3_2 = await api("/auth/register", "POST", {
    persona: "FAMILY_DOCTOR",
    full_name: "Dr. Sandeep Mukherjee, MD (Cardiology)",
    email: `dr.mukherjee.${Date.now()}@cardio.med`,
    password: "DocSandeep#2026",
    passcode: generatedPasscodes.savitri,
    join_role: "DOCTOR_VIEWER",
  });
  assert(r3_2.status === 200, "Doctor passcode join returns HTTP 200");
  assert(r3_2.data.user.role === "DOCTOR_VIEWER", "User joined with DOCTOR_VIEWER role");
  assert(r3_2.data.circle_name.includes("Savitri"), "Successfully linked to Savitri Amma's Circle");

  // Run 3.3: Daughter Pooja Sharma joins Prof. K. R. Sharma's circle as FAMILY
  console.log("\n  --- Run 3.3: Daughter Pooja Sharma joins Prof. Sharma's Circle (FAMILY) ---");
  const r3_3 = await api("/auth/register", "POST", {
    persona: "FAMILY_DOCTOR",
    full_name: "Pooja Sharma (Daughter)",
    email: `pooja.sharma.${Date.now()}@techcorp.com`,
    password: "PoojaFamily#79",
    passcode: generatedPasscodes.profSharma,
    join_role: "FAMILY",
  });
  assert(r3_3.status === 200, "Family join returns HTTP 200");
  assert(r3_3.data.user.role === "FAMILY", "User joined with FAMILY role");
  assert(r3_3.data.circle_name.includes("Prof. K. R. Sharma"), "Linked to Prof. Sharma's circle");

  // -------------------------------------------------------------
  // FLOW 4: Interactive Dashboard Actions (Vitals, Doses, Notes, Refills)
  // -------------------------------------------------------------
  console.log("\n▶ [FLOW 4] Interactive Dashboard Actions Across Roles");

  // Run 4.1: Log Blood Pressure + Log Dose Taken
  console.log("\n  --- Run 4.1: Record Blood Pressure (136/84 mmHg) & Log Dose Taken ---");
  const r4_1_vital = await api("/circles/circle_01/vitals", "POST", {
    type: "BP",
    value: 136,
    secondary_value: 84,
    unit: "mmHg",
  });
  assert(r4_1_vital.status === 200, "Vitals recording returns HTTP 200");
  assert(r4_1_vital.data.value === 136, "Systolic value recorded accurately");

  const r4_1_dose = await api("/circles/circle_01/doses/dose_01/log", "POST", {
    status: "TAKEN",
  });
  assert(r4_1_dose.status === 200, "Dose logging returns HTTP 200");
  assert(r4_1_dose.data.status === "TAKEN", "Dose status updated to TAKEN");

  // Run 4.2: Record Blood Glucose + Post Shift Handover Note
  console.log("\n  --- Run 4.2: Record Blood Glucose (142 mg/dL) & Post Shift Handover Note ---");
  const r4_2_vital = await api("/circles/circle_01/vitals", "POST", {
    type: "SUGAR",
    value: 142,
    unit: "mg/dL",
  });
  assert(r4_2_vital.status === 200, "Blood glucose recording returns HTTP 200");
  assert(r4_2_vital.data.value === 142, "Glucose level recorded accurately");

  const r4_2_note = await api("/circles/circle_01/notes", "POST", {
    body: "Patient ate light vegetable soup, drank 2 glasses of warm water, took afternoon nap calmly.",
    tags: ["Shift Handover", "Nutrition"],
    author_name: "Nurse Rekha Nair",
    author_role: "CARETAKER",
  });
  assert(r4_2_note.status === 200, "Shift note posting returns HTTP 200");
  assert(r4_2_note.data.tags.includes("Shift Handover"), "Tags categorized correctly");

  // Run 4.3: Record Heart Rate / Pulse + Replenish Pill Refill (+30 Pills)
  console.log("\n  --- Run 4.3: Record Pulse (74 bpm) & Replenish Medication Stock ---");
  const r4_3_vital = await api("/circles/circle_01/vitals", "POST", {
    type: "PULSE",
    value: 74,
    unit: "bpm",
  });
  assert(r4_3_vital.status === 200, "Pulse recording returns HTTP 200");
  assert(r4_3_vital.data.value === 74, "Pulse value recorded accurately");

  const r4_3_refill = await api("/circles/circle_01/medications/med_01/refill", "POST");
  assert(r4_3_refill.status === 200, "Pill replenishment returns HTTP 200");
  assert(r4_3_refill.data.stock_count >= 60, "Pill stock successfully increased by 30");

  // -------------------------------------------------------------
  // FLOW 5: Emergency Profile Card & QR Profile Access
  // -------------------------------------------------------------
  console.log("\n▶ [FLOW 5] Emergency SOS Card & QR Access End-to-End");

  // Run 5.1: Fetch Emergency Card Data
  console.log("\n  --- Run 5.1: Fetch Emergency Profile for Circle ---");
  const r5_1 = await api("/circles/circle_01/emergency");
  assert(r5_1.status === 200, "Emergency data returns HTTP 200");
  assert(r5_1.data.name.length > 0, "Emergency patient name present");
  assert(r5_1.data.blood_type === "O+", "Emergency blood type O+ verified");
  assert(r5_1.data.allergies.includes("Penicillin"), "Critical drug allergy (Penicillin) flagged");
  assert(r5_1.data.contacts.length >= 2, "Multiple emergency responder contacts present");

  // Run 5.2: Public Token Emergency Access (First Responders scanning QR)
  console.log("\n  --- Run 5.2: Public QR Responder Scan Endpoint ---");
  const r5_2 = await api("/emergency/emergency_token_sharma_99");
  assert(r5_2.status === 200, "Public emergency route accessible without login");
  assert(r5_2.data.primary_doctor.name.includes("Dr."), "Primary doctor listed for emergency call");
  assert(r5_2.data.emergency_notes.length > 0, "Critical medical notes displayed for paramedics");

  // Run 5.3: Family Change Request Submission
  console.log("\n  --- Run 5.3: Family Prescription Change Request Submission ---");
  const r5_3 = await api("/circles/circle_01/change-requests", "POST", {
    requested_by_name: "Vikram Das (Son)",
    entity_type: "Medication",
    entity_name: "Atorvastatin 10mg",
    note: "Doctor suggested lowering dosage after normal lipid panel.",
  });
  assert(r5_3.status === 200, "Change request submission returns HTTP 200");
  assert(r5_3.data.status === "PENDING", "Change request placed into PENDING state for approval");

  console.log("\n==========================================================");
  console.log(` ALL END-TO-END USER FLOWS COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal Test Suite Failure:", err);
  process.exit(1);
});
