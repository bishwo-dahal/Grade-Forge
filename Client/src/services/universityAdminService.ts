import type {
  AcademicSemester,
  FacultyApiResponse,
  FacultyCreatePayload,
  FacultyMember,
  SemesterApiResponse,
  SemesterCreatePayload,
  SupportedLanguage,
  UniversityCourseRow,
} from "../types/universityAdmin";
import api from "../api/axios";

const supportedLanguages: SupportedLanguage[] = [
  { name: "Python", version: "v3.11", addedOn: "Added Jan 14, 2023", icon: "python" },
  { name: "JavaScript", version: "vES2023", addedOn: "Added Jan 14, 2023", icon: "javascript" },
  { name: "Java", version: "v17 LTS", addedOn: "Added Jan 14, 2023", icon: "java" },
  { name: "C++", version: "vC++20", addedOn: "Added Feb 19, 2023", icon: "cpp" },
  { name: "Rust", version: "v1.75", addedOn: "Added Jan 9, 2024", icon: "rust" },
  { name: "Go", version: "v1.21", addedOn: "Added Jan 9, 2024", icon: "go" },
];

const departmentOptions = ["Computer Science", "Software Engineering", "Data Science"];
// NOTE: Courses intentionally start empty until the university courses backend endpoint is integrated.
const universityCourses: UniversityCourseRow[] = [];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function toInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toReadableDate(dateValue: string): string {
  return dateFormatter.format(new Date(`${dateValue}T00:00:00`));
}

function toSemesterStatus(startDate: string, endDate: string): AcademicSemester["status"] {
  const now = new Date();
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);

  if (now < start) {
    return "upcoming";
  }

  if (now > end) {
    return "past";
  }

  return "active";
}

function mapFacultyToUiModel(faculty: FacultyApiResponse): FacultyMember {
  return {
    initials: toInitials(faculty.name),
    name: faculty.name,
    email: faculty.email,
    department: faculty.department,
    classes: 0,
    students: 0,
    status: faculty.active ? "active" : "inactive",
  };
}

function mapSemesterToUiModel(semester: SemesterApiResponse): AcademicSemester {
  return {
    name: semester.name,
    status: toSemesterStatus(semester.startDate, semester.endDate),
    startDate: toReadableDate(semester.startDate),
    endDate: toReadableDate(semester.endDate),
    courses: 0,
  };
}

export async function listFacultyMembers(): Promise<FacultyMember[]> {
  const { data } = await api.get<FacultyApiResponse[]>("/api/v1/university_admin/faculty/all");
  return data.map(mapFacultyToUiModel);
}

export async function createFaculty(payload: FacultyCreatePayload): Promise<void> {
  await api.post("/api/v1/university_admin/faculty/create", payload);
}

export async function listAcademicSemesters(): Promise<AcademicSemester[]> {
  const { data } = await api.get<SemesterApiResponse[]>("/api/v1/university_admin/semester/all");
  return data.map(mapSemesterToUiModel);
}

export async function createAcademicSemester(payload: SemesterCreatePayload): Promise<void> {
  await api.post("/api/v1/university_admin/semester", payload);
}

export function listSupportedLanguages(): Promise<SupportedLanguage[]> {
  return Promise.resolve(supportedLanguages);
}

export function listDepartmentOptions(): Promise<string[]> {
  return Promise.resolve(departmentOptions);
}

export function listUniversityCourses(): Promise<UniversityCourseRow[]> {
  // TODO(backend): Replace with university courses listing endpoint and keep return shape stable.
  return Promise.resolve(universityCourses);
}
