import { useEffect, useState } from "react";
import { EnrolledCourses } from "./EnrolledCourses";
import { UpcomingAssignments } from "./UpcomingAssignments";
import type { CourseCard } from "../../types/class";
import type { UpcomingAssignment } from "../../types/assignment";
import type { UserProfile } from "../../types/user";
import { getStudentProfile } from "../../services/authService";
import { listEnrolledCourses } from "../../services/classService";
import { listUpcomingAssignments } from "../../services/assignmentService";
import { getAuthenticatedUser } from "../auth";

export function GradeForgeMain() {
  // NOTE: Dashboard content keeps its own data seam; only the shell/topbar moved to shared layout primitives.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<UpcomingAssignment[]>([]);

  useEffect(() => {
    getStudentProfile().then(setProfile);
    listEnrolledCourses().then(setCourses);
    listUpcomingAssignments().then(setUpcomingAssignments);
  }, []);

  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? profile?.name ?? "Alex Johnson";
  const firstName = displayName.split(" ")[0] || displayName;

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* NOTE: Top navigation was removed from this component to eliminate duplicate shell markup. */}
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2B2A2A] mb-2 flex items-center gap-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-[14px] text-gray-600">
            You have <span className="font-semibold text-[#2B2A2A]">4 assignments</span> due this week. Stay focused!
          </p>
        </div>

        <EnrolledCourses courses={courses} />
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </main>
  );
}
