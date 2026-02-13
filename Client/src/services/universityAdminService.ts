import type {
  AcademicSemester,
  FacultyMember,
  SupportedLanguage,
  UniversitySummaryStat,
} from "../types/universityAdmin";

// NOTE: Centralized mock university-admin data to create a single integration seam.
// TODO(backend): Replace these mock functions with real API calls.

const summaryStats: UniversitySummaryStat[] = [
  { iconKey: "users", label: "Active Faculty", value: "3", accent: "blue" },
  { iconKey: "code", label: "Supported Languages", value: "6", accent: "orange" },
  { iconKey: "users", label: "Total Classes", value: "9", accent: "blue" },
  { iconKey: "users", label: "Total Students", value: "247", accent: "orange" },
];

const facultyMembers: FacultyMember[] = [
  {
    initials: "DRC",
    name: "Dr. Rachel Chen",
    email: "r.chen@university.edu",
    department: "Computer Science",
    classes: 4,
    students: 104,
    status: "active",
  },
  {
    initials: "PMT",
    name: "Prof. Michael Torres",
    email: "m.torres@university.edu",
    department: "Computer Science",
    classes: 3,
    students: 87,
    status: "active",
  },
  {
    initials: "DSW",
    name: "Dr. Sarah Williams",
    email: "s.williams@university.edu",
    department: "Software Engineering",
    classes: 2,
    students: 56,
    status: "active",
  },
  {
    initials: "PJK",
    name: "Prof. James Kim",
    email: "j.kim@university.edu",
    department: "Computer Science",
    classes: 0,
    students: 0,
    status: "inactive",
  },
];

const academicSemesters: AcademicSemester[] = [
  {
    name: "Fall 2023",
    status: "active",
    startDate: "Aug 14, 2023",
    endDate: "Dec 14, 2023",
    courses: 10,
  },
  {
    name: "Spring 2024",
    status: "upcoming",
    startDate: "Jan 14, 2024",
    endDate: "May 14, 2024",
    courses: 0,
  },
  {
    name: "Summer 2023",
    status: "past",
    startDate: "May 14, 2023",
    endDate: "Aug 14, 2023",
    courses: 5,
  },
];

const supportedLanguages: SupportedLanguage[] = [
  { name: "Python", version: "v3.11", addedOn: "Added Jan 14, 2023", icon: "python" },
  { name: "JavaScript", version: "vES2023", addedOn: "Added Jan 14, 2023", icon: "javascript" },
  { name: "Java", version: "v17 LTS", addedOn: "Added Jan 14, 2023", icon: "java" },
  { name: "C++", version: "vC++20", addedOn: "Added Feb 19, 2023", icon: "cpp" },
  { name: "Rust", version: "v1.75", addedOn: "Added Jan 9, 2024", icon: "rust" },
  { name: "Go", version: "v1.21", addedOn: "Added Jan 9, 2024", icon: "go" },
];

const departmentOptions = ["Computer Science", "Software Engineering", "Data Science"];

export function listUniversitySummaryStats(): Promise<UniversitySummaryStat[]> {
  return Promise.resolve(summaryStats);
}

export function listFacultyMembers(): Promise<FacultyMember[]> {
  return Promise.resolve(facultyMembers);
}

export function listAcademicSemesters(): Promise<AcademicSemester[]> {
  return Promise.resolve(academicSemesters);
}

export function listSupportedLanguages(): Promise<SupportedLanguage[]> {
  return Promise.resolve(supportedLanguages);
}

export function listDepartmentOptions(): Promise<string[]> {
  return Promise.resolve(departmentOptions);
}
