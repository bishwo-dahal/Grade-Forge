import type {
  AcademicSemester,
  ActivityLogPageResponse,
  ActivityLogQueryParams,
  FacultyApiResponse,
  FacultyCreatePayload,
  FacultyMember,
  LanguageCreatePayload,
  SemesterApiResponse,
  SemesterCreatePayload,
  StudentSearchResponseDto,
  SupportedLanguage,
  UniversityCourseRow,
} from "../types/universityAdmin";
import api from "../api/axios";

const departmentOptions = ["Computer Science", "Software Engineering", "Data Science"];
// NOTE: Courses intentionally start empty until the university courses backend endpoint is integrated.
const universityCourses: UniversityCourseRow[] = [];
type ProgrammingLanguageApiResponse = {
  id: number;
  name: string;
  dockerImage: string | null;
  compileCommand: string | null;
  executionCode: string | null;
  isActive: boolean | null;
  allowedExtensions?: string | null;
};

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

function mapProgrammingLanguageToUiModel(language: ProgrammingLanguageApiResponse): SupportedLanguage {
  return {
    id: language.id,
    name: language.name,
    dockerImage: language.dockerImage ?? "",
    compileCommand: language.compileCommand ?? undefined,
    executionCode: language.executionCode ?? "",
    isActive: language.isActive ?? true,
    allowedExtensions: language.allowedExtensions ?? undefined,
  };
}

export async function listSupportedLanguages(): Promise<SupportedLanguage[]> {
  // TODO(backend): Keep this endpoint and response shape stable because language management renders directly from it.
  const { data } = await api.get<ProgrammingLanguageApiResponse[]>("/api/v1/university_admin/programming-languages/all");
  return data.map(mapProgrammingLanguageToUiModel);
}

function toUpdatePayload(payload: LanguageCreatePayload) {
  return {
    name: payload.name,
    dockerImage: payload.dockerImage,
    compileCommand: payload.compileCommand?.trim() || null,
    executionCode: payload.executionCode,
    isActive: payload.isActive,
    allowedExtensions: payload.allowedExtensions?.trim() || null,
  };
}

export async function createSupportedLanguage(payload: LanguageCreatePayload): Promise<SupportedLanguage> {
  // TODO(backend): Keep payload fields aligned with ProgrammingLanguageRequest in backend when evolving language model.
  const { data } = await api.post<ProgrammingLanguageApiResponse>(
    "/api/v1/university_admin/programming-languages",
    toUpdatePayload(payload)
  );
  return mapProgrammingLanguageToUiModel(data);
}

export async function updateSupportedLanguage(
  languageId: number,
  payload: LanguageCreatePayload
): Promise<SupportedLanguage> {
  const { data } = await api.put<ProgrammingLanguageApiResponse>(
    `/api/v1/university_admin/programming-languages/${languageId}`,
    toUpdatePayload(payload)
  );
  return mapProgrammingLanguageToUiModel(data);
}

export async function removeSupportedLanguage(languageId: number): Promise<void> {
  // TODO(backend): Keep id-based delete endpoint stable for row-level language actions in UI.
  await api.delete(`/api/v1/university_admin/programming-languages/${languageId}`);
}

export function listDepartmentOptions(): Promise<string[]> {
  return Promise.resolve(departmentOptions);
}

export function listUniversityCourses(): Promise<UniversityCourseRow[]> {
  // TODO(backend): Replace with university courses listing endpoint and keep return shape stable.
  return Promise.resolve(universityCourses);
}

export async function fetchActivityLogs(params: ActivityLogQueryParams): Promise<ActivityLogPageResponse> {
  const { page = 0, size = 20, user, role, status, date, start, end } = params;
  const { data } = await api.get<ActivityLogPageResponse>("/api/v1/university_admin/activity", {
    params: {
      page,
      size,
      ...(user?.trim() ? { user: user.trim() } : {}),
      ...(role?.trim() ? { role: role.trim() } : {}),
      ...(status?.trim() ? { status: status.trim() } : {}),
      ...(date?.trim() ? { date: date.trim() } : {}),
      ...(start?.trim() ? { start: start.trim() } : {}),
      ...(end?.trim() ? { end: end.trim() } : {}),
    },
  });
  return data;
}

export async function searchStudents(keyword: string): Promise<StudentSearchResponseDto[]> {
  const { data } = await api.get<StudentSearchResponseDto[]>("/api/search/students/plain", {
    params: {
      keyword: keyword.trim(),
    },
  });
  return data;
}
