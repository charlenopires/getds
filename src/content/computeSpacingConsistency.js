/**
 * Spacing consistency scoring — Layout Analysis
 * Measures how well spacing values adhere to a consistent scale.
 */

/**
 * Compute a consistency score for spacing values against a base unit.
 * @param {number[]} spacingValues - Array of spacing values in px
 * @param {number} baseUnit - The detected base unit in px
 * @returns {{ score: number, onScale: number, offScale: number, total: number, grade: 'excellent'|'good'|'fair'|'poor' }}
 */
export function computeSpacingConsistencyScore(spacingValues, baseUnit) {
  if (!spacingValues || spacingValues.length === 0 || !baseUnit || baseUnit <= 0) {
    return { score: 0, onScale: 0, offScale: 0, total: 0, grade: 'poor' };
  }

  let onScale = 0;
  let offScale = 0;

  for (const val of spacingValues) {
    const ratio = val / baseUnit;
    const rounded = Math.round(ratio);
    // Allow 1px tolerance for rounding
    if (Math.abs(val - rounded * baseUnit) <= 1) {
      onScale++;
    } else {
      offScale++;
    }
  }

  const total = spacingValues.length;
  const score = total > 0 ? Math.round((onScale / total) * 100) / 100 : 0;

  let grade;
  if (score >= 0.9) grade = 'excellent';
  else if (score >= 0.75) grade = 'good';
  else if (score >= 0.5) grade = 'fair';
  else grade = 'poor';

  return { score, onScale, offScale, total, grade };
}
