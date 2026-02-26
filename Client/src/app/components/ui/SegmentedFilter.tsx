import { cn } from "./utils";

export interface SegmentedFilterItem<TValue extends string> {
  id: TValue;
  label: string;
  count?: number;
  tone?: "default" | "warning";
}

interface SegmentedFilterProps<TValue extends string> {
  items: SegmentedFilterItem<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  className?: string;
}

export function SegmentedFilter<TValue extends string>({
  items,
  value,
  onValueChange,
  className,
}: SegmentedFilterProps<TValue>) {
  // NOTE: Shared segmented filter control keeps tab-like filters visually consistent across pages.
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1 rounded-2xl border border-[#D5D8E0] bg-white p-1", className)}>
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onValueChange(item.id)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-colors",
              isActive && "bg-[#2B2A2A] text-white",
              !isActive && item.tone === "warning" && "text-[#F0A561] hover:bg-[#FFF7EE]",
              !isActive && item.tone !== "warning" && "text-[#344155] hover:bg-[#F3F4F8]",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? ` (${item.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
