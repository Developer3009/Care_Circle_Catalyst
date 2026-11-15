interface AdherenceRingProps {
  score: number;
  size?: number;
  label?: string;
}

// Donut ring for the adherence score — green ≥ 90, amber ≥ 70, rose below.
export default function AdherenceRing({ score, size = 132, label = "adherence" }: AdherenceRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = clamped >= 90 ? "#15803D" : clamped >= 70 ? "#B45309" : "#B91C1C";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 132 132" role="img" aria-label={`${label} ${Math.round(clamped)} percent`}>
        <circle cx="66" cy="66" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 66 66)"
        />
        <text x="66" y="62" textAnchor="middle" className="fill-foreground" fontSize="26" fontWeight="700">
          {Math.round(clamped)}%
        </text>
        <text x="66" y="82" textAnchor="middle" className="fill-muted-foreground" fontSize="11">
          {label}
        </text>
      </svg>
    </div>
  );
}
