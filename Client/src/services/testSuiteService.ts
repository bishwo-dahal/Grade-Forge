import type { TestSuiteDetail, TestSuitePayload } from "../types/testSuite";
import api from "../api/axios";

export async function getTestSuiteByAssignment(assignmentId: string): Promise<TestSuiteDetail | null> {
  const id = Number(assignmentId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid assignment id.");
  }
  try {
    const { data } = await api.get<TestSuiteDetail>(`/api/v1/faculty/assignments/${id}/test-suite`);
    return data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getTestSuiteByCourseAndAssignment(
  courseId: string,
  assignmentId: string
): Promise<TestSuiteDetail | null> {
  const cId = Number(courseId);
  const aId = Number(assignmentId);
  if (!Number.isFinite(cId) || cId <= 0 || !Number.isFinite(aId) || aId <= 0) {
    throw new Error("Invalid course or assignment id.");
  }
  try {
    const { data } = await api.get<TestSuiteDetail>(
      `/api/v1/student/assignments/course/${cId}/${aId}/test-suite`
    );
    return data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createTestSuite(assignmentId: string, payload: TestSuitePayload): Promise<TestSuiteDetail> {
  const id = Number(assignmentId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid assignment id.");
  }
  const { data } = await api.post<TestSuiteDetail>(`/api/v1/faculty/assignments/${id}/test-suite`, payload);
  return data;
}

export async function updateTestSuite(assignmentId: string, payload: TestSuitePayload): Promise<TestSuiteDetail> {
  const id = Number(assignmentId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid assignment id.");
  }
  const { data } = await api.put<TestSuiteDetail>(`/api/v1/faculty/assignments/${id}/test-suite`, payload);
  return data;
}
