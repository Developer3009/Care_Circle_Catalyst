"use client";

import { useEffect, useState } from "react";
import { Droplet, Plus, Minus, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface HydrationTrackerProps {
  circleId?: string;
  elderMode?: boolean;
}

const DAILY_TARGET_GLASSES = 6;

export default function HydrationTracker({ circleId = "default", elderMode = false }: HydrationTrackerProps) {
  const todayKey = `cc_hydration_${circleId}_${new Date().toISOString().slice(0, 10)}`;

  const [glasses, setGlasses] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(todayKey);
      return saved ? Number(saved) : 3; // sensible default
    }
    return 3;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(todayKey, glasses.toString());
    }
  }, [glasses, todayKey]);

  const addGlass = () => {
    if (glasses >= 12) return;
    const next = glasses + 1;
    setGlasses(next);
    if (next === DAILY_TARGET_GLASSES) {
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      } catch {}
      toast.success("💧 Goal achieved! 6 glasses of water completed today. Great hydration!");
    } else {
      toast.success(`💧 Logged 1 glass of water (${next}/${DAILY_TARGET_GLASSES})`);
    }
  };

  const removeGlass = () => {
    if (glasses <= 0) return;
    setGlasses((prev) => prev - 1);
  };

  const percentage = Math.min(100, Math.round((glasses / DAILY_TARGET_GLASSES) * 100));

  return (
    <div
      className={`rounded-2xl border bg-card p-4 transition-all shadow-sm ${
        elderMode ? "p-6 border-[#376974]/40" : "border-border/60"
      }`}
      data-testid="hydration-tracker"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Droplet className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${elderMode ? "text-xl font-heading" : "text-sm"}`}>
                Daily Hydration
              </h3>
              {glasses >= DAILY_TARGET_GLASSES ? (
                <Badge className="bg-blue-600 text-white text-[10px] gap-1 px-1.5 py-0">
                  <Check className="h-2.5 w-2.5" /> Met Goal
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">
                  {glasses}/{DAILY_TARGET_GLASSES} glasses
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {glasses >= DAILY_TARGET_GLASSES
                ? "Optimal hydration reached for today!"
                : `${DAILY_TARGET_GLASSES - glasses} more glass${DAILY_TARGET_GLASSES - glasses === 1 ? "" : "es"} to meet senior daily goal`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {glasses > 0 && (
            <Button
              variant="outline"
              size="icon-sm"
              className="h-8 w-8 text-muted-foreground"
              onClick={removeGlass}
              title="Undo last glass"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size={elderMode ? "default" : "sm"}
            className="h-9 px-3 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            onClick={addGlass}
            data-testid="add-water-btn"
          >
            <Plus className="h-4 w-4" />
            <span>Drink Glass</span>
          </Button>
        </div>
      </div>

      {/* Visual Water Glasses Row */}
      <div className="mt-3.5 flex items-center gap-1.5 sm:gap-2">
        {Array.from({ length: DAILY_TARGET_GLASSES }).map((_, idx) => {
          const filled = idx < glasses;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setGlasses(idx + 1)}
              className={`flex-1 h-8 rounded-lg border flex items-center justify-center transition-all ${
                filled
                  ? "bg-blue-500 border-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted"
              }`}
              title={`Glass ${idx + 1}`}
            >
              <Droplet className={`h-4 w-4 ${filled ? "fill-current" : "opacity-40"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
