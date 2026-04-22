import type { FacultyMyClassItem } from "../../types/class";

export function FacultyCourseHierarchyBadges({
  course,
}: {
  course: Pick<FacultyMyClassItem, "linkedSectionCount" | "isLinkedSection">;
}) {
  const mainCount = course.linkedSectionCount ?? 0;
  return (
    <div className="contents">
      {mainCount > 0 ? (
        <span
          className="shrink-0 rounded-full border border-[#5A7ACD]/45 bg-[#EEF2FA] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#345079]"
          title="Main course — assignments and tests sync to these section courses"
        >
          Main · {mainCount}
        </span>
      ) : null}
      {course.isLinkedSection ? (
        <span className="shrink-0 rounded-full border border-amber-300/70 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
          Section
        </span>
      ) : null}
    </div>
  );
}
