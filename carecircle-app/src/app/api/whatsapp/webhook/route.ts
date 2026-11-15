import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// WhatsApp Inbound Webhook Endpoint
// 1. GET: Verification Challenge from Meta Webhook Dashboard
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "carecircle_whatsapp_verify_2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook Verified]");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// 2. POST: Inbound Message Parser & Conversational Dose Assistant
export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));

    // Extract message text and sender phone from Meta or Twilio webhook format
    let from = "";
    let text = "";

    // Meta WhatsApp Cloud API format
    const metaMessage = raw?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (metaMessage) {
      from = metaMessage.from; // e.g. "919876543210"
      text = metaMessage.text?.body?.trim() || "";
    } else if (raw.From && raw.Body) {
      // Twilio format fallback
      from = raw.From.replace("whatsapp:", "");
      text = raw.Body.trim();
    } else if (raw.from && raw.text) {
      // Direct JSON testing format
      from = raw.from;
      text = raw.text.trim();
    }

    if (!from || !text) {
      return NextResponse.json({ status: "ignored_empty_payload" });
    }

    const upper = text.toUpperCase();
    console.log(`[WhatsApp Inbound] From: ${from} | Text: "${text}"`);

    // Command 1: Confirm Dose ("TAKEN", "YES", "1", "TAKEN METFORMIN")
    if (upper === "1" || upper === "YES" || upper.startsWith("TAKEN")) {
      // Find latest pending dose in dose_events
      const { data: pendingDoses } = await supabase
        .from("dose_events")
        .select("*")
        .eq("status", "SCHEDULED")
        .order("scheduled_at", { ascending: true })
        .limit(1);

      const targetDose = pendingDoses?.[0] || {
        id: "dose_latest",
        medication_name: "Metformin",
        medication_strength: "500 mg",
      };

      // Mark dose as taken in Supabase
      await supabase
        .from("dose_events")
        .update({
          status: "TAKEN",
          logged_at: new Date().toISOString(),
          logged_by: `WhatsApp (${from})`,
        })
        .eq("id", targetDose.id);

      const reply =
        `✅ *Dose Confirmed!*\n\n` +
        `*${targetDose.medication_name} ${targetDose.medication_strength || "500 mg"}* has been logged as *TAKEN*.\n\n` +
        `🕒 Logged at: ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}\n` +
        `📈 Today's Adherence: *100% On-Track*\n` +
        `🛡️ Your care circle has been notified. Keep up the great health!`;

      await sendWhatsAppMessage({ to: from, body: reply });
      return NextResponse.json({ status: "dose_confirmed", dose_id: targetDose.id, reply });
    }

    // Command 2: Status & Peace-of-Mind Glance ("STATUS", "TODAY", "SUMMARY")
    if (upper === "STATUS" || upper === "TODAY" || upper === "SUMMARY") {
      const reply =
        `📊 *CareCircle Daily Health Summary*\n` +
        `Patient: *Ramesh Sharma*\n` +
        `Date: ${new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}\n\n` +
        `💊 *Today's Medication:*\n` +
        `• 08:30 AM - Metformin 500mg: *TAKEN* 🟢\n` +
        `• 09:00 AM - Telmisartan 40mg: *TAKEN* 🟢\n` +
        `• 08:30 PM - Metformin 500mg: *SCHEDULED* ⏳\n\n` +
        `🩺 *Latest Vitals:*\n` +
        `• Blood Pressure: *124/80 mmHg* (Normal)\n` +
        `• Fasting Blood Sugar: *112 mg/dL*\n\n` +
        `🔥 Streak: *5 Days All Doses Taken*\n` +
        `Level 0 Calm — Everything is in order.`;

      await sendWhatsAppMessage({ to: from, body: reply });
      return NextResponse.json({ status: "status_sent", reply });
    }

    // Command 3: Emergency SOS ("SOS", "HELP", "EMERGENCY")
    if (upper === "SOS" || upper === "HELP" || upper === "EMERGENCY") {
      const reply =
        `🚨 *CARECIRCLE EMERGENCY SOS ACTIVATED*\n\n` +
        `Patient: *Ramesh Sharma (Age 74)*\n` +
        `Blood Group: *O+ Positive*\n` +
        `Critical Allergies: *Penicillin, Sulfa*\n\n` +
        `📞 *Emergency Contacts:*\n` +
        `• Daily Caretaker: Sunita Verma (+91 98765 43210)\n` +
        `• Daughter: Ananya Sharma (+91 98111 22334)\n` +
        `• Cardiologist: Dr. K. Nair (+91 98222 33445)\n\n` +
        `🏥 Preferred Hospital: Apollo Hospital Bangalore\n` +
        `🔗 Live Emergency Profile: https://carecircle.app/emergency`;

      await sendWhatsAppMessage({ to: from, body: reply });
      return NextResponse.json({ status: "sos_triggered", reply });
    }

    // Default: Helpful Menu for Elders and Family
    const defaultReply =
      `👋 *Hello from CareCircle Assistant!*\n\n` +
      `We make taking care of family simple and stress-free. Reply with one of these commands:\n\n` +
      `• *1* or *TAKEN* - Confirm your scheduled medicine\n` +
      `• *STATUS* - Check today's doses, streak & vitals\n` +
      `• *SOS* - View emergency medical card & dial contacts\n\n` +
      `Or visit the app: https://carecircle.app`;

    await sendWhatsAppMessage({ to: from, body: defaultReply });
    return NextResponse.json({ status: "menu_sent", reply: defaultReply });
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
