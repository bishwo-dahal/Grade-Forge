
export interface RubricCriterion {
  id?: number;
  title: string;
  description?: string | null;
  maxScore: number;
  weight?: number | null;
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
}

/** Payload used when creating or updating a rubric from the faculty UI. */
export interface RubricCreatePayload {
  name: string;
  description?: string | null;
  /** Criteria list; backend requires at least one and validates each item. */
  criteria: Array<{
    title: string;
    description?: string | null;
    maxScore: number;
    weight?: number | null;
  }>;
}

