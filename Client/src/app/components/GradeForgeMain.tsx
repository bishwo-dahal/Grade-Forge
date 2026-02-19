import { useEffect, useState } from "react";
import { EnrolledCourses } from "./EnrolledCourses";
import { UpcomingAssignments } from "./UpcomingAssignments";
import type { CourseCard } from "../../types/class";
import type { UpcomingAssignment } from "../../types/assignment";
import { listEnrolledCourses } from "../../services/classService";
import { listUpcomingAssignments } from "../../services/assignmentService";

export function GradeForgeMain() {
  // NOTE: Dashboard content keeps its own data seam; only the shell/topbar moved to shared layout primitives.
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<UpcomingAssignment[]>([]);

  useEffect(() => {
    listEnrolledCourses().then(setCourses);
    listUpcomingAssignments().then(setUpcomingAssignments);
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* NOTE: Top navigation was removed from this component to eliminate duplicate shell markup. */}
      <div className="px-8 py-8">
        {/* CLEANUP: Removed welcome copy block per updated dashboard content requirements. */}

        <EnrolledCourses courses={courses} />
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </main>
  );
}
