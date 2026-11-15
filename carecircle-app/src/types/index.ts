export type Role = 'ELDER_OWNER' | 'CARETAKER' | 'FAMILY' | 'DOCTOR_VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

export interface CircleMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: 'PENDING' | 'ACTIVE';
  joinedAt: string;
}

export interface Circle {
  id: string;
  name: string;
  elderName: string;
  passcode: string;
  passcodeExpiry: string;
  members: CircleMember[];
}

export interface Medication {
  id: string;
  circleId: string;
  name: string;
  dosage: string;
  instructions: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'as_needed';
  timeSlots: string[]; // e.g. ["08:00", "20:00"]
  stock: number;
  criticality: 'NORMAL' | 'HIGH' | 'CRITICAL';
  color: string;
}

export interface DoseEvent {
  id: string;
  medicationId: string;
  circleId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // HH:mm or ISO
  scheduledDate: string; // YYYY-MM-DD
  status: 'SCHEDULED' | 'TAKEN' | 'MISSED' | 'SKIPPED';
  loggedAt?: string;
  loggedBy?: string;
  escalationLevel?: number; // 0: None, 1: Caretaker notified, 2: Family notified
}

export interface Appointment {
  id: string;
  circleId: string;
  doctorName: string;
  speciality: string;
  clinic: string;
  dateTime: string;
  notes?: string;
}

export interface VitalLog {
  id: string;
  circleId: string;
  type: 'BP' | 'Sugar' | 'HeartRate' | 'Weight';
  value: string;
  unit: string;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  circleId: string;
  title: string;
  message: string;
  type: 'REMINDER' | 'ESCALATION' | 'REFILL' | 'APPROVAL';
  timestamp: string;
  read: boolean;
}
