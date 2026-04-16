import type {
  AssignmentCreateFormData,
  AssignmentCreateOption,
  AssignmentDescription,
  AssignmentDetail,
  AssignmentExistingStarterFile,
  AssignmentSummary,
  EditorCodeExamples,
  FacultyAssignmentCreatePageData,
  FacultyAssignmentCreatePageHeader,
  GradingAssignmentContext,
  RecentAssignmentItem,
  StudentAssignmentListItem,
  UpcomingAssignment,
} from "../types/assignment";
import type { RubricCategory } from "../types/grade";
import type { PublicTestCase } from "../types/submission";
import type { GroupStudentResponse } from "../types/courseGroup";
import api from "../api/axios";
import { getAuthenticatedRole } from "../app/auth";
import { getRubric } from "./rubricService";
import { listFacultyCourseGroups } from "./courseGroupService";
import { fetchSubmissionFileText, resolvePreviewLanguage } from "./submissionService";

// NOTE: This service keeps assignment data access centralized for both live API endpoints and remaining mock-only views.
// TODO(backend): Migrate remaining mock-only helper sections to backend endpoints while keeping return shapes stable.

// NOTE: Added grading header context for faculty workflows.
const gradingAssignmentContext: GradingAssignmentContext = {
  id: "assignment-8",
  title: "Binary Search Tree Implementation",
  courseName: "CS 341: Data Structures",
  section: "Section 02",
};

const recentAssignments: RecentAssignmentItem[] = [
  {
    name: "Binary Search Trees",
    className: "CS 201",
    dueDate: "Feb 6, 2026",
    status: "pending",
    statusColor: "text-orange-500",
    statusBg: "bg-orange-100",
    iconKey: "clock",
  },
  {
    name: "React Router Implementation",
    className: "CS 340",
    dueDate: "Feb 8, 2026",
    status: "in progress",
    statusColor: "text-purple-600",
    statusBg: "bg-[#E0DBFF]",
    iconKey: "circle",
  },
  {
    name: "SQL Query Optimization",
    className: "CS 370",
    dueDate: "Feb 10, 2026",
    status: "pending",
    statusColor: "text-orange-500",
    statusBg: "bg-orange-100",
    iconKey: "clock",
  },
  {
    name: "Algorithm Analysis",
    className: "CS 301",
    dueDate: "Feb 2, 2026",
    status: "completed",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
    iconKey: "check",
  },
  {
    name: "UML Diagrams",
    className: "CS 410",
    dueDate: "Feb 1, 2026",
    status: "completed",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
    iconKey: "check",
  },
];

const defaultCreateAssignmentHeader: FacultyAssignmentCreatePageHeader = {
  classId: "1",
  courseCode: "CS 2400",
  courseName: "Data Structures & Algorithms",
};

const defaultCreateAssignmentForm: AssignmentCreateFormData = {
  title: "",
  description: "",
  availableFromDate: "",
  availableFromTime: "00:00",
  dueDate: "",
  dueTime: "23:59",
  lateDueDate: "",
  lateDueTime: "23:59",
  languageId: "",
  submissionType: "INDIVIDUAL",
  mainGroupId: "",
  starterFiles: [] as File[],
  rubricId: "",
  totalPoints: 100,
};

interface AssignmentStarterFileApiResponse {
  id: number;
  fileName: string;
  fileKey?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  downloadUrl?: string | null;
}

interface AssignmentApiResponse {
  id: number;
  courseId: number;
  courseName: string;
  languageId: number;
  languageName: string;
   /** Optional comma-separated list of allowed source extensions for this assignment's language (e.g. ".py,.txt,.csv"). */
  languageAllowedExtensions?: string | null;
  name: string;
  description: string | null;
  totalPoints: number;
  submissionType: string;
  /** @deprecated Prefer starterCodeFiles from multipart uploads. */
  starterCodeUrl?: string | null;
  starterCodeFiles?: AssignmentStarterFileApiResponse[] | null;
  availableFrom: string | null;
   dueDate: string | null;
  lateDueDate: string | null;
  // When submissionType is GROUP, backend links assignment to a main group.
  mainGroupId?: number | null;
  mainGroupName?: string | null;
  rubricId?: number | null;
  rubricName?: string | null;
}

interface AssignmentBasicApiResponse {
  id: number;
  courseId: number;
  name: string;
  description: string | null;
  totalPoints: number;
  availableFrom: string | null;
  dueDate: string | null;
  lateDueDate: string | null;
}

interface SubmissionApiResponse {
  id: number;
  assignmentId: number;
  marks: number | null;
  submittedAt: string;
  files?: Array<{
    id?: number | null;
    fileName: string;
    downloadUrl?: string | null;
    url?: string | null;
  }> | null;
  // When submission belongs to a subgroup (group-assigned assignment), backend may return the subgroup and members.
  subGroupId?: number | null;
  subGroupName?: string | null;
  subGroupMembers?: GroupStudentResponse[] | null;
}

interface StudentEnrolledCourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
}

interface FacultyCourseHeaderApiResponse {
  id: number;
  name: string;
  courseCode: string;
}

interface ProgrammingLanguageApiResponse {
  id: number;
  name: string;
  isActive: boolean;
}

interface RubricOptionApiResponse {
  id: number;
  name: string;
}

interface RubricCriteriaApiResponse {
  id: number;
  title: string;
  description: string | null;
  maxScore: number;
  weight: number | null;
}

interface RubricApiResponse {
  id: number;
  name: string;
  description: string | null;
  facultyId: number | null;
  criteria: RubricCriteriaApiResponse[];
}

async function listFacultyRubricOptions(): Promise<RubricOptionApiResponse[]> {
  try {
    const { data } = await api.get<RubricOptionApiResponse[]>("/api/v1/faculty/rubrics/faculty/me");
    return data;
  } catch (error: any) {
    const status = error?.response?.status as number | undefined;
    if (status === 404) {
      // FIX: Backend returns 404 when faculty has no rubrics yet; keep create-assignment page usable with empty options.
      return [];
    }
    throw error;
  }
}

interface StudentAssignmentWorkspaceSource {
  course: StudentEnrolledCourseApiResponse;
  assignment: AssignmentApiResponse;
  submissions: SubmissionApiResponse[];
}

const studentAssignmentWorkspaceCache = new Map<string, Promise<StudentAssignmentWorkspaceSource>>();
const facultyAssignmentWorkspaceCache = new Map<string, Promise<StudentAssignmentWorkspaceSource>>();

export function invalidateAssignmentWorkspaceCache(assignmentId?: string): void {
  if (!assignmentId) {
    // NOTE: Clearing both role caches ensures role-switch scenarios never render stale assignment submission data.
    studentAssignmentWorkspaceCache.clear();
    facultyAssignmentWorkspaceCache.clear();
    return;
  }

  const trimmedId = assignmentId.trim();
  if (!trimmedId) {
    return;
  }

  studentAssignmentWorkspaceCache.delete(trimmedId);
  facultyAssignmentWorkspaceCache.delete(trimmedId);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No due date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildUpcomingDueMeta(dueDate: string | null): { label: string; urgent: boolean; sortTimestamp: number } {
  if (!dueDate) {
    return {
      label: "Due date unavailable",
      urgent: false,
      sortTimestamp: Number.POSITIVE_INFINITY,
    };
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return {
      label: "Due date unavailable",
      urgent: false,
      sortTimestamp: Number.POSITIVE_INFINITY,
    };
  }

  const now = Date.now();
  const millisUntilDue = parsedDueDate.getTime() - now;
  const daysUntilDue = Math.ceil(millisUntilDue / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return { label: "Past due", urgent: true, sortTimestamp: parsedDueDate.getTime() };
  }
  if (daysUntilDue === 0) {
    return { label: "Due today", urgent: true, sortTimestamp: parsedDueDate.getTime() };
  }
  if (daysUntilDue === 1) {
    return { label: "Due in 1 day", urgent: true, sortTimestamp: parsedDueDate.getTime() };
  }

  return {
    label: `Due in ${daysUntilDue} days`,
    urgent: daysUntilDue <= 2,
    sortTimestamp: parsedDueDate.getTime(),
  };
}

function formatDueDateTime(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No due date";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveAssignmentIcon(courseCode: string): { icon: string; iconBg: string } {
  const normalizedCode = courseCode.toUpperCase();
  if (normalizedCode.includes("WEB")) {
    return { icon: "\u{1F310}", iconBg: "bg-[#FEB05D]/10" };
  }
  if (normalizedCode.includes("DB")) {
    return { icon: "\u{1F5C4}\uFE0F", iconBg: "bg-[#FEB05D]/10" };
  }
  return { icon: "\u{1F4BB}", iconBg: "bg-[#5A7ACD]/10" };
}

function resolveStudentAssignmentStatus(
  dueDate: string | null,
  hasSubmission: boolean,
  isGraded: boolean,
): StudentAssignmentListItem["status"] {
  if (isGraded) {
    return "completed";
  }
  if (hasSubmission) {
    return "active";
  }

  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : Number.NaN;
  if (Number.isFinite(dueTimestamp) && dueTimestamp < Date.now()) {
    return "overdue";
  }
  return "upcoming";
}

function parseClassId(rawClassId: string): number {
  const parsedClassId = Number(rawClassId.trim());
  if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
    throw new Error("Invalid class id.");
  }
  return parsedClassId;
}

function parseAssignmentId(rawAssignmentId: string): number {
  const parsedAssignmentId = Number(rawAssignmentId.trim());
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }
  return parsedAssignmentId;
}

function getLatestSubmission(submissions: SubmissionApiResponse[]): SubmissionApiResponse | undefined {
  return [...submissions].sort((left, right) => {
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  })[0];
}

function getLatestSubmissionWithDownloadableFile(
  submissions: SubmissionApiResponse[],
): { submission: SubmissionApiResponse; file: NonNullable<SubmissionApiResponse["files"]>[number] } | null {
  const sorted = [...submissions].sort((left, right) => {
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  });

  for (const submission of sorted) {
    const files = submission.files ?? [];
    const fileWithUrl = files.find((file) => {
      const url = file.downloadUrl ?? file.url ?? null;
      return typeof url === "string" && url.trim().length > 0;
    });
    if (fileWithUrl) {
      return { submission, file: fileWithUrl };
    }
  }

  return null;
}

function mapAssignmentDetailStatus(
  dueDate: string | null,
  submissions: SubmissionApiResponse[],
): AssignmentDetail["status"] {
  const latestSubmission = getLatestSubmission(submissions);
  if (latestSubmission?.marks !== null && latestSubmission?.marks !== undefined) {
    return "graded";
  }
  if (submissions.length > 0) {
    return "submitted";
  }

  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : Number.NaN;
  if (Number.isFinite(dueTimestamp) && dueTimestamp < Date.now()) {
    return "late";
  }
  return "not_submitted";
}

async function loadStudentAssignmentWorkspaceSource(assignmentId: string): Promise<StudentAssignmentWorkspaceSource> {
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  const authenticatedRole = getAuthenticatedRole();
  if (authenticatedRole === "FACULTY") {
    // FIX: Faculty assignment page must resolve data from faculty endpoints (student-only endpoints return authorization errors).
    return loadFacultyAssignmentWorkspaceSource(parsedAssignmentId);
  }

  const cacheKey = String(parsedAssignmentId);
  const cachedPromise = studentAssignmentWorkspaceCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loaderPromise = (async () => {
    // NOTE: Student assignment route only provides assignmentId, so we resolve course ownership from enrolled classes.
    const { data: enrolledCourses } = await api.get<StudentEnrolledCourseApiResponse[]>("/api/v1/student/classes/enrolled");

    for (const course of enrolledCourses) {
      try {
        const { data: assignmentDetail } = await api.get<AssignmentApiResponse>(
          `/api/v1/student/assignments/course/${course.id}/${parsedAssignmentId}`,
        );

        const { data: submissions } = await api.get<SubmissionApiResponse[]>(
          `/api/v1/student/submissions/assignment?assignmentId=${parsedAssignmentId}`,
        );

        return {
          course,
          // FIX: Use student assignment detail payload so rubric/language/group fields are present in assignment workspace tabs.
          assignment: assignmentDetail,
          submissions,
        } satisfies StudentAssignmentWorkspaceSource;
      } catch (error: any) {
        const status = error?.response?.status as number | undefined;
        // Some backends return 400 instead of 404 when the assignment doesn't belong to the course.
        if (status === 404 || status === 400) {
          // Assignment not found for this course; try next enrolled course.
          continue;
        }
        throw error;
      }
    }

    throw new Error("Assignment not found.");
  })();

  studentAssignmentWorkspaceCache.set(cacheKey, loaderPromise);
  return loaderPromise;
}

async function loadFacultyAssignmentWorkspaceSource(parsedAssignmentId: number): Promise<StudentAssignmentWorkspaceSource> {
  const cacheKey = String(parsedAssignmentId);
  const cachedPromise = facultyAssignmentWorkspaceCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loaderPromise = (async () => {
    const { data: assignment } = await api.get<AssignmentApiResponse>(`/api/v1/faculty/assignments/${parsedAssignmentId}`);

    let submissions: SubmissionApiResponse[] = [];
    try {
      // NOTE: Faculty assignment detail uses class-wide submissions endpoint for this assignment id.
      const response = await api.get<SubmissionApiResponse[]>(`/api/v1/faculty/submissions?assignmentId=${parsedAssignmentId}`);
      submissions = response.data;
    } catch {
      // NOTE: Keep assignment page usable even when there are no submissions or submission fetch is temporarily unavailable.
      submissions = [];
    }

    let courseCode = "placeholder text";
    if (typeof assignment.courseId === "number" && Number.isFinite(assignment.courseId)) {
      try {
        // NOTE: Faculty assignment response does not include course code, so we resolve it from faculty course endpoint.
        const { data: facultyCourse } = await api.get<FacultyCourseHeaderApiResponse>(`/api/v1/faculty/courses/${assignment.courseId}`);
        courseCode = facultyCourse.courseCode || "placeholder text";
      } catch {
        // NOTE: Preserve placeholder fallback when course header lookup fails.
        courseCode = "placeholder text";
      }
    }

    return {
      course: {
        id: assignment.courseId ?? -1,
        name: assignment.courseName || "placeholder text",
        courseCode,
      },
      assignment,
      submissions,
    } satisfies StudentAssignmentWorkspaceSource;
  })();

  facultyAssignmentWorkspaceCache.set(cacheKey, loaderPromise);
  return loaderPromise;
}

function buildDueDateTimePayload(dateValue: string, timeValue: string): string {
  // NOTE: Backend expects LocalDateTime for dueDate; keep `YYYY-MM-DDTHH:mm:ss` shape stable.
  const dueDateTime = `${dateValue}T${timeValue}:00`;
  const parsedDueDateTime = new Date(dueDateTime);
  if (Number.isNaN(parsedDueDateTime.getTime())) {
    throw new Error("Invalid due date or time.");
  }
  return dueDateTime;
}

function buildOptionalDateTimePayload(
  dateValue: string,
  timeValue: string,
  fieldLabel: string,
): string | null {
  if (!dateValue.trim()) {
    return null;
  }
  const dateTimeValue = `${dateValue}T${timeValue}:00`;
  const parsedDateTimeValue = new Date(dateTimeValue);
  if (Number.isNaN(parsedDateTimeValue.getTime())) {
    throw new Error(`Invalid ${fieldLabel}.`);
  }
  return dateTimeValue;
}

export async function getAssignmentDetailById(id: string): Promise<AssignmentDetail> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(id);
  const latestSubmission = getLatestSubmission(workspaceSource.submissions);
  const status = mapAssignmentDetailStatus(workspaceSource.assignment.dueDate, workspaceSource.submissions);
  const earnedPoints = latestSubmission?.marks ?? null;

  const starterCodeFileLinks =
    workspaceSource.assignment.starterCodeFiles
      ?.map((f) =>
        f.downloadUrl && f.fileName ? { fileName: f.fileName, downloadUrl: f.downloadUrl } : null,
      )
      .filter((item): item is { fileName: string; downloadUrl: string } => item !== null) ?? [];
  const hasStarterCode =
    starterCodeFileLinks.length > 0 || Boolean(workspaceSource.assignment.starterCodeUrl);

  return {
    id: String(workspaceSource.assignment.id),
    title: workspaceSource.assignment.name,
    course: workspaceSource.course.name || workspaceSource.assignment.courseName || "placeholder text",
    courseCode: workspaceSource.course.courseCode || "placeholder text",
    courseId: workspaceSource.course.id,
    dueDate: formatDueDateTime(workspaceSource.assignment.dueDate),
    availableFrom: workspaceSource.assignment.availableFrom
      ? formatDueDateTime(workspaceSource.assignment.availableFrom)
      : null,
    lateDueDate: workspaceSource.assignment.lateDueDate
      ? formatDueDateTime(workspaceSource.assignment.lateDueDate)
      : null,
    status,
    points: {
      earned: earnedPoints,
      total: workspaceSource.assignment.totalPoints,
    },
    submissionsUsed: workspaceSource.submissions.length,
    // TODO(backend): Replace placeholder with real attempt limit once backend exposes this field.
    submissionsAllowed: null,
    language: workspaceSource.assignment.languageName || "placeholder text",
    languageAllowedExtensions: workspaceSource.assignment.languageAllowedExtensions ?? null,
    hasStarterCode,
    submissionType: workspaceSource.assignment.submissionType ?? undefined,
    starterCodeUrl: workspaceSource.assignment.starterCodeUrl ?? undefined,
    starterCodeFiles: starterCodeFileLinks.length > 0 ? starterCodeFileLinks : undefined,
    mainGroupId: workspaceSource.assignment.mainGroupId ?? null,
    mainGroupName: workspaceSource.assignment.mainGroupName ?? null,
    subGroupName: latestSubmission?.subGroupName ?? null,
    subGroupMembers: latestSubmission?.subGroupMembers ?? null,
    rubricName: workspaceSource.assignment.rubricName ?? undefined,
    rubricId: workspaceSource.assignment.rubricId ?? undefined,
  };
}

export function getGradingAssignmentContext(assignmentId: string): Promise<GradingAssignmentContext> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve({ ...gradingAssignmentContext, id: assignmentId || gradingAssignmentContext.id });
}

export async function listUpcomingAssignments(): Promise<UpcomingAssignment[]> {
  // NOTE: Dashboard upcoming assignments now come from live enrolled-course assignments instead of mock rows.
  const { data: enrolledCourses } = await api.get<StudentEnrolledCourseApiResponse[]>("/api/v1/student/classes/enrolled");

  const upcomingByCourse = await Promise.all(
    enrolledCourses.map(async (course) => {
      const { data: assignments } = await api.get<AssignmentApiResponse[]>(`/api/v1/student/assignments/course/${course.id}`);
      const pendingAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const { data: submissions } = await api.get<SubmissionApiResponse[]>(
            `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
          );
          const latestSubmission = getLatestSubmission(submissions);
          // CLEANUP: Only unresolved work is shown in "Upcoming Assignments"; graded/submitted items are omitted.
          if (latestSubmission) {
            return null;
          }

          const dueMeta = buildUpcomingDueMeta(assignment.dueDate);
          const iconData = resolveAssignmentIcon(course.courseCode || assignment.courseName);
          return {
            row: {
              id: assignment.id,
              title: assignment.name,
              course: course.name || assignment.courseName || "placeholder text",
              dueDate: formatDate(assignment.dueDate),
              daysLeft: dueMeta.label,
              urgent: dueMeta.urgent,
              icon: iconData.icon,
              iconBg: iconData.iconBg,
            } satisfies UpcomingAssignment,
            sortTimestamp: dueMeta.sortTimestamp,
          };
        }),
      );

      return pendingAssignments.filter((item): item is { row: UpcomingAssignment; sortTimestamp: number } => item !== null);
    }),
  );

  return upcomingByCourse
    .flat()
    .sort((left, right) => left.sortTimestamp - right.sortTimestamp)
    .slice(0, 3)
    .map((item) => item.row);
}

export async function listCourseAssignments(courseId: string): Promise<AssignmentSummary[]> {
  const parsedCourseId = Number(courseId);
  if (!Number.isFinite(parsedCourseId) || parsedCourseId <= 0) {
    throw new Error("Invalid course id.");
  }

  // NOTE: Course page assignments now load from backend, with student submission state mapped into UI statuses.
  const { data: assignments } = await api.get<AssignmentApiResponse[]>(
    `/api/v1/student/assignments/course/${parsedCourseId}`,
  );

  const assignmentSummaries = await Promise.all(
    assignments.map(async (assignment, index) => {
      const { data: submissions } = await api.get<SubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
      );
      const latestSubmission = [...submissions].sort((left, right) => {
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      })[0];
      const gradedScore = latestSubmission?.marks ?? null;
      const hasSubmission = submissions.length > 0;
      const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
      const isLate = typeof dueAt === "number" && Number.isFinite(dueAt) && dueAt < Date.now() && !hasSubmission;

      return {
        id: assignment.id,
        title: assignment.name,
        number: index + 1,
        dueDate: formatDate(assignment.dueDate),
        status: gradedScore !== null ? "graded" : isLate ? "late" : hasSubmission ? "submitted" : "not_submitted",
        points: gradedScore !== null ? gradedScore : assignment.totalPoints,
        totalPoints: assignment.totalPoints,
      } satisfies AssignmentSummary;
    }),
  );

  return assignmentSummaries;
}

export function listRecentAssignments(): Promise<RecentAssignmentItem[]> {
  return Promise.resolve(recentAssignments);
}

export async function listStudentAssignments(): Promise<StudentAssignmentListItem[]> {
  // NOTE: Student assignments page now loads real assignments from enrolled classes so new faculty-created work is visible.
  const { data: enrolledCourses } = await api.get<StudentEnrolledCourseApiResponse[]>("/api/v1/student/classes/enrolled");

  const assignmentGroups = await Promise.all(
    enrolledCourses.map(async (course) => {
      const { data: assignments } = await api.get<AssignmentApiResponse[]>(
        `/api/v1/student/assignments/course/${course.id}`,
      );

      const mappedRows = await Promise.all(
        assignments.map(async (assignment) => {
          const { data: submissions } = await api.get<SubmissionApiResponse[]>(
            `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
          );
          const latestSubmission = [...submissions].sort((left, right) => {
            return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
          })[0];
          const hasSubmission = submissions.length > 0;
          const isGraded = latestSubmission?.marks !== null && latestSubmission?.marks !== undefined;
          const status = resolveStudentAssignmentStatus(assignment.dueDate, hasSubmission, isGraded);
          const iconData = resolveAssignmentIcon(course.courseCode || assignment.courseName);

          return {
            id: String(assignment.id),
            title: assignment.name,
            courseCode: course.courseCode || "N/A",
            courseName: assignment.courseName || course.name || "Course",
            points: assignment.totalPoints,
            dueAt: formatDueDateTime(assignment.dueDate),
            status,
            // NOTE: Completion bar is hidden in UI; keep stable placeholder for components that still read this field.
            progressPercent: status === "completed" ? 100 : status === "active" ? 50 : null,
            icon: iconData.icon,
            iconBg: iconData.iconBg,
          } satisfies StudentAssignmentListItem;
        }),
      );

      return mappedRows;
    }),
  );

  return assignmentGroups
    .flat()
    .sort((left, right) => {
      const leftDue = new Date(left.dueAt).getTime();
      const rightDue = new Date(right.dueAt).getTime();
      if (!Number.isFinite(leftDue) && !Number.isFinite(rightDue)) {
        return 0;
      }
      if (!Number.isFinite(leftDue)) {
        return 1;
      }
      if (!Number.isFinite(rightDue)) {
        return -1;
      }
      return leftDue - rightDue;
    });
}

export async function getAssignmentDescription(assignmentId: string): Promise<AssignmentDescription> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(assignmentId);

  // NOTE: Backend currently returns only one description string; all detailed sections are explicit placeholders for future APIs.
  return {
    problemDescription: [
      workspaceSource.assignment.description?.trim() || "placeholder text",
    ],
    requiredMethods: [
      {
        name: "placeholder text",
        description: "placeholder text",
      },
    ],
    exampleCode: "placeholder text",
    inputOutput: {
      input: "placeholder text",
      output: "placeholder text",
    },
    rubric: [
      {
        category: "placeholder text",
        description: "placeholder text",
        points: "placeholder text",
      },
    ],
    constraints: ["placeholder text"],
  };
}

export async function listRubricCategories(assignmentId: string): Promise<RubricCategory[]> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(assignmentId);
  const rubricId = workspaceSource.assignment.rubricId;
  if (!rubricId) {
    return [];
  }

  try {
    const authenticatedRole = getAuthenticatedRole();
    const rubric = authenticatedRole === "FACULTY"
      ? await getRubric(rubricId)
      : (
          await api.get<RubricApiResponse>(
            `/api/v1/student/assignments/course/${workspaceSource.course.id}/${workspaceSource.assignment.id}/rubric`,
          )
        ).data;
    const flatCriteria: Array<{ id?: number; description: string; points: number; weight?: number | null }> = [];
    let totalPoints = 0;
    for (const criterion of rubric.criteria) {
      const subCriteria = (criterion as {
        subCriteria?: Array<{ id?: number; description?: string | null; maxScore: number; weight?: number | null }>;
      }).subCriteria;
      if (subCriteria?.length) {
        for (const sub of subCriteria) {
          flatCriteria.push({
            id: sub.id,
            description: sub.description?.trim() ? sub.description : criterion.title,
            points: sub.maxScore,
            weight: sub.weight ?? null,
          });
          totalPoints += sub.maxScore;
        }
      } else {
        const maxScore = criterion.maxScore ?? 0;
        flatCriteria.push({
          id: criterion.id,
          description: criterion.description?.trim() ? `${criterion.title}: ${criterion.description}` : criterion.title,
          points: maxScore,
          weight: criterion.weight ?? null,
        });
        totalPoints += maxScore;
      }
    }
    return [
      {
        name: rubric.name,
        points: totalPoints,
        criteria: flatCriteria,
      },
    ];
  } catch {
    // FIX: Fallback to empty rubric data when rubric fetch fails so UI never regresses to placeholder text.
    return [];
  }
}

export async function listPublicTestCases(assignmentId: string): Promise<PublicTestCase[]> {
  await loadStudentAssignmentWorkspaceSource(assignmentId);
  // TODO(backend): Replace this placeholder test-case row when test-case endpoint is integrated.
  return [
    {
      id: 1,
      name: "placeholder text",
      passed: false,
      input: "placeholder text",
      expectedOutput: "placeholder text",
      actualOutput: "placeholder text",
      executionTime: "placeholder text",
    },
  ];
}

export async function getEditorCodeExamples(assignmentId: string): Promise<EditorCodeExamples> {
  const workspaceSource = await loadStudentAssignmentWorkspaceSource(assignmentId);
  const fallbackLanguage = workspaceSource.assignment.languageName || "plaintext";
  const latestWithFile = getLatestSubmissionWithDownloadableFile(workspaceSource.submissions);
  const primaryFile = latestWithFile?.file;
  const primaryFileUrl = primaryFile?.downloadUrl ?? primaryFile?.url ?? null;

  if (!primaryFile || !primaryFileUrl) {
    // TODO(backend): Replace placeholder code when starter/template endpoint is available.
    return {
      [fallbackLanguage]: "placeholder text",
    };
  }

  try {
    const content = await fetchSubmissionFileText(primaryFileUrl, primaryFile.fileName);
    const languageKey = resolvePreviewLanguage(primaryFile.fileName, fallbackLanguage);
    return {
      [languageKey]: content,
      [fallbackLanguage]: content,
    };
  } catch {
    return {
      [fallbackLanguage]: "placeholder text",
    };
  }
}

export async function getFacultyAssignmentCreatePageData(classId: string): Promise<FacultyAssignmentCreatePageData> {
  // NOTE: Create-assignment page data stays centralized here so the page remains presentation-focused.
  const parsedClassId = parseClassId(classId || defaultCreateAssignmentHeader.classId);
  const [courseResponse, languagesResponse, rubricOptionsResponse, groupsResponse] = await Promise.all([
    api.get<FacultyCourseHeaderApiResponse>(`/api/v1/faculty/courses/${parsedClassId}`),
    api.get<ProgrammingLanguageApiResponse[]>("/api/v1/faculty/programming-languages/all"),
    // NOTE: Assignment creation requires linking previously-created faculty rubrics from the same ownership scope.
    listFacultyRubricOptions(),
    listFacultyCourseGroups(String(parsedClassId)),
  ]);

  const languageOptions: AssignmentCreateOption[] = languagesResponse.data
    // NOTE: Inactive languages should not appear for new assignment creation.
    .filter((language) => language.isActive !== false)
    .map((language) => ({
      id: String(language.id),
      label: language.name,
    }));
  const rubricOptions: AssignmentCreateOption[] = rubricOptionsResponse.map((rubric) => ({
    id: String(rubric.id),
    label: rubric.name,
  }));

  return {
    header: {
      classId: String(courseResponse.data.id),
      courseCode: courseResponse.data.courseCode,
      courseName: courseResponse.data.name,
    },
    languageOptions,
    rubricOptions,
    mainGroupOptions: groupsResponse.map((g) => ({ id: String(g.id), label: g.name })),
    initialForm: { ...defaultCreateAssignmentForm },
  };
}

function splitDateTimeForForm(value: string | null | undefined): { date: string; time: string } {
  if (!value) {
    return { date: "", time: "00:00" };
  }
  const normalized = value.trim().replace(" ", "T");
  const [datePart = "", timePart = ""] = normalized.split("T");
  const hhmm = timePart.slice(0, 5);
  return {
    date: datePart,
    time: hhmm || "00:00",
  };
}

export async function getFacultyAssignmentEditPageData(
  classId: string,
  assignmentId: string,
): Promise<FacultyAssignmentCreatePageData> {
  const parsedClassId = parseClassId(classId || defaultCreateAssignmentHeader.classId);
  const parsedAssignmentId = Number(assignmentId);
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }

  const [baseData, assignmentResponse] = await Promise.all([
    getFacultyAssignmentCreatePageData(String(parsedClassId)),
    api.get<AssignmentApiResponse>(`/api/v1/faculty/assignments/${parsedAssignmentId}`),
  ]);

  const assignment = assignmentResponse.data;
  const availableFrom = splitDateTimeForForm(assignment.availableFrom);
  const dueDate = splitDateTimeForForm(assignment.dueDate);
  const lateDueDate = splitDateTimeForForm(assignment.lateDueDate);

  return {
    ...baseData,
    existingStarterFiles:
      assignment.starterCodeFiles?.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        downloadUrl: f.downloadUrl ?? null,
      })) ?? [],
    initialForm: {
      title: assignment.name ?? "",
      description: assignment.description ?? "",
      availableFromDate: availableFrom.date,
      availableFromTime: availableFrom.time,
      dueDate: dueDate.date,
      dueTime: dueDate.time || "23:59",
      lateDueDate: lateDueDate.date,
      lateDueTime: lateDueDate.time || "23:59",
      languageId: assignment.languageId ? String(assignment.languageId) : "",
      submissionType: assignment.submissionType === "GROUP" ? "GROUP" : "INDIVIDUAL",
      mainGroupId: assignment.mainGroupId ? String(assignment.mainGroupId) : "",
      starterFiles: [],
      rubricId: assignment.rubricId ? String(assignment.rubricId) : "",
      totalPoints: assignment.totalPoints ?? 100,
    },
  };
}

/** JSON body for `@RequestPart("assignment")` — must match backend `AssignmentRequest`. */
function buildFacultyAssignmentRequestPayload(
  form: AssignmentCreateFormData,
  parsedClassId: number,
  options?: { keepFileIds?: number[] },
): Record<string, unknown> {
  const parsedLanguageId = Number(form.languageId);
  if (!Number.isFinite(parsedLanguageId) || parsedLanguageId <= 0) {
    throw new Error("Select a programming language.");
  }
  const payload: Record<string, unknown> = {
    courseId: parsedClassId,
    languageId: parsedLanguageId,
    name: form.title.trim(),
    description: form.description.trim(),
    totalPoints: form.totalPoints,
    submissionType: form.submissionType,
    ...(form.mainGroupId.trim() ? { mainGroupId: Number(form.mainGroupId) } : {}),
    availableFrom: buildOptionalDateTimePayload(form.availableFromDate, form.availableFromTime, "available-from date/time"),
    dueDate: buildDueDateTimePayload(form.dueDate, form.dueTime),
    lateDueDate: buildOptionalDateTimePayload(form.lateDueDate, form.lateDueTime, "late due date/time"),
    ...(form.rubricId.trim() ? { rubricId: Number(form.rubricId) } : {}),
  };
  if (options?.keepFileIds !== undefined) {
    payload.keepFileIds = options.keepFileIds;
  }
  return payload;
}

function buildFacultyAssignmentMultipartForm(
  form: AssignmentCreateFormData,
  parsedClassId: number,
  options?: {
    /** Append these instead of `form.starterFiles` (multipart part name `files`). */
    filesToAppend?: File[];
    /** When true, no multipart `files` parts. */
    omitFileParts?: boolean;
    /** Update only: IDs of existing starter files to keep (sent inside assignment JSON). */
    keepFileIds?: number[];
  },
): FormData {
  const payload = buildFacultyAssignmentRequestPayload(form, parsedClassId, {
    keepFileIds: options?.keepFileIds,
  });
  const formData = new FormData();
  // Filename helps Spring MVC bind the JSON part reliably as application/json.
  formData.append(
    "assignment",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
    "assignment.json",
  );
  if (options?.omitFileParts) {
    return formData;
  }
  const files =
    options != null && Object.prototype.hasOwnProperty.call(options, "filesToAppend")
      ? options.filesToAppend ?? []
      : form.starterFiles;
  for (const file of files) {
    formData.append("files", file);
  }
  return formData;
}

export interface UpdateFacultyAssignmentStarterEditOptions {
  initialExisting: AssignmentExistingStarterFile[];
  retainedExisting: AssignmentExistingStarterFile[];
}

export async function createFacultyAssignmentDraft(
  classId: string,
  form: AssignmentCreateFormData,
): Promise<{ assignmentId: string }> {
  const parsedClassId = parseClassId(classId || defaultCreateAssignmentHeader.classId);
  const formData = buildFacultyAssignmentMultipartForm(form, parsedClassId);
  const { data } = await api.post<AssignmentApiResponse>("/api/v1/faculty/assignments", formData);
  return { assignmentId: String(data.id) };
}

export async function updateFacultyAssignmentDraft(
  assignmentId: string,
  classId: string,
  form: AssignmentCreateFormData,
  starterEdit?: UpdateFacultyAssignmentStarterEditOptions,
): Promise<{ assignmentId: string; assignment: AssignmentApiResponse }> {
  const parsedClassId = parseClassId(classId || defaultCreateAssignmentHeader.classId);
  const parsedAssignmentId = Number(assignmentId);
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }

  let formData: FormData;

  if (!starterEdit) {
    formData = buildFacultyAssignmentMultipartForm(form, parsedClassId);
  } else {
    const { initialExisting, retainedExisting } = starterEdit;
    const newFiles = form.starterFiles;
    const sortNumericIds = (items: AssignmentExistingStarterFile[]) =>
      [...items.map((f) => Number(f.id))].sort((a, b) => a - b);
    const initialKey = JSON.stringify(sortNumericIds(initialExisting));
    const retainedKey = JSON.stringify(sortNumericIds(retainedExisting));
    const starterSectionDirty = initialKey !== retainedKey || newFiles.length > 0;

    if (!starterSectionDirty) {
      formData = buildFacultyAssignmentMultipartForm(form, parsedClassId, { omitFileParts: true });
    } else if (retainedExisting.length === 0 && newFiles.length === 0) {
      formData = buildFacultyAssignmentMultipartForm(form, parsedClassId, {
        keepFileIds: [],
        omitFileParts: true,
      });
    } else {
      formData = buildFacultyAssignmentMultipartForm(form, parsedClassId, {
        keepFileIds: retainedExisting.map((f) => Number(f.id)),
        filesToAppend: newFiles,
      });
    }
  }

  const { data } = await api.put<AssignmentApiResponse>(`/api/v1/faculty/assignments/${parsedAssignmentId}`, formData);
  return { assignmentId: String(data.id), assignment: data };
}

export async function publishFacultyAssignmentToCanvas(courseId: string, assignmentId: string): Promise<void> {
  const parsedCourseId = parseClassId(courseId || defaultCreateAssignmentHeader.classId);
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  await api.post(`/api/v1/faculty/canvas/${parsedCourseId}/${parsedAssignmentId}/publish`);
}

export async function postFacultyStudentGradeToCanvas(
  courseId: string,
  assignmentId: string,
  studentId: string,
  payload: { points: number; feedback: string },
): Promise<string> {
  const parsedCourseId = parseClassId(courseId || defaultCreateAssignmentHeader.classId);
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  const parsedStudentId = Number(studentId.trim());
  if (!Number.isFinite(parsedStudentId) || parsedStudentId <= 0) {
    throw new Error("Invalid student id.");
  }
  const points =
    typeof payload.points === "number" && Number.isFinite(payload.points) ? payload.points : NaN;
  if (!Number.isFinite(points) || points < 0) {
    throw new Error("Points must be zero or higher.");
  }

  const { data } = await api.post<string>(
    `/api/v1/faculty/canvas/courses/${parsedCourseId}/assignments/${parsedAssignmentId}/students/${parsedStudentId}/grade`,
    {
      points,
      feedback: payload.feedback ?? "",
    },
  );
  return data;
}
