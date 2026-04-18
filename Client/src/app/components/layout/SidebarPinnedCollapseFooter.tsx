import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarPinnedCollapsed } from "./useSidebarPinnedCollapsed";

export type SidebarPinnedCollapseFooterVariant = "maroon" | "university";

export interface SidebarPinnedCollapseFooterProps {
  variant: SidebarPinnedCollapseFooterVariant;
  /** Narrow icon rail: center the control. */
  rail: boolean;
  /** Full-width sidebar: match Grade Forge nav inset vs faculty class `px-3` nav. */
  expandedInset?: "forge" | "flush";
}

function pinToggleButtonClassName(
  variant: SidebarPinnedCollapseFooterVariant,
  pinnedCollapsed: boolean,
): string {
  const isUniversityView = variant === "university";
  return [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#9F3549] focus-visible:ring-offset-0",
    pinnedCollapsed
      ? isUniversityView
        ? "bg-[#FDF8F9] text-[#7A1226]"
        : "bg-white/15 text-white"
      : isUniversityView
        ? "bg-white text-[#5D667A] hover:bg-[#F1EEF1]"
        : "bg-transparent text-[#F5E5E8] hover:bg-white/10",
  ].join(" ");
}

export function SidebarPinnedCollapseFooter({
  variant,
  rail,
  expandedInset = "forge",
}: SidebarPinnedCollapseFooterProps) {
  const { pinnedCollapsed, togglePinnedCollapsed } = useSidebarPinnedCollapsed();
  const isUniversityView = variant === "university";

  const rowClass = [
    "shrink-0 border-t py-3",
    isUniversityView ? "border-[#C9C4C9]" : "border-white/15",
    rail
      ? "flex justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-3 group-focus-within/sidebar:justify-start group-focus-within/sidebar:px-3"
      : expandedInset === "flush"
        ? "flex justify-start px-3"
        : "flex justify-start pl-7 pr-4",
  ].join(" ");

  return (
    <div className={rowClass}>
      <button
        type="button"
        onClick={togglePinnedCollapsed}
        aria-pressed={pinnedCollapsed}
        aria-label={
          pinnedCollapsed
            ? "Turn off locked collapsed sidebar"
            : "Keep sidebar collapsed; hover will not expand it"
        }
        title={
          pinnedCollapsed
            ? "Sidebar stays narrow without expanding on hover. Click to unlock hover expand and dashboard width."
            : "Lock the sidebar narrow on all pages. Hover will not expand it while this is on."
        }
        className={pinToggleButtonClassName(variant, pinnedCollapsed)}
      >
        {pinnedCollapsed ? (
          <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2} />
        ) : (
          <PanelLeft className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
