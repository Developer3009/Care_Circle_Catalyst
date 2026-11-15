// WhatsApp Bot & Escalation Service for CareCircle
// Integrates with Meta WhatsApp Cloud API and Twilio WhatsApp for two-way communication

export interface WhatsAppMessagePayload {
  to: string;
  body: string;
}

export async function sendWhatsAppMessage(payload: WhatsAppMessagePayload): Promise<{ success: boolean; id?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN || "mock_whatsapp_token";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "mock_phone_id";

  // If in local/dev or credentials missing, log and return simulated delivery
  if (!process.env.WHATSAPP_API_TOKEN) {
    console.log(`[WhatsApp Outbound Mock] To: ${payload.to} | Message: ${payload.body.substring(0, 80)}...`);
    return { success: true, id: "wam_mock_" + Date.now() };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: payload.to,
        type: "text",
        text: { preview_url: true, body: payload.body },
      }),
    });

    const data = await res.json();
    return { success: res.ok, id: data?.messages?.[0]?.id };
  } catch (err: any) {
    console.error("[WhatsApp Outbound Error]", err.message);
    return { success: false };
  }
}

// Format escalation alert message for WhatsApp
export function formatEscalationWhatsAppMessage(params: {
  elderName: string;
  medicationName: string;
  strength: string;
  scheduledTime: string;
  level: number;
  minutesLate: number;
}): string {
  if (params.level === 1) {
    return (
      `⚠️ *CareCircle Alert: Medication Overdue*\n\n` +
      `*${params.elderName}* has not confirmed taking *${params.medicationName} ${params.strength}* scheduled for ${params.scheduledTime} (${params.minutesLate} mins late).\n\n` +
      `🩺 Please check in with the patient or tap below to mark taken:\n` +
      `Reply *"1"* or *"TAKEN"* to confirm.`
    );
  }

  return (
    `🚨 *CRITICAL CareCircle Escalation (Level 2)*\n\n` +
    `*${params.elderName}* missed their critical medication *${params.medicationName} ${params.strength}* scheduled for ${params.scheduledTime} (>60 mins late).\n\n` +
    `👨‍👩‍👧 Family members and emergency contacts have been notified.\n` +
    `Emergency Profile: https://carecircle.app/emergency`
  );
}
