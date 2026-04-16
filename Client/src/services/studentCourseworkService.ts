import api from "../api/axios";

export interface StudentCourseworkCourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
  section: string | null;
  description: string | null;
  imageUrl: string | null;
  canvasCourseId: string | null;
  active: boolean;
  isPublished: boolean;
  semester?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  faculty?: {
    id: number;
    name: string;
    email: string;
    department: string;
    qualifications: string;
  } | null;
}

export interface StudentCourseworkAssignmentApiResponse {
  id: number;
  courseId: number;
  courseName: string;
  languageId: number;
  languageName: string;
  name: string;
  description: string | null;
  totalPoints: number;
  submissionType: string;
  starterCodeUrl: string | null;
  availableFrom: string | null;
  dueDate: string | null;
  lateDueDate: string | null;
}

export interface StudentCourseworkSubmissionApiResponse {
  id: number;
  assignmentId: number;
  assignmentName: string;
  courseId: number;
  courseName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
}

export interface StudentCourseworkSnapshot {
  courses: StudentCourseworkCourseApiResponse[];
  assignmentsByCourseId: Map<number, StudentCourseworkAssignmentApiResponse[]>;
  submissionsByAssignmentId: Map<number, StudentCourseworkSubmissionApiResponse[]>;
}

const SNAPSHOT_TTL_MS = 30_000;

let cachedSnapshot: StudentCourseworkSnapshot | null = null;
let cachedSnapshotAt = 0;
let inFlightSnapshotPromise: Promise<StudentCourseworkSnapshot> | null = null;

export function invalidateStudentCourseworkSnapshotCache(): void {
  cachedSnapshot = null;
  cachedSnapshotAt = 0;
  inFlightSnapshotPromise = null;
}

export async function getStudentCourseworkSnapshot(): Promise<StudentCourseworkSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshotAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot;
  }

  if (inFlightSnapshotPromise) {
    return inFlightSnapshotPromise;
  }

  inFlightSnapshotPromise = loadStudentCourseworkSnapshot()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cachedSnapshotAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      inFlightSnapshotPromise = null;
    });

  return inFlightSnapshotPromise;
}

async function loadStudentCourseworkSnapshot(): Promise<StudentCourseworkSnapshot> {
  const { data: courses } = await api.get<StudentCourseworkCourseApiResponse[]>("/api/v1/student/classes/enrolled");

  const assignmentsByCourseEntries = await Promise.all(
    courses.map(async (course) => {
      const { data } = await api.get<StudentCourseworkAssignmentApiResponse[]>(
        `/api/v1/student/assignments/course/${course.id}`,
      );
      return [course.id, data] as const;
    }),
  );

  const allAssignments = assignmentsByCourseEntries.flatMap(([, assignments]) => assignments);

  const submissionsByAssignmentEntries = await Promise.all(
    allAssignments.map(async (assignment) => {
      const { data } = await api.get<StudentCourseworkSubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
      );
      return [assignment.id, data] as const;
    }),
  );

  return {
    courses,
    assignmentsByCourseId: new Map(assignmentsByCourseEntries),
    submissionsByAssignmentId: new Map(submissionsByAssignmentEntries),
  };
}
