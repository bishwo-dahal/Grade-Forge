import api from "../api/axios";
import type { Rubric, RubricCreatePayload, RubricSummary, RubricCriterion, RubricType } from "../types/rubric";

/** Flat criterion (legacy API). */
interface RubricCriteriaApiResponse {
  id: number;
  title: string;
  description?: string | null;
  maxScore?: number;
  weight?: number | null;
  points?: number | null;
  subCriteria?: RubricSubCriteriaApiResponse[];
}

/** API response for get rubric by id. */
interface RubricApiResponse {
  id: number;
  name: string;
  description: string | null;
  facultyId: number | null;
  rubricType?: RubricType;
  criteria: RubricCriteriaApiResponse[];
}

interface RubricSubCriteriaApiResponse {
  id?: number;
  description?: string | null;
  maxScore: number;
  weight?: number | null;
}

function mapCriterion(c: RubricCriteriaApiResponse): RubricCriterion {
  if (c.subCriteria && c.subCriteria.length > 0) {
    return {
      id: c.id,
      title: c.title,
      points: c.points ?? null,
      subCriteria: c.subCriteria.map((s) => ({
        id: s.id,
        description: s.description ?? null,
        maxScore: s.maxScore,
        weight: s.weight ?? null,
      })),
    };
  }
  return {
    id: c.id,
    title: c.title,
    description: c.description ?? null,
    maxScore: c.maxScore ?? 0,
    weight: c.weight ?? null,
    points: c.points ?? null,
    subCriteria: [{ description: c.description, maxScore: c.maxScore ?? 0, weight: c.weight }],
  };
}

function mapRubric(apiData: RubricApiResponse): Rubric {
  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description,
    facultyId: apiData.facultyId,
    rubricType: apiData.rubricType,
    criteria: (apiData.criteria ?? []).map(mapCriterion),
  };
}

function mapRubricToSummary(api: RubricApiResponse): RubricSummary {
  const criteria = (api.criteria ?? []).map(mapCriterion);
  const totalMaxScore = criteria.reduce(
    (sum, c) =>
      sum +
      (c.subCriteria?.reduce((s, sub) => s + (sub.maxScore ?? 0), 0) ?? (c.maxScore ?? 0)),
    0,
  );
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    criteriaCount: criteria.length,
    totalMaxScore,
    criteria,
  };
}

export async function listMyRubrics(): Promise<RubricSummary[]> {
  try {
    const { data } = await api.get<RubricApiResponse[]>("/api/v1/faculty/rubrics/faculty/me");
    return data.map(mapRubricToSummary);
  } catch (error: any) {
    const status = error?.response?.status as number | undefined;
    // Backend returns 400 (via ResourceNotFoundException → GlobalExceptionHandling) when no rubrics exist.
    // Also handle 404 defensively in case the mapping changes.
    if (status === 404 || status === 400) {
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

/**
 * For unweighted rubrics (rubricType null or UNWEIGHTED), returns the sum of criterion points.
 * Each criterion contributes its `points` if set, otherwise the sum of its subCriteria maxScore.
 * Returns null if the rubric is weighted (so assignment total should not be driven by rubric).
 */
export function getUnweightedRubricTotalPoints(rubric: Rubric): number | null {
  if (rubric.rubricType != null && rubric.rubricType !== "UNWEIGHTED") {
    return null;
  }
  const criteria = rubric.criteria ?? [];
  const total = criteria.reduce((sum, c) => {
    if (c.points != null && Number.isFinite(c.points)) {
      return sum + c.points;
    }
    if (c.subCriteria?.length) {
      return sum + c.subCriteria.reduce((s, sub) => s + (sub.maxScore ?? 0), 0);
    }
    return sum + (c.maxScore ?? 0);
  }, 0);
  return total;
}

/** GET /api/v1/student/rubrics/{rubricId} — full rubric for student view (same shape as faculty). */
export async function getStudentRubric(rubricId: number | string): Promise<Rubric | null> {
  try {
    const id = Number(rubricId);
    const { data } = await api.get<RubricApiResponse>(`/api/v1/student/rubrics/${id}`);
    return data ? mapRubric(data) : null;
  } catch {
    return null;
  }
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

