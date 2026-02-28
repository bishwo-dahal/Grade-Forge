import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import type { FacultyCourseCard } from "../../types/class";
import type { UserProfile } from "../../types/user";
import type { GradingAssistantResponse } from "../../types/gradingAssistant";
import { listFacultyCourses } from "../../services/classService";
import { getFacultyProfile } from "../../services/authService";
import { getAllGradingAssistants } from "../../services/gradingAssistantService";

interface FacultyMainViewProps {
  // NOTE: View props keep this workflow component presentation-only and API-source agnostic.
  profile: UserProfile | null;
  courses: FacultyCourseCard[];
  isCoursesLoading: boolean;
  gradingAssistants: GradingAssistantResponse[];
  isAssistantsLoading: boolean;
}

interface FacultyMainProps {}

export function FacultyMain({}: FacultyMainProps) {
  // NOTE: Faculty dashboard keeps independent workflow data while shell/topbar is centralized.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<FacultyCourseCard[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [gradingAssistants, setGradingAssistants] = useState<GradingAssistantResponse[]>([]);
  const [isAssistantsLoading, setIsAssistantsLoading] = useState(true);

  const loadAssistants = useCallback(() => {
    getAllGradingAssistants()
      .then(setGradingAssistants)
      .catch(() => setGradingAssistants([]))
      .finally(() => setIsAssistantsLoading(false));
  }, []);

  useEffect(() => {
    getFacultyProfile().then(setProfile);
    // NOTE: Dashboard course list is backend-driven; errors resolve to empty state instead of stale mock data.
    listFacultyCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsCoursesLoading(false));
    loadAssistants();
  }, [loadAssistants]);

  return (
    <FacultyMainView
      profile={profile}
      courses={courses}
      isCoursesLoading={isCoursesLoading}
      gradingAssistants={gradingAssistants}
      isAssistantsLoading={isAssistantsLoading}
    />
  );
}

function FacultyMainView({
  profile: _profile,
  courses,
  isCoursesLoading,
  gradingAssistants,
  isAssistantsLoading,
}: FacultyMainViewProps) {
  // CLEANUP: Greeting copy was removed, so profile display-name derivation is no longer needed here.
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* NOTE: Top navigation was removed here to avoid duplicated faculty shell code. */}
      <div className="p-8 space-y-8">
        {/* CLEANUP: Removed faculty greeting summary block per dashboard copy update request. */}
        <TeachingCourses courses={courses} isLoading={isCoursesLoading} />
        <GradingAssistantSection
          assistants={gradingAssistants}
          isLoading={isAssistantsLoading}
        />
      </div>
    </main>
  );
}

function GradingAssistantSection({
  assistants,
  isLoading,
}: {
  assistants: GradingAssistantResponse[];
  isLoading?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">Grading Assistants</h2>
        <Link
          to="/faculty/grading-assistants"
          className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium"
        >
          Manage Assistants &rarr;
        </Link>
      </div>
      <Link
        to="/faculty/grading-assistants"
        className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#5A7ACD]/60 hover:shadow-md transition-all"
      >
        {isLoading ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#EEF3FF] rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-48 rounded bg-gray-100" />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#EEF3FF] rounded-xl flex items-center justify-center text-[#5A7ACD]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5H4a1 1 0 01-1-1V7a1 1 0 011-1h3M7 7a2 2 0 012-2h.09A2.25 2.25 0 0111.21 4H13a2 2 0 012 2m-2 4h6m-6 0v2m0 4v2m0-6v2m0-4h2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Grading support</div>
              <h3 className="text-[14px] font-semibold text-[#2B2A2A] leading-snug">
                {assistants.length} assistant{assistants.length !== 1 ? "s" : ""} assigned
              </h3>
              <p className="mt-1 text-[12px] text-gray-600">
                Create and manage grading assistants who can help grade submissions.
              </p>
            </div>
          </div>
        )}
        <div className="mt-5 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors text-center">
          Manage Grading Assistants
        </div>
      </Link>
    </div>
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
                className="block bg-white rounded-2xl p-6 border border-gray-200 animate-pulse"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 ${index % 2 === 0 ? "bg-[#EEF3FF]" : "bg-[#FFF3E6]"} rounded-xl flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-16 rounded bg-gray-200 mb-2" />
                    <div className="h-4 w-44 max-w-full rounded bg-gray-200" />
                  </div>
                </div>
                <div className="space-y-3">
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
                <div className="mt-5 w-full h-10 bg-gray-100 rounded-lg" />
              </div>
            ))
          : null}
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/faculty/class/${course.id}`}
            className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 ${course.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                {course.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">{course.code}</div>
                <h3 className="text-[14px] font-semibold text-[#2B2A2A] leading-snug">{course.title}</h3>
              </div>
            </div>

            <div className="space-y-3">
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

            <div className="mt-5 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors text-center">
              Manage Course
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
