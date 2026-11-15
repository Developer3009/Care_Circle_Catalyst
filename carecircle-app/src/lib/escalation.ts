import { supabase } from "@/lib/supabase";
import { formatEscalationWhatsAppMessage, sendWhatsAppMessage } from "@/lib/whatsapp";

let lastSweepTime = 0;
const THROTTLE_MS = 30 * 1000; // Throttle in-request sweeps to at most once every 30s

export async function runEscalationSweep(force = false) {
  const nowMs = Date.now();
  if (!force && nowMs - lastSweepTime < THROTTLE_MS) {
    return { skipped: true, reason: "throttled" };
  }
  lastSweepTime = nowMs;

  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  let level1Count = 0;
  let level2Count = 0;
  const notifications: string[] = [];

  try {
    // 1. Check Level 2 Escalation: Overdue > 60 minutes (Level 1 -> Level 2 Critical Missed)
    const { data: level2Doses } = await supabase
      .from("dose_events")
      .select("*")
      .eq("status", "SCHEDULED")
      .eq("escalation_level", 1)
      .lt("scheduled_at", sixtyMinsAgo);

    if (level2Doses && level2Doses.length > 0) {
      for (const dose of level2Doses) {
        await supabase
          .from("dose_events")
          .update({
            status: "MISSED",
            escalation_level: 2,
          })
          .eq("id", dose.id);

        level2Count++;

        const msg = formatEscalationWhatsAppMessage({
          elderName: "Ramesh Sharma",
          medicationName: dose.medication_name || "Prescription",
          strength: dose.medication_strength || "",
          scheduledTime: new Date(dose.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          level: 2,
          minutesLate: Math.round((now.getTime() - new Date(dose.scheduled_at).getTime()) / 60000),
        });

        await sendWhatsAppMessage({ to: "919811122334", body: msg });
        notifications.push(`L2 Emergency sent for dose ${dose.id}`);
      }
    }

    // 2. Check Level 1 Escalation: Overdue > 30 minutes (Level 0 -> Level 1 Warning)
    const { data: level1Doses } = await supabase
      .from("dose_events")
      .select("*")
      .eq("status", "SCHEDULED")
      .eq("escalation_level", 0)
      .lt("scheduled_at", thirtyMinsAgo);

    if (level1Doses && level1Doses.length > 0) {
      for (const dose of level1Doses) {
        await supabase
          .from("dose_events")
          .update({
            escalation_level: 1,
          })
          .eq("id", dose.id);

        level1Count++;

        const msg = formatEscalationWhatsAppMessage({
          elderName: "Ramesh Sharma",
          medicationName: dose.medication_name || "Prescription",
          strength: dose.medication_strength || "",
          scheduledTime: new Date(dose.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          level: 1,
          minutesLate: Math.round((now.getTime() - new Date(dose.scheduled_at).getTime()) / 60000),
        });

        await sendWhatsAppMessage({ to: "919876543210", body: msg });
        notifications.push(`L1 Alert sent to Caretaker for dose ${dose.id}`);
      }
    }

    return {
      success: true,
      checked_at: now.toISOString(),
      level_1_escalated: level1Count,
      level_2_missed: level2Count,
      notifications_dispatched: notifications.length,
      details: notifications,
    };
  } catch (err: any) {
    console.error("[Escalation Sweep Error]", err.message);
    return { error: err.message };
  }
}
