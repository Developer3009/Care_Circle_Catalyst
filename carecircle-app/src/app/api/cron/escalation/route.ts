import { NextResponse } from "next/server";
import { runEscalationSweep } from "@/lib/escalation";

// Automated Escalation Cron Worker
// Evaluates overdue doses and cascades alerts from Caretaker (L1) -> Family/Emergency (L2)

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, enforce secret bearer token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
  }

  const result = await runEscalationSweep(true);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
