import api, { apiBaseURL } from "../api/axios";
import { getToken } from "../app/auth";
import { getApiErrorMessage } from "../utils/apiErrorMessage";
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
  profilePictureUrl?: string | null;
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

const SIGNUP_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function isAllowedProfileImage(file: File): boolean {
  if (ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
    return true;
  }
  return /\.(jpe?g|png)$/i.test(file.name);
}

/**
 * Multipart signup uses `fetch` (not axios) so the browser sets `multipart/form-data` with a
 * boundary only. Axios/XHR can produce `...;charset=UTF-8`, which Spring often rejects for
 * `@PostMapping(consumes = MULTIPART_FORM_DATA)`.
 */
export async function signup(
  payload: SignupRequest,
  profilePicture?: File | null,
): Promise<AuthResponse> {
  if (profilePicture && profilePicture.size > SIGNUP_IMAGE_MAX_BYTES) {
    throw new Error("Profile picture must be 5 MB or smaller.");
  }
  if (profilePicture && profilePicture.size > 0 && !isAllowedProfileImage(profilePicture)) {
    throw new Error("Profile picture must be a JPG or PNG file.");
  }

  const formData = new FormData();
  formData.append("signupRequest", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (profilePicture && profilePicture.size > 0) {
    formData.append("file", profilePicture);
  }

  const url = `${apiBaseURL}/api/v1/auth/signup`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(getApiErrorMessage({ response: { data } }, "Sign up failed."));
  }

  return data as AuthResponse;
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
