// NOTE: UI-driven models for the university admin dashboard integration seam.

export interface UniversitySummaryStat {
  label: string;
  value: string;
  iconKey: "users" | "code";
  accent: "blue" | "orange";
}

export interface FacultyMember {
  initials: string;
  name: string;
  email: string;
  department: string;
  classes: number;
  students: number;
  status: "active" | "inactive";
}

export interface AcademicSemester {
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
  // NOTE: Stable row id used by language management list actions.
  id: string;
  name: string;
  version: string;
  addedOn: string;
  icon: "python" | "javascript" | "java" | "cpp" | "rust" | "go" | "code";
}

// NOTE: UI-driven payload for creating supported languages in the university workspace.
export interface LanguageCreatePayload {
  name: string;
  version: string;
}
