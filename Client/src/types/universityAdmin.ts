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
}
