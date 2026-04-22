import { DEFAULT_COURSE_COVER_IMAGE } from "../constants/defaultCourseCover";

/** Minimal course shape needed to resolve a cover URL (faculty/student API variants). */
export type CourseCoverImageSource = {
  courseImage?: { downloadUrl?: string | null } | null;
  imageUrl?: string | null;
};

/** Cover image URL for display; prefers `courseImage.downloadUrl`, then legacy `imageUrl`, else default. */
export function getCourseCoverImageUrl(course: CourseCoverImageSource): string {
  const fromImage = course.courseImage?.downloadUrl?.trim();
  if (fromImage) return fromImage;
  const legacy = course.imageUrl?.trim();
  if (legacy) return legacy;
  return DEFAULT_COURSE_COVER_IMAGE;
}
