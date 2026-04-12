import React from "react";

export interface ScoreRingItem {
  label: string;
  value: number | null;
  /** Optional 0–100 for display; null shows "—" */
  percent?: number | null;
  color: string;
}

interface CircularScorePanelProps {
  items: ScoreRingItem[];
  /** Optional title above the rings */
  title?: string | null;
  ringSize?: number;
  strokeWidth?: number;
  compact?: boolean;
  minimal?: boolean;
}

function AnimatedRing({
  percent,
  color,
  size,
  strokeWidth,
  delay = 0,
}: {
  percent: number;
  color: string;
  size: number;
  strokeWidth: number;
  delay?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={mounted ? offset : circumference}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

export function CircularScorePanel({
  items,
  title = "Scores",
  ringSize = 72,
  strokeWidth = 6,
  compact = false,
  minimal = false,
}: CircularScorePanelProps) {
  const size = ringSize;

  return (
    <div className={minimal ? "p-0" : compact ? "p-2" : "p-4"}>
      {title && title.trim() !== "" && (
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {title}
        </h3>
      )}
      <div className={`flex flex-wrap items-center ${minimal ? "gap-2" : compact ? "gap-2" : "gap-4"}`}>
        {items.map((item, index) => {
          const percent = item.percent ?? 0;
          const displayValue =
            item.value != null
              ? String(item.value)
              : item.percent != null
                ? `${item.percent}%`
                : "—";
          return (
            <div key={item.label} className={minimal ? "flex items-center" : "flex items-center gap-2"}>
              <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                <AnimatedRing
                  percent={Math.min(100, Math.max(0, percent))}
                  color={item.color}
                  size={size}
                  strokeWidth={strokeWidth}
                  delay={index * 150}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#2B2A2A]"
                  style={{ lineHeight: 1 }}
                >
                  {displayValue}
                </div>
              </div>
              {!minimal && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-medium text-gray-500 truncate">
                    {item.label}
                  </span>
                  <span className="text-[12px] text-[#2B2A2A] font-medium truncate">
                    {item.value != null ? item.value : item.percent != null ? `${item.percent}%` : "—"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
