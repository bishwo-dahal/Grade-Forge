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
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* NOTE: Top navigation was removed here to avoid duplicated faculty shell code. */}
      <div className="p-8">
        {/* CLEANUP: Removed faculty greeting summary block per dashboard copy update request. */}
        <TeachingCourses courses={courses} isLoading={isCoursesLoading} />
      </div>
    </main>
  );
}

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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">Teaching This Semester</h2>
        <div className="flex items-center gap-3">
          {/* CLEANUP: Removed Add Class button from faculty dashboard header per latest UX update. */}
          <Link to="/faculty/my-classes" className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium">
            View All Courses &rarr;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`faculty-course-skeleton-${index}`}
                // NOTE: Skeleton cards mirror teaching-course visuals so class blocks stay visible while fetching.
                className="block overflow-hidden rounded-2xl border border-gray-200 bg-white animate-pulse"
              >
                <div className="h-36 bg-gray-100" />
                <div className="space-y-3 p-6 pt-4">
                  <div className="h-4 w-44 max-w-full rounded bg-gray-200" />
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
                <div className="mx-6 mb-6 mt-4 h-10 rounded-lg bg-gray-100" />
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
              className="min-h-[280px] border-0 shadow-none"
              imageOverlay={
                <div className="flex h-full min-h-[120px] items-start justify-end p-3">
                  <span className="rounded-lg bg-black/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/30">
                    {course.code}
                  </span>
                </div>
              }
            >
              <div className="flex flex-1 flex-col p-5 pt-4">
                <h3 className="text-[14px] font-semibold leading-snug text-[#2B2A2A]">{course.title}</h3>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Students Enrolled</span>
                    <span className="text-[13px] font-semibold text-[#2B2A2A]">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Pending Submissions</span>
                    <span className="text-[13px] font-semibold text-[#FEB05D]">{course.pendingSubmissions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Active Assignments</span>
                    <span className="text-[13px] font-semibold text-[#2B2A2A]">{course.activeAssignments}</span>
                  </div>
                </div>
                <div className="mt-5 w-full rounded-lg bg-gray-50 py-2.5 text-center text-[13px] font-medium text-[#2B2A2A] transition-colors group-hover:bg-gray-100">
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
