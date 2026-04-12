// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

export interface ClassHeader {
  id: string;
  code: string;
  name: string;
  section: string;
  semester: string;
  instructor: string;
  instructorEmail?: string;
  role?: string;
  coverImageUrl?: string;
}

export interface ClassOverviewItem {
  name: string;
  code: string;
  instructor: string;
  assignments: number;
  completed: number;
  color: string;
}

export interface CourseCard {
  id: string;
  // NOTE: My Courses cards display catalog metadata; keep these fields aligned with the current UI only.
  courseCode: string;
  credits: number;
  title: string;
  instructor: string;
  semester: string;
  completed: number;
  total: number;
  icon: string;
  iconBg: string;
  progressColor: string;
  /** Cover image URL from `courseImage.downloadUrl` when the backend provides it. */
  coverImageUrl?: string | null;
}

export interface FacultyCourseCard {
  id: string;
  title: string;
  code: string;
  students: number;
  pendingSubmissions: number;
  activeAssignments: number;
  icon: string;
  iconBg: string;
  coverImageUrl?: string | null;
}

// NOTE: UI-driven model for Faculty My Classes workspace cards; keep fields aligned to what the page renders.
export interface FacultyMyClassItem {
  id: string;
  title: string;
  code: string;
  section: string;
  semester: string;
  isActive: boolean;
  students: number;
  assignments: number;
  avgScore: number;
  pendingGrading: number;
  pendingReview: number;
  schedule: string;
  location: string;
  icon: string;
  iconBg: string;
  coverImageUrl?: string | null;
}

// NOTE: UI-driven create-class form shape mirrors current backend CourseRequestDto fields used by the faculty workflow.
export interface ClassCreateFormData {
  name: string;
  courseCode: string;
  section: string;
  description: string;
  canvasCourseId: string;
  semesterId: string;
  isPublished: boolean;
  active: boolean;
}

// NOTE: This payload mirrors the faculty course create contract and is used by service integration.
export interface FacultyCourseCreatePayload {
  name: string;
  courseCode: string;
  section: string;
  description: string;
  canvasCourseId: string;
  isPublished: boolean;
  semesterId: number;
  active: boolean;
}

// NOTE: UI-driven semester type for the Add Class modal selector.
export interface FacultySemesterOption {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CourseDetail {
  id: string | number;
  title: string;
  code: string;
  instructor: string;
  icon: string;
  iconBg: string;
}

// NOTE: Added class overview models to keep class dashboard data centralized.
export interface ClassImportantDate {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "assignment" | "exam";
}

export interface ClassOverviewStat {
  label: string;
  value: string;
  subtitle: string;
  valueColor?: string;
  subtitleColor?: string;
}

// NOTE: Added faculty dashboard stat card model for class dashboards.
export interface FacultyDashboardStat {
  label: string;
  value: string;
  iconKey: "users" | "file-text" | "clock" | "alert";
  iconBg: string;
  iconColor: string;
  badge?: boolean;
}

// NOTE: Added class page list types to make service return shapes explicit.
export interface ClassAssignment {
  id: string;
  title: string;
  language: string;
  availableFrom: string;
  dueDate: string;
  lateDueDate: string;
  status: "upcoming" | "submitted" | "graded";
  grade: number | null;
  totalPoints: number;
}

export interface FacultyAssignment {
  id: string;
  name: string;
  language: string;
  availableFrom: string;
  dueDate: string;
  lateDueDate: string;
  totalPoints: number;
  submissions: number;
  totalStudents: number;
  status: "published" | "closed" | "draft";
}

export interface ClassAnnouncement {
  id: number;
  title: string;
  author: string;
  date: string;
  time: string;
  content: string;
  unread: boolean;
}

export interface ClassResource {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  category: string;
}

export interface InstructorProfile {
  name: string;
  email: string;
  officeHours: string;
  office: string;
}

export interface TeachingAssistantProfile extends InstructorProfile {
  id: number;
}

export interface ClassStudent {
  id: number;
  name: string;
  email: string;
  status?: string;
  group?: string;
}

// NOTE: UI-driven search result shape for faculty email lookup in the class roster page.
export interface FacultyStudentSearchResult {
  studentId: number | null;
  userId: number | null;
  studentName: string;
  studentEmail: string;
  major: string;
  cwid: string;
  canvasUserId: string;
  alreadyInCourse: boolean;
  currentStatus: string;
  canEnroll: boolean;
  reason: string;
}

// NOTE: UI-driven suggestion item now includes full student profile fields from teammate search endpoint.
export interface FacultyStudentEmailSuggestion {
  studentId: number | null;
  userId: number | null;
  name: string;
  email: string;
  major: string;
  cwid: string;
  canvasUserId: string;
  currentStatus: string;
  alreadyInCourse: boolean;
}

// NOTE: UI-driven roster row shape for faculty student table; keep aligned to rendered columns only.
export interface FacultyRosterStudentRow {
  id: string;
  studentId: number | null;
  name: string;
  email: string;
  enrolledLabel: string;
  status: "active" | "inactive" | "unassigned";
  group: string;
  progressSubmitted: number;
  progressTotal: number;
  completionPercent: number;
  /** Default display avg score (percentage). See also gradedOnly/includeMissing variants. */
  avgScore: number;
  /** Average percent over graded assignments only. */
  avgScoreGradedOnly?: number;
  /** Average percent counting missing/ungraded as 0. */
  avgScoreIncludingMissing?: number;
  lastActivity: string;
}

// NOTE: UI-driven roster stats used by the top summary cards on the faculty student roster section.
export interface FacultyRosterStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  avgScore: number;
  completion: number;
}

export interface ClassSubmissionRow {
  id: string;
  student: string;
  assignment: string;
  submittedAt: string;
  status: "ungraded" | "graded";
  score?: number;
}

export interface ClassRecentActivity {
  id: number;
  type: "submission" | "graded" | "student";
  message: string;
  time: string;
  iconKey: "send" | "check" | "user-plus";
  iconBg: string;
  iconColor: string;
}
