import type { RubricCategory } from "../../../types/grade";
import { formatMax2Decimals, roundTo2 } from "../../../utils/number";

export interface FlatRubricCriterion {
  id?: number;
  maxPoints: number;
  weight?: number | null;
}

export function flattenRubricCriteria(categories: RubricCategory[]): FlatRubricCriterion[] {
  const list: FlatRubricCriterion[] = [];
  for (const category of categories) {
    for (const criterion of category.criteria) {
      list.push({
        id: criterion.id,
        maxPoints: criterion.points,
        weight: criterion.weight ?? null,
      });
    }
  }
  return list;
}

export function rubricTotal(categories: RubricCategory[]): number {
  return categories.reduce((sum, category) => sum + category.points, 0);
}

export function rubricUsesWeightedPoints(criteria: FlatRubricCriterion[]): boolean {
  return (
    criteria.length > 0 &&
    criteria.every((criterion) => criterion.weight != null && Number.isFinite(criterion.weight) && criterion.weight >= 0)
  );
}

export function parseScoreInput(value: string): number {
  return Math.max(0, Number.parseFloat(value) || 0);
}

export function maxPtsForCriterion(
  maxPoints: number,
  weight: number | null | undefined,
  assignmentMaxPoints: number,
  rubricMaxPoints: number,
): number {
  if (weight != null && weight >= 0) {
    return roundTo2((weight / 100) * assignmentMaxPoints);
  }
  if (rubricMaxPoints > 0 && maxPoints > 0) {
    return roundTo2((maxPoints / rubricMaxPoints) * assignmentMaxPoints);
  }
  return assignmentMaxPoints;
}

export function calculateCriterionPoints(
  gradeInput: string,
  criterion: FlatRubricCriterion,
  assignmentMaxPoints: number,
  rubricMaxPoints: number,
): number {
  const grade = criterion.maxPoints > 0
    ? Math.min(criterion.maxPoints, parseScoreInput(gradeInput))
    : parseScoreInput(gradeInput);

  if (criterion.weight != null && criterion.maxPoints > 0) {
    return roundTo2((grade / criterion.maxPoints) * (criterion.weight / 100) * assignmentMaxPoints);
  }

  if (rubricMaxPoints > 0) {
    return roundTo2((grade * assignmentMaxPoints) / rubricMaxPoints);
  }

  return 0;
}

export function gradeFromCriterionPoints(
  pts: number,
  criterion: FlatRubricCriterion,
  assignmentMaxPoints: number,
  rubricMaxPoints: number,
): number {
  if (criterion.weight != null && criterion.weight > 0 && assignmentMaxPoints > 0) {
    return roundTo2((pts * criterion.maxPoints * 100) / (criterion.weight * assignmentMaxPoints));
  }
  if (rubricMaxPoints > 0 && assignmentMaxPoints > 0) {
    return roundTo2((pts * rubricMaxPoints) / assignmentMaxPoints);
  }
  return 0;
}

export function computeRubricMarks(
  criteria: FlatRubricCriterion[],
  criterionScores: string[],
  assignmentMaxPoints: number,
  overridePts?: Array<number | null>,
): number {
  if (criteria.length === 0) {
    return 0;
  }

  const rubricMaxPoints = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);

  if (rubricUsesWeightedPoints(criteria)) {
    let sum = 0;
    for (let index = 0; index < criteria.length; index += 1) {
      const criterion = criteria[index];
      const rowMax = maxPtsForCriterion(
        criterion.maxPoints,
        criterion.weight ?? null,
        assignmentMaxPoints,
        rubricMaxPoints,
      );
      const calculatedPts = calculateCriterionPoints(
        criterionScores[index] ?? "",
        criterion,
        assignmentMaxPoints,
        rubricMaxPoints,
      );
      const rawPts = overridePts?.[index];
      const pts = roundTo2(
        rawPts != null && Number.isFinite(rawPts)
          ? Math.min(rawPts, rowMax)
          : calculatedPts,
      );
      sum += pts;
    }
    return roundTo2(sum);
  }

  const computedMarks = criteria.reduce((sum, criterion, index) => {
    const grade = parseScoreInput(criterionScores[index] ?? "");
    return sum + (criterion.maxPoints > 0 ? Math.min(criterion.maxPoints, grade) : grade);
  }, 0);

  return roundTo2(Math.min(assignmentMaxPoints, computedMarks));
}

export function seedRubricScoreInputs(
  criteria: FlatRubricCriterion[],
  totalMarks: number,
  assignmentMaxPoints: number,
): string[] {
  if (criteria.length === 0 || totalMarks <= 0) {
    return criteria.map(() => "");
  }

  const rubricMaxPoints = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);

  if (rubricUsesWeightedPoints(criteria)) {
    const fraction = assignmentMaxPoints > 0 ? Math.min(1, totalMarks / assignmentMaxPoints) : 0;
    return criteria.map((criterion) => formatMax2Decimals(Math.min(criterion.maxPoints, fraction * criterion.maxPoints)));
  }

  if (rubricMaxPoints <= 0) {
    return criteria.map(() => "");
  }

  const distributed = criteria.map((criterion) =>
    Math.min(criterion.maxPoints, roundTo2((criterion.maxPoints / rubricMaxPoints) * totalMarks)),
  );

  return distributed.map((value) => (value > 0 ? formatMax2Decimals(value) : ""));
}

export function normalizeDecimalInput(raw: string, min: number, max: number): string | null {
  if (raw === "") {
    return "";
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const clamped = Math.min(max, Math.max(min, parsed));
  const inRange = parsed === clamped;
  const rounded = roundTo2(clamped);

  if (inRange && roundTo2(parsed) === parsed) {
    return raw.trim();
  }

  return formatMax2Decimals(rounded);
}
