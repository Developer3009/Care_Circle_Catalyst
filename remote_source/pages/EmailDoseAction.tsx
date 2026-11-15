import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CircleSlash, Clock3, Mail, RotateCcw } from "lucide-react";
import { fmtTime } from "@/lib/format";
import { apiErrorMessage } from "@/lib/format";
import { apiGet, apiPost } from "@/lib/api";
import type { EmailActionResult, EmailActionView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Public one-tap email action — no login; the signed token is the authorisation.
export default function EmailDoseAction() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [result, setResult] = useState<EmailActionResult | null>(null);

  const viewQuery = useQuery({
    queryKey: ["email-action", token],
    queryFn: () => apiGet<EmailActionView>(`/e/${token}`),
    retry: false,
  });

  const act = useMutation({
    mutationFn: (action: "TAKEN" | "SNOOZED" | "SKIPPED") =>
      apiPost<EmailActionResult>(`/e/${token}`, { action, note: skipReason }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["email-action", token] });
      toast.success(
        data.status === "TAKEN"
          ? `${data.medication_name} marked as taken. Thank you!`
          : data.status === "SNOOZED"
            ? `${data.medication_name} snoozed by 15 minutes.`
            : `${data.medication_name} skipped.`
      );
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const undo = useMutation({
    mutationFn: () => apiPost<EmailActionResult>(`/e/${token}/undo`),
    onSuccess: () => {
      setResult(null);
      toast.success("Undone — the dose is back on today’s timeline.");
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (viewQuery.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F8F9FA] p-6">
        <div className="h-40 w-full max-w-md animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (viewQuery.isError || !viewQuery.data) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F8F9FA] p-6" data-testid="email-action-invalid">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
          <h1 className="mt-3 font-heading text-2xl font-semibold">Link not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This dose action link is invalid, already used, or has expired (they last 2 hours). Ask the
            circle to send a fresh reminder.
          </p>
        </div>
      </div>
    );
  }

  const view = viewQuery.data;
  const blocked = view.used || view.expired || view.dose_status === "TAKEN" || view.dose_status === "SKIPPED";

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#FFFBEB] p-6" data-testid="email-action-page">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-[#FDE68A] bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" aria-hidden /> One-tap dose response
        </div>
        <div>
          <h1 className="font-heading text-3xl font-semibold" data-testid="email-action-med-name">
            {view.medication_name} {view.medication_strength}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground" data-testid="email-action-elder-line">
            {view.elder_name} · scheduled at {fmtTime(view.scheduled_at)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{view.circle_name} · status: {view.dose_status}</p>
        </div>

        {result ? (
          <div className="space-y-4 text-center" data-testid="email-action-success">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
              <Check className="h-7 w-7 text-[#15803D]" aria-hidden />
            </div>
            <p className="font-heading text-xl font-semibold">
              {result.status === "TAKEN" ? "Marked as taken" : result.status === "SNOOZED" ? "Snoozed 15 minutes" : "Marked as skipped"}
            </p>
            <p className="text-sm text-muted-foreground">The circle can see this immediately.</p>
            <Button variant="outline" onClick={() => undo.mutate()} disabled={undo.isPending} data-testid="email-action-undo-button">
              <RotateCcw className="h-4 w-4" aria-hidden /> Undo
            </Button>
          </div>
        ) : blocked ? (
          <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground" data-testid="email-action-blocked">
            {view.used
              ? "This one-tap link was already used — links are single-use for safety."
              : view.expired
                ? "This link has expired (2 hours). Ask the circle for a fresh one."
                : `This dose is already logged as ${view.dose_status}.`}
          </div>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <Button
              className="h-16 w-full text-xl font-semibold"
              onClick={() => act.mutate("TAKEN")}
              disabled={act.isPending}
              data-testid="email-action-taken-button"
            >
              <Check className="h-6 w-6" aria-hidden /> Mark as Taken
            </Button>
            <Button
              variant="outline"
              className="h-14 w-full text-lg"
              onClick={() => act.mutate("SNOOZED")}
              disabled={act.isPending}
              data-testid="email-action-snooze-button"
            >
              <Clock3 className="h-5 w-5" aria-hidden /> Snooze 15 minutes
            </Button>
            {showSkip ? (
              <div className="space-y-2 rounded-xl border p-3">
                <Textarea value={skipReason} onChange={(e) => setSkipReason(e.target.value)} placeholder="Reason (optional) — e.g. felt nauseous" data-testid="email-action-skip-reason" />
                <Button variant="secondary" className="w-full" onClick={() => act.mutate("SKIPPED")} disabled={act.isPending} data-testid="email-action-skip-confirm-button">
                  Confirm skip
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="w-full" onClick={() => setShowSkip(true)} data-testid="email-action-skip-open-button">
                <CircleSlash className="h-4 w-4" aria-hidden /> Skip with reason
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Links are single-use, expire in 2 hours, and only act on this one dose.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">About CareCircle</Link>
        </p>
      </div>
    </div>
  );
}
