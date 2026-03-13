/**
 * Spacing grid detection — Spec: 29ea3708 — Spacing System Extraction
 *
 * Detects whether the spacing values follow a 4px or 8px grid system.
 */

import { inferBaseUnit } from './inferSpacingBase.js';

const THRESHOLD = 0.75; // minimum adherence to classify as a known grid

/**
 * Detect the spacing grid system in use.
 *
 * Algorithm:
 *   1. Filter null px values
 *   2. Compute adherence to 8px grid (multiples of 8)
 *   3. Compute adherence to 4px grid (multiples of 4)
 *   4. Prefer 8px if its adherence meets threshold (8 is stricter than 4)
 *   5. Fall back to 4px, then 'custom', then 'none'
 *
 * @param {Array<{ px: number | null }>} values
 * @returns {{ grid: '4px'|'8px'|'custom'|'none', baseUnit: number|null, adherence: number }}
 */
export function detectSpacingGrid(values) {
  const pxValues = values
    .map(v => v.px)
    .filter(v => v !== null && v > 0)
    .map(v => Math.round(v));

  if (pxValues.length === 0) {
    return { grid: 'none', baseUnit: null, adherence: 0 };
  }

  const adherenceTo = (n) =>
    pxValues.filter(v => v % n === 0).length / pxValues.length;

  const adherence8 = adherenceTo(8);
  const adherence4 = adherenceTo(4);

  if (adherence8 >= THRESHOLD) {
    return { grid: '8px', baseUnit: 8, adherence: Math.round(adherence8 * 1000) / 1000 };
  }

  if (adherence4 >= THRESHOLD) {
    return { grid: '4px', baseUnit: 4, adherence: Math.round(adherence4 * 1000) / 1000 };
  }

  const { baseUnit, confidence } = inferBaseUnit(values);
  return { grid: 'custom', baseUnit, adherence: confidence };
}
