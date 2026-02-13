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

export interface SupportedLanguage {
  name: string;
  version: string;
  addedOn: string;
  icon: "python" | "javascript" | "java" | "cpp" | "rust" | "go";
}
