import api from "../api/axios";
import type { GradingAssistantRequest, GradingAssistantResponse } from "../types/gradingAssistant";

const BASE = "/api/v1/faculty/grading-assistants";

export async function getAllGradingAssistants(): Promise<GradingAssistantResponse[]> {
  const { data } = await api.get<GradingAssistantResponse[]>(BASE);
  return data ?? [];
}

export async function getGradingAssistant(id: number | string): Promise<GradingAssistantResponse> {
  const numericId = Number(id);
  const { data } = await api.get<GradingAssistantResponse>(`${BASE}/${numericId}`);
  return data;
}

export async function createGradingAssistant(
  payload: GradingAssistantRequest
): Promise<GradingAssistantResponse> {
  const { data } = await api.post<GradingAssistantResponse>(BASE, payload);
  return data;
}

export async function updateGradingAssistant(
  id: number | string,
  payload: GradingAssistantRequest
): Promise<GradingAssistantResponse> {
  const numericId = Number(id);
  const { data } = await api.put<GradingAssistantResponse>(`${BASE}/${numericId}`, payload);
  return data;
}

export async function deleteGradingAssistant(id: number | string): Promise<void> {
  const numericId = Number(id);
  await api.delete(`${BASE}/${numericId}`);
}
