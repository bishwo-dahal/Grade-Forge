import api from "../api/axios";
import type { Rubric, RubricCreatePayload, RubricSummary, RubricCriterion } from "../types/rubric";

interface RubricCriteriaApiResponse {
  id: number;
  title: string;
  description: string | null;
  maxScore: number;
  weight: number | null;
}

interface RubricApiResponse {
  id: number;
  name: string;
  description: string | null;
  facultyId: number | null;
  criteria: RubricCriteriaApiResponse[];
}

function mapCriterion(api: RubricCriteriaApiResponse): RubricCriterion {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    maxScore: api.maxScore,
    weight: api.weight,
  };
}

function mapRubric(api: RubricApiResponse): Rubric {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    facultyId: api.facultyId,
    criteria: (api.criteria ?? []).map(mapCriterion),
  };
}

function mapRubricToSummary(api: RubricApiResponse): RubricSummary {
  const criteria = api.criteria ?? [];
  const totalMaxScore = criteria.reduce((sum, c) => sum + (c.maxScore ?? 0), 0);
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    criteriaCount: criteria.length,
    totalMaxScore,
  };
}

export async function listMyRubrics(): Promise<RubricSummary[]> {
  try {
    const { data } = await api.get<RubricApiResponse[]>("/api/v1/faculty/rubrics/faculty/me");
    return data.map(mapRubricToSummary);
  } catch (error: any) {
    const status = error?.response?.status as number | undefined;
    if (status === 404) {
      // Backend throws ResourceNotFoundException when no rubrics exist; treat as empty list.
      return [];
    }
    throw error;
  }
}

export async function getRubric(id: number | string): Promise<Rubric> {
  const numericId = Number(id);
  const { data } = await api.get<RubricApiResponse>(`/api/v1/faculty/rubrics/${numericId}`);
  return mapRubric(data);
}

export async function createRubric(payload: RubricCreatePayload): Promise<Rubric> {
  const { data } = await api.post<RubricApiResponse>("/api/v1/faculty/rubrics", payload);
  return mapRubric(data);
}

export async function updateRubric(id: number | string, payload: RubricCreatePayload): Promise<Rubric> {
  const numericId = Number(id);
  const { data } = await api.put<RubricApiResponse>(`/api/v1/faculty/rubrics/${numericId}`, payload);
  return mapRubric(data);
}

export async function deleteRubric(id: number | string): Promise<void> {
  const numericId = Number(id);
  await api.delete(`/api/v1/faculty/rubrics/${numericId}`);
}

