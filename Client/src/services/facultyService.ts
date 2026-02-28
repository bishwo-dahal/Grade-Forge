import api from "../api/axios";
import type { FacultyResponse, FacultyUpdateRequest } from "../types/faculty";

const BASE = "/api/v1/faculty";

export async function getCurrentFaculty(): Promise<FacultyResponse> {
  const { data } = await api.get<FacultyResponse>(`${BASE}/me`);
  return data;
}

export async function updateCurrentFaculty(
  payload: FacultyUpdateRequest
): Promise<FacultyResponse> {
  const { data } = await api.put<FacultyResponse>(`${BASE}/me`, payload);
  return data;
}
