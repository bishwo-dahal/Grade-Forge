import type {
  AcademicSemester,
  FacultyApiResponse,
  FacultyCreatePayload,
  FacultyMember,
  LanguageCreatePayload,
  SemesterApiResponse,
  SemesterCreatePayload,
  SupportedLanguage,
  UniversityCourseRow,
} from "../types/universityAdmin";
import api from "../api/axios";

let supportedLanguages: SupportedLanguage[] = [
  { id: "language-python", name: "Python", version: "v3.11", addedOn: "Added Jan 14, 2023", icon: "python" },
  { id: "language-javascript", name: "JavaScript", version: "vES2023", addedOn: "Added Jan 14, 2023", icon: "javascript" },
  { id: "language-java", name: "Java", version: "v17 LTS", addedOn: "Added Jan 14, 2023", icon: "java" },
  { id: "language-cpp", name: "C++", version: "vC++20", addedOn: "Added Feb 19, 2023", icon: "cpp" },
  { id: "language-rust", name: "Rust", version: "v1.75", addedOn: "Added Jan 9, 2024", icon: "rust" },
  { id: "language-go", name: "Go", version: "v1.21", addedOn: "Added Jan 9, 2024", icon: "go" },
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
    id: faculty.facultyId,
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
    id: semester.id,
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

export async function deleteFacultyById(facultyId: number): Promise<void> {
  // TODO(backend): Keep this endpoint stable because UI destructive actions depend on id-based deletion.
  await api.delete(`/api/v1/university_admin/faculty/${facultyId}`);
}

export async function listAcademicSemesters(): Promise<AcademicSemester[]> {
  const { data } = await api.get<SemesterApiResponse[]>("/api/v1/university_admin/semester/all");
  return data.map(mapSemesterToUiModel);
}

export async function createAcademicSemester(payload: SemesterCreatePayload): Promise<void> {
  await api.post("/api/v1/university_admin/semester", payload);
}

export async function deleteAcademicSemesterById(semesterId: number): Promise<void> {
  // TODO(backend): Keep this endpoint stable because UI destructive actions depend on id-based deletion.
  await api.delete(`/api/v1/university_admin/semester/${semesterId}`);
}

export function listSupportedLanguages(): Promise<SupportedLanguage[]> {
  return Promise.resolve(supportedLanguages);
}

export function createSupportedLanguage(payload: LanguageCreatePayload): Promise<SupportedLanguage> {
  const name = payload.name.trim();
  const version = payload.version.trim();
  const normalizedName = name.toLowerCase();
  const normalizedVersion = version.toLowerCase();
  const alreadyExists = supportedLanguages.some(
    (language) => language.name.toLowerCase() === normalizedName && language.version.toLowerCase() === normalizedVersion,
  );

  if (alreadyExists) {
    return Promise.reject(new Error("This language and version already exists."));
  }

  const createdLanguage: SupportedLanguage = {
    id: `language-${Date.now()}`,
    name,
    version: version.startsWith("v") ? version : `v${version}`,
    addedOn: `Added ${dateFormatter.format(new Date())}`,
    // NOTE: Newly created custom languages use a neutral generic icon until icon mapping is backend-driven.
    icon: "code",
  };

  // NOTE: Mutate in-memory mock store so add/remove actions behave like real management workflow before backend integration.
  supportedLanguages = [createdLanguage, ...supportedLanguages];
  return Promise.resolve(createdLanguage);
}

export function removeSupportedLanguage(languageId: string): Promise<void> {
  // TODO(backend): Replace in-memory removal with DELETE endpoint once language management APIs are available.
  supportedLanguages = supportedLanguages.filter((language) => language.id !== languageId);
  return Promise.resolve();
}

export function listDepartmentOptions(): Promise<string[]> {
  return Promise.resolve(departmentOptions);
}

export function listUniversityCourses(): Promise<UniversityCourseRow[]> {
  // TODO(backend): Replace with university courses listing endpoint and keep return shape stable.
  return Promise.resolve(universityCourses);
}
