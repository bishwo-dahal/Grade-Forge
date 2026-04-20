import api from "../api/axios";
import type { MainGroupResponse, SubGroupResponse } from "../types/courseGroup";

function parseCourseId(classId: string): number {
  const parsed = Number(classId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid course id.");
  }
  return parsed;
}

export async function listFacultyCourseGroups(classId: string): Promise<MainGroupResponse[]> {
  const courseId = parseCourseId(classId);
  const { data } = await api.get<MainGroupResponse[]>(`/api/v1/faculty/courses/${courseId}/groups`);
  return data ?? [];
}

export async function createFacultyMainGroup(classId: string, name: string): Promise<MainGroupResponse> {
  const courseId = parseCourseId(classId);
  const { data } = await api.post<MainGroupResponse>(`/api/v1/faculty/courses/${courseId}/groups`, {
    name: name.trim(),
  });
  return data;
}

export async function createFacultySubGroup(
  classId: string,
  mainGroupId: number,
  name: string,
): Promise<SubGroupResponse> {
  const courseId = parseCourseId(classId);
  const { data } = await api.post<SubGroupResponse>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}/subgroups`,
    { name: name.trim() },
  );
  return data;
}

export async function updateFacultyMainGroupName(
  classId: string,
  mainGroupId: number,
  name: string,
): Promise<MainGroupResponse> {
  const courseId = parseCourseId(classId);
  const { data } = await api.put<MainGroupResponse>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}`,
    { name: name.trim() },
  );
  return data;
}

export async function deleteFacultyMainGroup(
  classId: string,
  mainGroupId: number,
): Promise<{ message?: string }> {
  const courseId = parseCourseId(classId);
  const { data } = await api.delete<{ message?: string }>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}`,
  );
  return data ?? {};
}

export async function updateFacultySubGroupName(
  classId: string,
  mainGroupId: number,
  subGroupId: number,
  name: string,
): Promise<SubGroupResponse> {
  const courseId = parseCourseId(classId);
  const { data } = await api.put<SubGroupResponse>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}/subgroups/${subGroupId}`,
    { name: name.trim() },
  );
  return data;
}

export async function deleteFacultySubGroup(
  classId: string,
  mainGroupId: number,
  subGroupId: number,
): Promise<{ message?: string }> {
  const courseId = parseCourseId(classId);
  const { data } = await api.delete<{ message?: string }>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}/subgroups/${subGroupId}`,
  );
  return data ?? {};
}

export async function addStudentToFacultySubGroup(
  classId: string,
  mainGroupId: number,
  subGroupId: number,
  studentId: number,
): Promise<SubGroupResponse> {
  const courseId = parseCourseId(classId);
  const { data } = await api.post<SubGroupResponse>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}/subgroups/${subGroupId}/students`,
    { studentId },
  );
  return data;
}

export async function removeStudentFromFacultySubGroup(
  classId: string,
  mainGroupId: number,
  subGroupId: number,
  studentId: number,
): Promise<SubGroupResponse> {
  const courseId = parseCourseId(classId);
  const { data } = await api.delete<SubGroupResponse>(
    `/api/v1/faculty/courses/${courseId}/groups/${mainGroupId}/subgroups/${subGroupId}/students/${studentId}`,
  );
  return data;
}

export async function listStudentCourseGroups(classId: string): Promise<MainGroupResponse[]> {
  const courseId = parseCourseId(classId);
  const { data } = await api.get<MainGroupResponse[]>(`/api/v1/student/courses/${courseId}/groups`);
  return data ?? [];
}

export async function getStudentAssignmentSubGroup(
  classId: string,
  assignmentId: string | number,
): Promise<SubGroupResponse> {
  const courseId = parseCourseId(classId);
  const parsedAssignmentId = Number(assignmentId);
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }
  const { data } = await api.get<SubGroupResponse>(
    `/api/v1/student/courses/${courseId}/groups/assignments/${parsedAssignmentId}`,
  );
  return data;
}
