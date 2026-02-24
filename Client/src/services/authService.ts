import api from "../api/axios";
import type { UserProfile } from "../types/user";
import type {
  StudentRegistrationCompletionRequest,
  StudentRegistrationCompletionResponse,
} from "../types/student";

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  // NOTE: Student auth responses include this gate flag so incomplete profiles can be redirected before dashboard access.
  profileCompleted: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "FACULTY" | "UNIVERSITY_ADMIN" | "SYSTEM_ADMIN";
  // NOTE: Student profile details are optional at signup; when omitted, completion is enforced on first sign-in.
  cwid?: string;
  major?: string;
  canvasUserId?: string;
}

export interface PasswordUpdateRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/v1/auth/login", credentials);
  return data;
}

export async function signup(payload: SignupRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/v1/auth/signup", payload);
  return data;
}

export async function completeStudentRegistration(
  payload: StudentRegistrationCompletionRequest,
): Promise<StudentRegistrationCompletionResponse> {
  // TODO(backend): Keep this endpoint stable as the required profile-completion handoff used by auth gate logic.
  const { data } = await api.put<StudentRegistrationCompletionResponse>(
    "/api/v1/students/me/complete-registration",
    payload,
  );
  return data;
}

export async function updatePassword(payload: PasswordUpdateRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/v1/auth/update-password", payload);
  return data;
}

export function getStudentProfile(): Promise<UserProfile> {
  return Promise.resolve({
    id: "student-1",
    name: "Student",
    handle: "@student.edu",
    initials: "ST",
    role: "student",
  });
}

export function getFacultyProfile(): Promise<UserProfile> {
  return Promise.resolve({
    id: "faculty-1",
    name: "Faculty",
    handle: "@faculty.edu",
    initials: "FA",
    role: "faculty",
  });
}
