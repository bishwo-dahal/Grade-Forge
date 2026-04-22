import api from "../api/axios";

export interface FacultyCourseworkCourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
  section: string | null;
  description: string | null;
  /** Legacy; prefer `courseImage.downloadUrl` when the API includes it. */
  imageUrl: string | null;
  courseImage?: {
    id: number;
    fileName: string;
    fileKey: string;
    fileType: string;
    fileSize: number;
    downloadUrl: string;
  } | null;
  canvasCourseId: string | null;
  active: boolean;
  isPublished: boolean;
  semesterId?: number | null;
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
  /** Present when this course is a section linked to a main course. */
  parentCourseId?: number | null;
  sectionCourses?: Array<{
    id: number;
    name: string;
    courseCode: string;
    section: string | null;
  }>;
}

export interface FacultyCourseworkAssignmentApiResponse {
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

// Raw shape returned by the backend
interface RawFacultySubmissionApiResponse {
  submissionId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  grade: number | null;
  feedback: string | null;
  status: string;
  submittedAt: string;
}

// Normalized shape used throughout the app
export interface FacultyCourseworkSubmissionApiResponse {
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

export interface FacultyCourseworkEnrollmentApiResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail?: string;
  courseId: number;
  enrolledAt: string;
  enrolledStatus: string;
  grade: string | null;
}

export interface FacultyCourseworkSnapshot {
  courses: FacultyCourseworkCourseApiResponse[];
  enrollmentsByCourseId: Map<number, FacultyCourseworkEnrollmentApiResponse[]>;
  assignmentsByCourseId: Map<number, FacultyCourseworkAssignmentApiResponse[]>;
  submissionsByAssignmentId: Map<number, FacultyCourseworkSubmissionApiResponse[]>;
}

const SNAPSHOT_TTL_MS = 30_000;

let cachedSnapshot: FacultyCourseworkSnapshot | null = null;
let cachedSnapshotAt = 0;
let inFlightSnapshotPromise: Promise<FacultyCourseworkSnapshot> | null = null;

export function invalidateFacultyCourseworkSnapshotCache(): void {
  cachedSnapshot = null;
  cachedSnapshotAt = 0;
  inFlightSnapshotPromise = null;
}

export async function getFacultyCourseworkSnapshot(): Promise<FacultyCourseworkSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshotAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot;
  }

  if (inFlightSnapshotPromise) {
    return inFlightSnapshotPromise;
  }

  inFlightSnapshotPromise = loadFacultyCourseworkSnapshot()
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

async function loadFacultyCourseworkSnapshot(): Promise<FacultyCourseworkSnapshot> {
  const { data: courses } = await api.get<FacultyCourseworkCourseApiResponse[]>("/api/v1/faculty/courses");

  const [enrollmentEntries, assignmentEntries] = await Promise.all([
    Promise.all(
      courses.map(async (course) => {
        const { data } = await api.get<FacultyCourseworkEnrollmentApiResponse[]>(
          `/api/v1/faculty/enrollments/course/${course.id}`,
        );
        return [course.id, data] as const;
      }),
    ),
    Promise.all(
      courses.map(async (course) => {
        const { data } = await api.get<FacultyCourseworkAssignmentApiResponse[]>(
          `/api/v1/faculty/assignments/course/${course.id}`,
        );
        return [course.id, data] as const;
      }),
    ),
  ]);

  const allAssignments = assignmentEntries.flatMap(([, assignments]) => assignments);
  const submissionEntries = await Promise.all(
    allAssignments.map(async (assignment) => {
      const { data: raw } = await api.get<RawFacultySubmissionApiResponse[]>(
        `/api/v1/faculty/submissions?assignmentId=${assignment.id}`,
      );
      const data: FacultyCourseworkSubmissionApiResponse[] = raw.map((r) => ({
        id: r.submissionId,
        assignmentId: assignment.id,
        assignmentName: assignment.name,
        courseId: assignment.courseId,
        courseName: assignment.courseName,
        studentId: r.studentId,
        studentName: r.studentName,
        studentEmail: r.studentEmail,
        marks: r.grade ?? null,
        feedback: r.feedback ?? null,
        submittedAt: r.submittedAt,
      }));
      return [assignment.id, data] as const;
    }),
  );

  return {
    courses,
    enrollmentsByCourseId: new Map(enrollmentEntries),
    assignmentsByCourseId: new Map(assignmentEntries),
    submissionsByAssignmentId: new Map(submissionEntries),
  };
}
