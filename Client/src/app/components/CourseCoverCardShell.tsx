import type { ReactNode } from "react";
import { DEFAULT_COURSE_COVER_IMAGE } from "../../constants/defaultCourseCover";

export interface CourseCoverCardShellProps {
  /** Course cover from API (`courseImage.downloadUrl`); falls back to `ulm.jpg` in `public/` when absent. */
  coverImageUrl?: string | null;
  className?: string;
  /** Optional overlay on the image (badges, icons). */
  imageOverlay?: ReactNode;
  /** Bottom half of the card (text, stats, actions). */
  children: ReactNode;
}

/**
 * Two-row layout: top ~50% shows cover image (API URL or default `ulm.jpg` in `public/`), bottom is solid content.
 */
export function CourseCoverCardShell({ coverImageUrl, className = "", imageOverlay, children }: CourseCoverCardShellProps) {
  const trimmed = coverImageUrl?.trim();
  const coverSrc = trimmed || DEFAULT_COURSE_COVER_IMAGE;
  return (
    <div
      className={`grid min-h-[220px] grid-rows-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
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
      <div className="relative flex min-h-0 flex-1 flex-col border-t border-gray-100 bg-white">{children}</div>
    </div>
  );
}
