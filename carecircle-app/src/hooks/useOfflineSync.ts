import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOfflineQueue, syncOfflineQueue } from "@/lib/offlineSync";

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshCount = async () => {
    try {
      const queue = await getOfflineQueue();
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    refreshCount();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.info("Internet connection restored. Syncing offline records...");
      setIsSyncing(true);
      try {
        const { synced, failed } = await syncOfflineQueue();
        if (synced > 0) {
          toast.success(`Synced ${synced} offline action${synced === 1 ? "" : "s"} successfully!`);
          queryClient.invalidateQueries();
        }
        if (failed > 0) {
          toast.warning(`${failed} action(s) could not be synced and will retry.`);
        }
      } catch {
        toast.error("Offline sync error.");
      } finally {
        setIsSyncing(false);
        refreshCount();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are currently offline. Dose logs and records will be saved locally.");
      refreshCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check on queue
    const interval = setInterval(refreshCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [queryClient]);

  const syncNow = async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline. Please connect to internet.");
      return;
    }
    setIsSyncing(true);
    try {
      const { synced, failed } = await syncOfflineQueue();
      if (synced > 0) {
        toast.success(`Synchronized ${synced} record${synced === 1 ? "" : "s"}!`);
        queryClient.invalidateQueries();
      } else {
        toast.info("All records are up to date.");
      }
      if (failed > 0) {
        toast.warning(`${failed} record(s) failed to sync.`);
      }
    } finally {
      setIsSyncing(false);
      refreshCount();
    }
  };

  return { isOnline, pendingCount, isSyncing, syncNow };
}
