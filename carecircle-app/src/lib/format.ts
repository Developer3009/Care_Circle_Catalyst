// Display-only formatting helpers. All "today"/range math lives on the server
// (backend/lib/dates.py + dosing engine) — these only render what the API sent.
import { ApiError } from "./api";

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
}

export function relativeFromNow(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diffMs / 60000);
  const abs = Math.abs(mins);
  if (abs < 1) return "just now";
  if (abs < 60) return mins > 0 ? `in ${abs} min` : `${abs} min ago`;
  const hours = Math.round(abs / 60);
  if (hours < 24) return mins > 0 ? `in ${hours} h` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return mins > 0 ? `in ${days} d` : `${days} d ago`;
}

// Extracts the human message from an ApiError (FastAPI detail may be a string,
// a {code, message} dict, or a 422 validation list).
export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = (err.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "message" in (detail as Record<string, unknown>)) {
      return String((detail as Record<string, unknown>).message);
    }
    if (Array.isArray(detail)) return detail.map((d) => String(d)).join("; ");
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

// True when the backend answered 403 CHANGE_REQUEST_REQUIRED (family edit rule).
export function isChangeRequestRequired(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const detail = (err.body as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" && detail.includes("CHANGE_REQUEST_REQUIRED");
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
