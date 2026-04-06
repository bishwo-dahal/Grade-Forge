import { useEffect, useState } from "react";

export interface ProfileAvatarCircleProps {
  initials: string;
  /** Tailwind gradient utility segment, e.g. `from-[#7A1226] to-[#65101F]` (omit `bg-gradient-to-br`). */
  gradientClassName: string;
  imageUrl?: string | null;
  sizeClassName?: string;
  initialsClassName?: string;
  alt?: string;
}

/**
 * Presigned S3 URLs expire; on load failure we fall back to the gradient + initials treatment.
 */
export function ProfileAvatarCircle({
  initials,
  gradientClassName,
  imageUrl,
  sizeClassName = "h-9 w-9",
  initialsClassName = "text-[13px] font-medium text-white",
  alt = "",
}: ProfileAvatarCircleProps) {
  const trimmed = imageUrl?.trim() || null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  const showImage = Boolean(trimmed && !failed);

  return (
    <div
      className={`${sizeClassName} shrink-0 overflow-hidden rounded-full bg-gradient-to-br ${gradientClassName} flex items-center justify-center`}
    >
      {showImage ? (
        <img
          key={trimmed}
          src={trimmed!}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={initialsClassName}>{initials}</span>
      )}
    </div>
  );
}
