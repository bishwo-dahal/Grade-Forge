// NOTE: UI-driven models for the university admin dashboard integration seam.

export interface UniversitySummaryStat {
  label: string;
  value: string;
  iconKey: "users" | "code";
  accent: "blue" | "orange";
}

export interface FacultyMember {
  // NOTE: Stable backend id required for destructive actions like delete.
  id: number;
  initials: string;
  name: string;
  email: string;
  department: string;
  classes: number;
  students: number;
  status: "active" | "inactive";
}

export interface AcademicSemester {
  // NOTE: Stable backend id required for destructive actions like delete.
  id: number;
  name: string;
  status: "active" | "upcoming" | "past";
  startDate: string;
  endDate: string;
  courses: number;
}

// NOTE: UI-driven shape for the University Courses table; add fields only when the UI renders them.
export interface UniversityCourseRow {
  id: string;
  code: string;
  name: string;
  instructor: string;
  semester: string;
  students: number;
  assignments: number;
}

export interface FacultyCreatePayload {
  name: string;
  email: string;
  department: string;
  qualifications: string;
  phoneNumber: string;
  officeLocation: string;
  password: string;
}

export interface SemesterCreatePayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface FacultyApiResponse {
  facultyId: number;
  name: string;
  department: string;
  qualifications: string;
  phoneNumber: string | null;
  officeLocation: string | null;
  active: boolean;
  userId: number;
  email: string;
  role: string;
}

export interface SemesterApiResponse {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface SupportedLanguage {
  // NOTE: Stable backend id used by language management list actions.
  id: number;
  name: string;
  dockerImage: string;
  /** Optional compile command template; may use {{main_file}} and {{main_class}}. */
  compileCommand?: string;
  executionCode: string;
  isActive: boolean;
  /** Optional comma-separated list of allowed source extensions (e.g. ".py,.txt,.csv"). */
  allowedExtensions?: string;
  // NOTE: Legacy optional UI fields are kept temporarily for compatibility with older, non-routed dashboard code.
  version?: string;
  addedOn?: string;
  icon?: "python" | "javascript" | "java" | "cpp" | "rust" | "go" | "code";
}

// NOTE: UI-driven payload mirrors backend request shape for easy API handoff.
export interface LanguageCreatePayload {
  name: string;
  dockerImage: string;
  /** Optional. Template may use {{main_file}} and {{main_class}}. */
  compileCommand?: string;
  executionCode: string;
  isActive: boolean;
  /** Optional comma-separated list of allowed source extensions (e.g. ".py,.txt,.csv"). */
  allowedExtensions?: string;
}

/** Activity log row from `/university_admin/activity`. */
export interface ActivityLogEntry {
  timestamp: string;
  role: string;
  user: string;
  /**
   * Client IP resolved from request headers (e.g. `X-Forwarded-For`) when available.
   * Optional to support older log files that may not have `ip`.
   */
  ip?: string;
  action: string;
  details: string;
  status: string;
}

export interface ActivityLogPageResponse {
  size: number;
  page: number;
  pages: number;
  total: number;
  logs: ActivityLogEntry[];
}

export interface ActivityLogQueryParams {
  page?: number;
  size?: number;
  user?: string;
  role?: string;
  status?: string;
  /** ISO date `yyyy-MM-dd` when filtering by day. */
  date?: string;
  /** Optional start timestamp (e.g. ISO string or datetime-local value). */
  start?: string;
  /** Optional end timestamp (e.g. ISO string or datetime-local value). */
  end?: string;
}

export interface StudentSearchResponseDto {
  id: number;
  userId: number;
  cwid: string;
  major: string;
  canvasUserId: string;
  name: string;
  email: string;
  enrolledStatus: string;
}

export interface FacultySearchResponse {
  facultyId: number;
  name: string;
  department: string;
  qualifications: string;
  phoneNumber: string;
  officeLocation: string;
  active: boolean;
  officeHours: string;
  userId: number;
  email: string;
  role: string;
}

export interface GradingAssistantResponse {
  id: number;
  userId: number;
  facultyId: number;
  name: string;
  email: string;
  role: string;
  officeHours: string;
  department: string;
  faculty?: FacultySearchResponse | null;
}

/** Faculty authorship triage rows exposed to university admins for ML training oversight (metadata only). */
export interface AuthorshipTriageTrainingRow {
  submissionId: number;
  studentId: number;
  studentName: string;
  assignmentId: number;
  assignmentName: string;
  courseId: number;
  courseName: string;
  courseCode: string;
  facultyId: number;
  facultyName: string;
  facultyEmail: string;
  label: "AI_ASSISTED" | "HUMAN_WRITTEN" | "UNCLEAR";
  labeledAt: string;
  notes: string | null;
}
