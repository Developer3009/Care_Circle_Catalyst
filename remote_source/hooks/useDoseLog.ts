import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { speak } from "@/lib/tts";
import type { DoseOut } from "@/lib/types";

type DoseStatus = "TAKEN" | "SNOOZED" | "SKIPPED";

// Shared one-tap dose logging — invalidates the doses + adherence queries and
// (in Elder Mode) speaks a spoken confirmation.
export function useDoseLog(circleId: string | null, elderVoice = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dose, status }: { dose: DoseOut; status: DoseStatus }) =>
      apiPost<DoseOut>(`/doses/${dose.id}/log`, { status }),
    onSuccess: (updated, vars) => {
      if (circleId) {
        queryClient.invalidateQueries({ queryKey: ["doses", circleId] });
        queryClient.invalidateQueries({ queryKey: ["adherence", circleId] });
        queryClient.invalidateQueries({ queryKey: ["medications", circleId] });
      }
      if (vars.status === "TAKEN") {
        toast.success(`${updated.medication_name} ${updated.medication_strength} marked as taken`.trim());
        if (elderVoice) speak(`${updated.medication_name} marked as taken. Well done.`);
      } else if (vars.status === "SNOOZED") {
        toast.info(`${updated.medication_name} snoozed — it will come back in 15 minutes`);
        if (elderVoice) speak(`${updated.medication_name} snoozed for 15 minutes.`);
      } else {
        toast.info(`${updated.medication_name} marked as skipped`);
        if (elderVoice) speak(`${updated.medication_name} marked as skipped.`);
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
}
