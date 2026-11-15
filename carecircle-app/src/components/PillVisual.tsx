import { cn } from "@/lib/utils";

interface PillVisualProps {
  name: string;
  strength?: string;
  shape?: "capsule" | "round" | "oval";
  color?: "emerald" | "blue" | "amber" | "purple" | "rose" | "slate";
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Deterministic fallback based on medication name
function getPillAppearance(name: string): { shape: "capsule" | "round" | "oval"; color: "emerald" | "blue" | "amber" | "purple" | "rose" | "slate" } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const shapes: Array<"capsule" | "round" | "oval"> = ["capsule", "round", "oval"];
  const colors: Array<"emerald" | "blue" | "amber" | "purple" | "rose" | "slate"> = [
    "emerald",
    "blue",
    "amber",
    "purple",
    "rose",
    "slate",
  ];

  const shape = shapes[Math.abs(hash) % shapes.length];
  const color = colors[Math.abs(hash >> 2) % colors.length];
  return { shape, color };
}

const COLOR_MAP = {
  emerald: {
    bg: "from-emerald-400 to-teal-600",
    border: "border-emerald-600/40",
    shadow: "shadow-emerald-500/20",
    text: "text-emerald-950",
    accent: "bg-emerald-200/50",
  },
  blue: {
    bg: "from-sky-400 to-blue-600",
    border: "border-blue-600/40",
    shadow: "shadow-blue-500/20",
    text: "text-blue-950",
    accent: "bg-blue-200/50",
  },
  amber: {
    bg: "from-amber-300 to-amber-500",
    border: "border-amber-600/40",
    shadow: "shadow-amber-500/20",
    text: "text-amber-950",
    accent: "bg-amber-100/50",
  },
  purple: {
    bg: "from-purple-400 to-indigo-600",
    border: "border-purple-600/40",
    shadow: "shadow-purple-500/20",
    text: "text-purple-950",
    accent: "bg-purple-200/50",
  },
  rose: {
    bg: "from-rose-400 to-red-500",
    border: "border-rose-600/40",
    shadow: "shadow-rose-500/20",
    text: "text-rose-950",
    accent: "bg-rose-200/50",
  },
  slate: {
    bg: "from-slate-100 to-slate-300",
    border: "border-slate-400/50",
    shadow: "shadow-slate-500/10",
    text: "text-slate-800",
    accent: "bg-white/60",
  },
};

export default function PillVisual({
  name,
  strength,
  shape: propShape,
  color: propColor,
  className,
  size = "md",
}: PillVisualProps) {
  const fallback = getPillAppearance(name);
  const shape = propShape || fallback.shape;
  const color = propColor || fallback.color;
  const styling = COLOR_MAP[color];

  // Imprint initials (e.g. "MET 500" or first 3 letters)
  const imprint = (name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "RX").toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-[8px]",
    md: "w-11 h-11 text-[9px]",
    lg: "w-14 h-14 text-[10px]",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-mono font-bold select-none relative group",
        sizeClasses[size],
        className
      )}
      title={`${name} ${strength || ""} (${shape}, ${color})`}
      data-testid={`pill-visual-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Capsule shape */}
      {shape === "capsule" && (
        <div
          className={cn(
            "w-full h-3/5 rounded-full border shadow-sm relative overflow-hidden flex items-center justify-between px-1",
            "bg-gradient-to-r",
            styling.bg,
            styling.border,
            styling.shadow
          )}
        >
          {/* Half color split effect for realistic capsule look */}
          <div className={cn("w-1/2 h-full absolute left-0 top-0", styling.accent)} />
          <div className="w-full text-center relative z-10 font-bold opacity-80 tracking-tighter truncate px-0.5">
            {imprint}
          </div>
        </div>
      )}

      {/* Round tablet shape */}
      {shape === "round" && (
        <div
          className={cn(
            "w-4/5 h-4/5 rounded-full border shadow-sm flex items-center justify-center relative overflow-hidden",
            "bg-gradient-to-b",
            styling.bg,
            styling.border,
            styling.shadow
          )}
        >
          <div className="w-full h-[1px] bg-black/15 dark:bg-white/20 absolute top-1/2 -translate-y-1/2" />
          <span className="relative z-10 font-bold opacity-80 tracking-tighter truncate px-1">
            {imprint}
          </span>
        </div>
      )}

      {/* Oval / Oblong shape */}
      {shape === "oval" && (
        <div
          className={cn(
            "w-full h-3/5 rounded-[12px] border shadow-sm flex items-center justify-center relative overflow-hidden",
            "bg-gradient-to-br",
            styling.bg,
            styling.border,
            styling.shadow
          )}
        >
          <span className="relative z-10 font-bold opacity-80 tracking-tighter truncate px-1">
            {imprint}
          </span>
        </div>
      )}
    </div>
  );
}
