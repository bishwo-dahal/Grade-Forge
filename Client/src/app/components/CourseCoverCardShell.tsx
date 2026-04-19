import type { ReactNode } from "react";
import { DEFAULT_COURSE_COVER_IMAGE } from "../../constants/defaultCourseCover";

export interface CourseCoverCardShellProps {
  /** Course cover from API (`courseImage.downloadUrl`); falls back to `ulm.jpg` in `public/` when absent. */
  coverImageUrl?: string | null;
  className?: string;
  /**
   * Smaller card: short fixed-height image strip + denser body (e.g. faculty My Classes).
   * Default: image and body each ~50% of `min-h-[220px]`.
   */
  compact?: boolean;
  /** Optional overlay on the image (badges, icons). */
  imageOverlay?: ReactNode;
  /** Bottom half of the card (text, stats, actions). */
  children: ReactNode;
}

/**
 * Two-row layout: cover image on top (50/50 split, or a short strip when `compact`), body below.
 */
export function CourseCoverCardShell({
  coverImageUrl,
  className = "",
  compact = false,
  imageOverlay,
  children,
}: CourseCoverCardShellProps) {
  const trimmed = coverImageUrl?.trim();
  const coverSrc = trimmed || DEFAULT_COURSE_COVER_IMAGE;
  const shellLayout = compact
    ? "min-h-[235px] grid-rows-[120px_minmax(0,1fr)]"
    : "min-h-[220px] grid-rows-2";
  return (
    <div
      className={`grid ${shellLayout} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="relative min-h-0 overflow-hidden bg-[#EEF2FA]">
        <>
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"
            aria-hidden
          />
        </>
        {imageOverlay ? <div className="relative z-[1]">{imageOverlay}</div> : null}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t border-gray-100 bg-white">
        <img
          src={coverSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full scale-[3] object-cover blur-[400px] opacity-70"
          loading="lazy"
          aria-hidden
        />
        <div className="absolute inset-0 bg-white/40" aria-hidden />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
