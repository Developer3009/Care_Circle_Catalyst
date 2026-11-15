export interface UserOut {
  id: string;
  email: string;
  name: string;
  full_name: string;
  phone?: string | null;
  role: string;
}

export interface CircleMemberOut {
  id: string;
  user_id: string;
  name: string;
  full_name?: string;
  email: string;
  role: string;
  status: string;
  escalation_level: number;
  joined_at?: string;
  permissions?: Record<string, boolean>;
}

export interface CircleOut {
  id: string;
  name: string;
  elder_name: string;
  timezone: string;
  role?: string;
  member_count?: number;
  passcode?: string;
  passcode_expires_at?: string;
  members: CircleMemberOut[];
}

export interface MedicationScheduleOut {
  id: string;
  frequency_type: "DAILY" | "SPECIFIC_DAYS" | "INTERVAL" | "AS_NEEDED";
  times_of_day: string[];
  days_of_week?: number[];
  interval_days?: number;
  dose_amount: string;
  grace_minutes?: number;
  lead_minutes?: number;
}

export interface InteractionWarning {
  severity: "LOW" | "MODERATE" | "MEDIUM" | "HIGH" | "SEVERE";
  message: string;
  with_medication?: string;
}

export interface MedicationOut {
  id: string;
  circle_id: string;
  name: string;
  generic_name?: string;
  strength: string;
  form?: string;
  instructions: string;
  criticality: "LOW" | "NORMAL" | "MEDIUM" | "HIGH" | "CRITICAL";
  stock_count: number;
  refill_threshold_days?: number;
  start_date?: string;
  end_date?: string | null;
  schedules: MedicationScheduleOut[];
  is_active: boolean;
}

export interface DoseOut {
  id: string;
  circle_id: string;
  medication_id: string;
  medication_name: string;
  medication_strength: string;
  scheduled_at: string;
  status: "SCHEDULED" | "TAKEN" | "MISSED" | "SKIPPED";
  logged_at?: string | null;
  logged_by?: string | null;
  logged_by_name?: string | null;
  instructions?: string;
  criticality?: "LOW" | "NORMAL" | "MEDIUM" | "HIGH" | "CRITICAL";
  escalation_level?: number;
  note?: string | null;
  source?: string | null;
}

export interface AdherenceDayOut {
  date: string;
  taken: number;
  missed: number;
  skipped: number;
}

export interface AdherenceRefillOut {
  medication_id?: string;
  medication_name: string;
  name?: string;
  strength?: string;
  days_left: number;
  stock: number;
  stock_count?: number;
  doses_per_day?: number;
  refill_threshold_days?: number;
}

export interface AdherenceOut {
  score: number;
  streak: number;
  streak_days?: number;
  best_slot?: string;
  worst_slot?: string;
  totals?: {
    taken: number;
    missed: number;
    skipped: number;
  };
  weekly?: Array<{
    week: string;
    score: number;
  }>;
  total_taken: number;
  total_scheduled: number;
  days: AdherenceDayOut[];
  refills?: AdherenceRefillOut[];
  refill_predictions?: AdherenceRefillOut[];
}

export interface DoctorOut {
  id: string;
  name: string;
  speciality: string;
  clinic: string;
  phone?: string;
}

export interface AppointmentOut {
  id: string;
  doctor_id?: string;
  title?: string;
  doctor_name: string;
  speciality: string;
  clinic: string;
  location?: string;
  scheduled_at: string;
  status?: string;
  notes?: string;
}

export interface VitalOut {
  id: string;
  type: string;
  value: string;
  secondary_value?: string | null;
  unit: string;
  measured_at: string;
  status?: string;
  alert?: boolean;
  recorded_by_name?: string;
}

export interface CareNoteOut {
  id: string;
  body: string;
  tags?: string[];
  author_name: string;
  author_role?: string;
  created_at: string;
}

export interface RoutineTaskOut {
  id: string;
  title: string;
  schedule?: string;
  time_of_day: string;
  completed: boolean;
  last_completed_at?: string | null;
}

export interface MemberOut {
  id: string;
  user_id: string;
  name: string;
  full_name?: string;
  email: string;
  role: string;
  status: string;
  escalation_level: number;
  permissions?: Record<string, boolean>;
}

export interface PasscodeOut {
  passcode: string;
  expires_at: string;
  max_uses?: number;
}

export interface PasscodeStatus {
  has_active: boolean;
  has_passcode?: boolean;
  uses?: number;
  max_uses?: number;
  expires_at?: string;
  expires_in_hours?: number;
}

export interface AuditOut {
  id: string;
  actor_name: string;
  actor_role?: string;
  action: string;
  entity: string;
  after_json?: any;
  created_at: string;
}

export interface ChangeRequestOut {
  id: string;
  requested_by_name: string;
  entity_type: string;
  entity_name?: string;
  note?: string;
  payload: any;
  status: string;
  decided_at?: string;
  created_at: string;
}

export interface EmergencyContactIO {
  name: string;
  relation: string;
  phone: string;
  priority?: number;
}

export interface EmergencyOut {
  name: string;
  elder_name?: string;
  age: number;
  blood_group: string;
  allergies: string[];
  conditions: string[];
  contacts: EmergencyContactIO[];
  hospital_preference?: string;
  hospital?: string;
  doctor_name?: string;
  emergency_notes?: string;
  emergency_token?: string;
  enabled?: boolean;
  notes?: string;
  medications?: Array<{
    name: string;
    strength: string;
    instructions: string;
    times?: string[];
  }>;
  active_medications?: Array<{
    name: string;
    strength: string;
    instructions: string;
    times?: string[];
  }>;
}

export interface EmailActionResult {
  success: boolean;
  message: string;
  status?: string;
  medication_name?: string;
}

export interface EmailActionView {
  medication_name: string;
  medication_strength?: string;
  dosage: string;
  action: string;
  elder_name?: string;
  circle_name?: string;
  scheduled_at?: string;
  used?: boolean;
  expired?: boolean;
  dose_status?: string;
}

export interface JoinOut {
  circle_id: string;
  circle_name: string;
  status: string;
}
