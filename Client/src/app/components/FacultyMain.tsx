import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { FacultyCourseCard } from "../../types/class";
import type { UserProfile } from "../../types/user";
import { listFacultyCourses } from "../../services/classService";
import { getFacultyProfile } from "../../services/authService";

interface FacultyMainViewProps {
  // NOTE: View props keep this workflow component presentation-only and API-source agnostic.
  profile: UserProfile | null;
  courses: FacultyCourseCard[];
}

interface FacultyMainProps {}

export function FacultyMain({}: FacultyMainProps) {
  // NOTE: Faculty dashboard keeps independent workflow data while shell/topbar is centralized.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<FacultyCourseCard[]>([]);

  useEffect(() => {
    getFacultyProfile().then(setProfile);
    // NOTE: Dashboard course list is backend-driven; errors resolve to empty state instead of stale mock data.
    listFacultyCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  return <FacultyMainView profile={profile} courses={courses} />;
}

function FacultyMainView({ profile: _profile, courses }: FacultyMainViewProps) {
  // CLEANUP: Greeting copy was removed, so profile display-name derivation is no longer needed here.
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* NOTE: Top navigation was removed here to avoid duplicated faculty shell code. */}
      <div className="p-8">
        {/* CLEANUP: Removed faculty greeting summary block per dashboard copy update request. */}
        <TeachingCourses courses={courses} />
      </div>
    </main>
  );
}

function TeachingCourses({
  courses,
}: {
  courses: FacultyCourseCard[];
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
