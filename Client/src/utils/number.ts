/**
 * Round a number to at most 2 decimal places.
 * Use for all decimal values in the app (e.g. 10.3933 → 10.39).
 */
export function roundTo2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/** Format a number to exactly 2 decimal places for display (e.g. "10.39"). */
export function formatTo2Decimals(value: number): string {
  return roundTo2(value).toFixed(2);
}
