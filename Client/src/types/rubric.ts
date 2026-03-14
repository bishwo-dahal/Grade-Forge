/** Sub-criterion under a criterion: description, maxScore, weight. */
export interface RubricSubCriteriaRequest {
  description?: string | null;
  maxScore: number;
  weight?: number | null;
}

/** Criterion: title only; sub-criteria hold the grading details. */
export interface RubricCriteriaRequest {
  title: string;
  subCriteria: RubricSubCriteriaRequest[];
}

/** Request body for create/update rubric (matches backend RubricRequest). */
export interface RubricRequest {
  name: string;
  description?: string | null;
  facultyId?: number | null;
  criteria: RubricCriteriaRequest[];
}

/** Single criterion from API (may include id and nested subCriteria). */
export interface RubricCriterion {
  id?: number;
  title: string;
  description?: string | null;
  maxScore?: number;
  weight?: number | null;
  /** Nested sub-criteria when API returns new structure. */
  subCriteria?: Array<{
    id?: number;
    description?: string | null;
    maxScore: number;
    weight?: number | null;
  }>;
}

export interface Rubric {
  id: number;
  name: string;
  description?: string | null;
  facultyId: number | null;
  criteria: RubricCriterion[];
}

/** Lightweight shape for displaying rubrics in lists/sidebars. */
export interface RubricSummary {
  id: number;
  name: string;
  description?: string | null;
  criteriaCount: number;
  totalMaxScore: number;
  criteria: RubricCriterion[];
}

/** Payload used when creating or updating a rubric from the faculty UI. */
export type RubricCreatePayload = RubricRequest;

