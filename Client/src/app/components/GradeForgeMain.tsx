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
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [isUpcomingLoading, setIsUpcomingLoading] = useState(true);

  useEffect(() => {
    // NOTE: Separate loading flags keep each dashboard block visible with skeletons until its own data resolves.
    listEnrolledCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsCoursesLoading(false));

    listUpcomingAssignments()
      .then(setUpcomingAssignments)
      .catch(() => setUpcomingAssignments([]))
      .finally(() => setIsUpcomingLoading(false));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      {/* NOTE: Top navigation was removed from this component to eliminate duplicate shell markup. */}
      <div className="px-8 py-8">
        {/* CLEANUP: Removed welcome copy block per updated dashboard content requirements. */}

        <EnrolledCourses courses={courses} isLoading={isCoursesLoading} />
        <UpcomingAssignments assignments={upcomingAssignments} isLoading={isUpcomingLoading} />
      </div>
    </main>
  );
}
