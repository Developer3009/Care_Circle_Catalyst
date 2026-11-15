"use client";

import { useEffect, useState } from "react";
import { Smile, HeartPulse, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

interface WellBeingCheckInProps {
  circleId?: string;
  elderMode?: boolean;
}

const MOODS = [
  { level: "GREAT", emoji: "😄", label: "Great", desc: "Energetic & Happy" },
  { level: "GOOD", emoji: "🙂", label: "Good", desc: "Normal day" },
  { level: "OKAY", emoji: "😐", label: "Okay", desc: "A bit tired" },
  { level: "UNWELL", emoji: "🤒", label: "Unwell", desc: "Nausea or fever" },
  { level: "PAIN", emoji: "😣", label: "In Pain", desc: "Joint or body pain" },
];

export default function WellBeingCheckIn({ circleId = "circle_01", elderMode = false }: WellBeingCheckInProps) {
  const todayKey = `cc_wellbeing_${circleId}_${new Date().toISOString().slice(0, 10)}`;

  const [selectedMood, setSelectedMood] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(todayKey);
    }
    return null;
  });

  const handleSelect = async (mood: typeof MOODS[number]) => {
    setSelectedMood(mood.level);
    if (typeof window !== "undefined") {
      localStorage.setItem(todayKey, mood.level);
    }

    if (mood.level === "UNWELL" || mood.level === "PAIN") {
      toast.warning(`Check-in logged: "${mood.label}". Caretaker & family have been alerted.`, {
        icon: mood.emoji,
      });
      // Optionally submit note to circle feed
      try {
        await apiPost(`/circles/${circleId}/notes`, {
          body: `Elder reported feeling "${mood.label}" (${mood.desc}) during morning check-in. Please monitor.`,
          tags: ["Well-Being Alert", mood.label],
        });
      } catch {}
    } else {
      toast.success(`Today's check-in logged: Feeling ${mood.label}!`, {
        icon: mood.emoji,
      });
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-card p-4 transition-all shadow-sm ${
        elderMode ? "p-6 border-[#376974]/40" : "border-border/60"
      }`}
      data-testid="wellbeing-checkin"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div>
            <h3 className={`font-semibold ${elderMode ? "text-xl font-heading" : "text-sm"}`}>
              Daily Well-Being Check-in
            </h3>
            <p className="text-xs text-muted-foreground">How are you feeling today?</p>
          </div>
        </div>

        {selectedMood && (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs gap-1">
            <Check className="h-3 w-3" />
            <span>Checked In</span>
          </Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.level;
          return (
            <button
              key={m.level}
              type="button"
              onClick={() => handleSelect(m)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                isSelected
                  ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-500/30 scale-105"
                  : "border-border/50 bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
              }`}
              title={`${m.label}: ${m.desc}`}
            >
              <span className={elderMode ? "text-3xl" : "text-2xl"}>{m.emoji}</span>
              <span className="mt-1 text-[11px] font-medium leading-tight truncate w-full">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
