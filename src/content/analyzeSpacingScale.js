/**
 * Spacing mathematical analysis — detects arithmetic, geometric,
 * fibonacci, or custom spacing patterns from extracted pixel values.
 */

/** Named typographic/spacing ratios (reused from analyzeTypeScaleRatio.js concept) */
const KNOWN_RATIOS = [
  { name: 'Minor Second', value: 1.067 },
  { name: 'Major Second', value: 1.125 },
  { name: 'Minor Third', value: 1.200 },
  { name: 'Major Third', value: 1.250 },
  { name: 'Perfect Fourth', value: 1.333 },
  { name: 'Augmented Fourth', value: 1.414 },
  { name: 'Perfect Fifth', value: 1.500 },
  { name: 'Golden Ratio', value: 1.618 },
  { name: 'Double', value: 2.000 },
];

const RATIO_TOLERANCE = 0.05;

/**
 * Analyze spacing pixel values for mathematical scale patterns.
 *
 * @param {number[]} spacingPxValues — sorted unique positive pixel values
 * @returns {{
 *   scaleType: 'arithmetic'|'geometric'|'fibonacci'|'custom',
 *   formula: string|null,
 *   baseValue: number,
 *   increment: number|null,
 *   ratio: number|null,
 *   ratioName: string|null,
 *   fitScore: number,
 *   deviations: Array<{ value: number, expected: number, delta: number }>,
 * }}
 */
export function analyzeSpacingScale(spacingPxValues = []) {
  // Deduplicate and sort
  const values = [...new Set(spacingPxValues)].filter(v => v > 0).sort((a, b) => a - b);

  if (values.length < 3) {
    return {
      scaleType: 'custom',
      formula: null,
      baseValue: values[0] ?? 0,
      increment: null,
      ratio: null,
      ratioName: null,
      fitScore: 0,
      deviations: [],
    };
  }

  const base = values[0];

  // 1. Test arithmetic (constant increment)
  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(values[i] - values[i - 1]);
  }
  const medianDiff = sortedMedian(diffs);
  const arithmeticMatches = diffs.filter(d => Math.abs(d - medianDiff) <= Math.max(1, medianDiff * 0.15)).length;
  const arithmeticFit = arithmeticMatches / diffs.length;

  // 2. Test geometric (constant ratio)
  const ratios = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      ratios.push(values[i] / values[i - 1]);
    }
  }
  const medianRatio = sortedMedian(ratios);
  const geometricMatches = ratios.filter(r => Math.abs(r - medianRatio) <= RATIO_TOLERANCE).length;
  const geometricFit = ratios.length > 0 ? geometricMatches / ratios.length : 0;

  // 3. Test fibonacci pattern
  const fibFit = testFibonacci(values);

  // Determine best fit
  const candidates = [
    { type: 'arithmetic', fit: arithmeticFit },
    { type: 'geometric', fit: geometricFit },
    { type: 'fibonacci', fit: fibFit },
  ].sort((a, b) => b.fit - a.fit);

  const best = candidates[0];

  if (best.fit < 0.4) {
    return {
      scaleType: 'custom',
      formula: null,
      baseValue: base,
      increment: null,
      ratio: null,
      ratioName: null,
      fitScore: Math.round(best.fit * 100) / 100,
      deviations: [],
    };
  }

  if (best.type === 'arithmetic') {
    const increment = Math.round(medianDiff * 10) / 10;
    const deviations = computeDeviations(values, i => base + increment * i);
    return {
      scaleType: 'arithmetic',
      formula: `${base} + ${increment}n`,
      baseValue: base,
      increment,
      ratio: null,
      ratioName: null,
      fitScore: Math.round(arithmeticFit * 100) / 100,
      deviations,
    };
  }

  if (best.type === 'geometric') {
    const ratio = Math.round(medianRatio * 1000) / 1000;
    const ratioName = matchKnownRatio(ratio);
    const deviations = computeDeviations(values, i => base * Math.pow(ratio, i));
    return {
      scaleType: 'geometric',
      formula: `${base} * ${ratio}^n`,
      baseValue: base,
      increment: null,
      ratio,
      ratioName,
      fitScore: Math.round(geometricFit * 100) / 100,
      deviations,
    };
  }

  // fibonacci
  const deviations = computeFibDeviations(values);
  return {
    scaleType: 'fibonacci',
    formula: `fibonacci(n) * ${base}`,
    baseValue: base,
    increment: null,
    ratio: null,
    ratioName: null,
    fitScore: Math.round(fibFit * 100) / 100,
    deviations,
  };
}

function sortedMedian(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function matchKnownRatio(ratio) {
  for (const known of KNOWN_RATIOS) {
    if (Math.abs(ratio - known.value) <= RATIO_TOLERANCE) {
      return known.name;
    }
  }
  return null;
}

function computeDeviations(values, expectedFn) {
  return values.map((v, i) => {
    const expected = Math.round(expectedFn(i) * 10) / 10;
    const delta = Math.round(Math.abs(v - expected) * 10) / 10;
    return { value: v, expected, delta };
  }).filter(d => d.delta > 0.5);
}

function testFibonacci(values) {
  if (values.length < 4) return 0;
  const base = values[0];
  // Generate fibonacci sequence scaled to base
  const fib = [1, 1];
  for (let i = 2; i < values.length + 5; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  const fibScaled = fib.map(f => f * base);

  // Check how many values match a fibonacci number (within 15%)
  let matches = 0;
  for (const v of values) {
    const closest = fibScaled.reduce((best, f) =>
      Math.abs(f - v) < Math.abs(best - v) ? f : best
    );
    if (Math.abs(closest - v) <= Math.max(1, v * 0.15)) {
      matches++;
    }
  }
  return matches / values.length;
}

function computeFibDeviations(values) {
  if (values.length === 0) return [];
  const base = values[0];
  const fib = [1, 1];
  for (let i = 2; i < values.length + 5; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  const fibScaled = fib.map(f => f * base);

  return values.map(v => {
    const closest = fibScaled.reduce((best, f) =>
      Math.abs(f - v) < Math.abs(best - v) ? f : best
    );
    const delta = Math.round(Math.abs(v - closest) * 10) / 10;
    return { value: v, expected: closest, delta };
  }).filter(d => d.delta > 0.5);
}
