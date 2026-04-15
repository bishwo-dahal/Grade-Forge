import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import type { FacultyCourseCard } from "../../types/class";
import { CourseCoverCardShell } from "./CourseCoverCardShell";
import type { UserProfile } from "../../types/user";
import { listFacultyCourses } from "../../services/classService";
import { getFacultyProfile } from "../../services/authService";

interface FacultyMainViewProps {
  // NOTE: View props keep this workflow component presentation-only and API-source agnostic.
  profile: UserProfile | null;
  courses: FacultyCourseCard[];
  isCoursesLoading: boolean;
}

interface FacultyMainProps {}

export function FacultyMain({}: FacultyMainProps) {
  // NOTE: Faculty dashboard keeps independent workflow data while shell/topbar is centralized.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<FacultyCourseCard[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  useEffect(() => {
    getFacultyProfile().then(setProfile);
    // NOTE: Dashboard course list is backend-driven; errors resolve to empty state instead of stale mock data.
    listFacultyCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsCoursesLoading(false));
  }, []);

  return (
    <FacultyMainView
      profile={profile}
      courses={courses}
      isCoursesLoading={isCoursesLoading}
    />
  );
}

function FacultyMainView({
  profile: _profile,
  courses,
  isCoursesLoading,
}: FacultyMainViewProps) {
  // CLEANUP: Greeting copy was removed, so profile display-name derivation is no longer needed here.
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F4F6]">
      {/* NOTE: Top navigation was removed here to avoid duplicated faculty shell code. */}
      <div className="p-6">
        {/* CLEANUP: Removed faculty greeting summary block per dashboard copy update request. */}
        <TeachingCourses courses={courses} isLoading={isCoursesLoading} />
      </div>
    </main>
  );
}

/** Readable on busy covers: solid fill + light shadow; hairline border only (avoid heavy white rim). */
const DASHBOARD_COVER_CODE_PILL =
  "rounded-md border border-white/30 bg-gray-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_1px_6px_rgba(0,0,0,0.42)] backdrop-blur-[2px]";
const DASHBOARD_COVER_MAIN_PILL =
  "rounded-md border border-white/30 bg-[#1e3a5f]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_1px_6px_rgba(0,0,0,0.42)] backdrop-blur-[2px]";

function TeachingCourses({
  courses,
  isLoading = false,
}: {
  courses: FacultyCourseCard[];
  isLoading?: boolean;
}) {
  // NOTE: Keeps faculty-specific course management flow separate from student dashboard workflow.
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1F2430]">Teaching This Semester</h2>
        <div className="flex items-center gap-3">
          {/* CLEANUP: Removed Add Class button from faculty dashboard header per latest UX update. */}
          <Link to="/faculty/my-classes" className="text-[13px] text-[#7A1226] hover:text-[#65101F] font-medium">
            View All Courses &rarr;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`faculty-course-skeleton-${index}`}
                // NOTE: Skeleton cards mirror teaching-course visuals so class blocks stay visible while fetching.
                className="block overflow-hidden rounded-2xl border border-gray-200 bg-white animate-pulse"
              >
                <div className="h-24 bg-gray-100" />
                <div className="space-y-2 p-4 pt-3">
                  <div className="h-3.5 w-44 max-w-full rounded bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 rounded bg-gray-200" />
                    <div className="h-3 w-8 rounded bg-gray-200" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-8 rounded bg-gray-200" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 rounded bg-gray-200" />
                    <div className="h-3 w-8 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="mx-4 mb-4 mt-3 h-8 rounded-lg bg-gray-100" />
              </div>
            ))
          : null}
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/faculty/class/${course.id}`}
            className="group block overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md"
          >
            <CourseCoverCardShell
              coverImageUrl={course.coverImageUrl}
              className="min-h-[220px] border-0 shadow-none"
              imageOverlay={
                <div className="flex h-full min-h-[72px] flex-col items-end gap-1.5 p-2">
                  {(course.linkedSectionCount ?? 0) > 0 ? (
                    <span className={DASHBOARD_COVER_MAIN_PILL} title="Main course with linked sections">
                      Main · {course.linkedSectionCount}
                    </span>
                  ) : null}
                  <span className={DASHBOARD_COVER_CODE_PILL}>{course.code}</span>
                </div>
              }
            >
              <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
                <h3 className="text-[13px] font-semibold leading-tight text-[#1F2430]">{course.title}</h3>
                <div className="mt-1 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Students</span>
                    <span className="font-semibold text-[#1F2430]">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-[#9F3549]">{course.pendingSubmissions}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold text-[#1F2430]">{course.activeAssignments}</span>
                  </div>
                </div>
                <div className="mt-auto w-full rounded-md bg-[#F5F4F6] py-2 text-center text-[12px] font-medium text-[#1F2430] transition-colors group-hover:bg-[#ECE9ED]">
                  Manage Course
                </div>
              </div>
            </CourseCoverCardShell>
          </Link>
        ))}
      </div>
    </div>
  );
}
