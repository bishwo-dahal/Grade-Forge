import api from "../api/axios";
import type { UserProfile } from "../types/user";

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
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
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/v1/auth/login", credentials);
  return data;
}

export async function signup(payload: SignupRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/v1/auth/signup", payload);
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
