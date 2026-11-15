// Frontend mirror of backend/lib/permissions.py — hides actions the API would
// reject anyway. The API remains the source of truth.

const DEFAULTS: Record<string, Record<string, boolean | string>> = {
  ELDER_OWNER: {
    view: true,
    edit_medications: true,
    log_doses: true,
    add_vitals: true,
    add_notes: true,
    edit_appointments: true,
    manage_members: true,
    edit_emergency: true,
    view_audit: true,
    manage_tasks: true,
    create_change_requests: false,
  },
  CARETAKER: {
    view: true,
    edit_medications: true,
    log_doses: true,
    add_vitals: true,
    add_notes: true,
    edit_appointments: true,
    manage_members: false,
    edit_emergency: false,
    view_audit: true,
    manage_tasks: true,
    create_change_requests: false,
  },
  FAMILY: {
    view: true,
    edit_medications: "request",
    log_doses: true,
    add_vitals: false,
    add_notes: true,
    edit_appointments: true,
    manage_members: false,
    edit_emergency: false,
    view_audit: false,
    manage_tasks: false,
    create_change_requests: true,
  },
  DOCTOR_VIEWER: {
    view: true,
    edit_medications: false,
    log_doses: false,
    add_vitals: false,
    add_notes: false,
    edit_appointments: false,
    manage_members: false,
    edit_emergency: false,
    view_audit: false,
    manage_tasks: false,
    create_change_requests: false,
  },
};

export function can(
  member: { role?: string; permissions?: Record<string, unknown> } | null | undefined,
  action: string
): boolean {
  if (!member) return false;
  const overrides = member.permissions ?? {};
  const value = overrides[action] ?? DEFAULTS[member.role ?? ""]?.[action] ?? false;
  return value === true;
}

export function isRequestOnly(
  member: { role?: string; permissions?: Record<string, unknown> } | null | undefined,
  action: string
): boolean {
  if (!member) return false;
  const overrides = member.permissions ?? {};
  const value = overrides[action] ?? DEFAULTS[member.role ?? ""]?.[action] ?? false;
  return value === "request";
}

export const ROLE_LABELS: Record<string, string> = {
  ELDER_OWNER: "Elder Owner",
  CARETAKER: "Caretaker",
  FAMILY: "Family",
  DOCTOR_VIEWER: "Doctor · Read-only",
};

export const CRITICALITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const INSTRUCTIONS_LABELS: Record<string, string> = {
  BEFORE_FOOD: "Before food",
  AFTER_FOOD: "After food",
  WITH_FOOD: "With food",
};
