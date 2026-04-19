import api from "../api/axios";
import type { StudentResponse, StudentUpdateRequest } from "../types/student";

export async function getCurrentStudent(): Promise<StudentResponse> {
  const { data } = await api.get<StudentResponse>("/api/v1/students/me");
  return data;
}

export async function updateCurrentStudent(payload: StudentUpdateRequest): Promise<StudentResponse> {
  const { data } = await api.put<StudentResponse>("/api/v1/students/me", payload);
  return data;
}
