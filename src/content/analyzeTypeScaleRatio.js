/**
 * Type scale ratio analysis — detects mathematical ratios
 * between consecutive font sizes in the type scale.
 */

/** Named typographic ratios */
const KNOWN_RATIOS = [
  { name: 'Minor Second', value: 1.067 },
  { name: 'Major Second', value: 1.125 },
  { name: 'Minor Third', value: 1.200 },
  { name: 'Major Third', value: 1.250 },
  { name: 'Perfect Fourth', value: 1.333 },
  { name: 'Augmented Fourth', value: 1.414 },
  { name: 'Perfect Fifth', value: 1.500 },
  { name: 'Golden Ratio', value: 1.618 },
];

const RATIO_TOLERANCE = 0.03;

/**
 * Analyze the type scale for mathematical ratio patterns.
 *
 * @param {Array<{ step: number, value: string, px: number }>} scale — sorted by px ascending
 * @returns {{
 *   detectedRatio: { name: string, value: number }|null,
 *   fitScore: number,
 *   baseSize: number,
 *   pairRatios: number[],
 * }}
 */
export function analyzeTypeScaleRatio(scale = []) {
  if (!Array.isArray(scale) || scale.length < 2) {
    return { detectedRatio: null, fitScore: 0, baseSize: 16, pairRatios: [] };
  }

  // Compute ratio between each consecutive pair
  const pairRatios = [];
  for (let i = 1; i < scale.length; i++) {
    if (scale[i - 1].px > 0) {
      pairRatios.push(scale[i].px / scale[i - 1].px);
    }
  }

  if (pairRatios.length === 0) {
    return { detectedRatio: null, fitScore: 0, baseSize: 16, pairRatios: [] };
  }

  // Find median ratio
  const sorted = [...pairRatios].sort((a, b) => a - b);
  const medianRatio = sorted[Math.floor(sorted.length / 2)];

  // Match against known ratios
  let detectedRatio = null;
  for (const known of KNOWN_RATIOS) {
    if (Math.abs(medianRatio - known.value) <= RATIO_TOLERANCE) {
      detectedRatio = { name: known.name, value: known.value };
      break;
    }
  }

  // Compute fit score: % of pairs matching within tolerance
  const matchValue = detectedRatio?.value ?? medianRatio;
  const matchingPairs = pairRatios.filter(r => Math.abs(r - matchValue) <= RATIO_TOLERANCE).length;
  const fitScore = pairRatios.length > 0 ? matchingPairs / pairRatios.length : 0;

  // Base size: closest to 16px
  const baseSize = scale.reduce((best, step) =>
    Math.abs(step.px - 16) < Math.abs(best.px - 16) ? step : best
  ).px;

  return {
    detectedRatio,
    fitScore: Math.round(fitScore * 100) / 100,
    baseSize,
    pairRatios: pairRatios.map(r => Math.round(r * 1000) / 1000),
  };
}
