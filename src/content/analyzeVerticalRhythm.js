/**
 * Vertical rhythm analysis — detects baseline grid patterns
 * from line-height values across type styles.
 */

/**
 * Compute GCD of two numbers (within tolerance for floats).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  a = Math.round(a * 100);
  b = Math.round(b * 100);
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a / 100;
}

/**
 * Convert a line-height value to px given a font-size in px.
 * @param {string} lineHeight — e.g. "1.5", "24px", "normal"
 * @param {number} fontSizePx
 * @returns {number|null}
 */
function lineHeightToPx(lineHeight, fontSizePx) {
  if (!lineHeight || lineHeight === 'normal') return fontSizePx * 1.2;
  const pxMatch = lineHeight.match(/^([\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  const num = parseFloat(lineHeight);
  if (!isNaN(num) && !lineHeight.includes('%') && !lineHeight.includes('rem') && !lineHeight.includes('em')) {
    return num * fontSizePx;
  }
  if (lineHeight.includes('%')) return (num / 100) * fontSizePx;
  if (lineHeight.includes('rem')) return num * 16;
  if (lineHeight.includes('em')) return num * fontSizePx;
  return null;
}

/**
 * Analyze vertical rhythm from type styles.
 *
 * @param {Array<{ fontSize: string, lineHeight: string }>} typeStyles
 * @param {Array<{ px: number }>} typeScale
 * @returns {{
 *   baselineUnit: number|null,
 *   rhythmScore: number,
 *   alignments: Array<{ fontSize: string, lineHeight: string, lineHeightPx: number, multiple: number, aligned: boolean }>,
 * }}
 */
export function analyzeVerticalRhythm(typeStyles = [], typeScale = []) {
  if (!Array.isArray(typeStyles) || typeStyles.length === 0) {
    return { baselineUnit: null, rhythmScore: 0, alignments: [] };
  }

  // Convert all line-heights to px
  const alignments = [];
  const lineHeightPxValues = [];

  for (const style of typeStyles) {
    const fontSizeMatch = (style.fontSize ?? '').match(/^([\d.]+)px$/);
    const fontSizePx = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 16;
    const lhPx = lineHeightToPx(style.lineHeight, fontSizePx);
    if (lhPx === null || lhPx <= 0) continue;

    const roundedLhPx = Math.round(lhPx * 100) / 100;
    lineHeightPxValues.push(roundedLhPx);
    alignments.push({
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      lineHeightPx: roundedLhPx,
      multiple: 0,
      aligned: false,
    });
  }

  if (lineHeightPxValues.length < 2) {
    return { baselineUnit: null, rhythmScore: 0, alignments };
  }

  // Find GCD across all line-height px values → baseline grid unit
  let baselineUnit = lineHeightPxValues[0];
  for (let i = 1; i < lineHeightPxValues.length; i++) {
    baselineUnit = gcd(baselineUnit, lineHeightPxValues[i]);
  }

  // Round to common units (prefer 4px or 8px if very close)
  if (baselineUnit > 0) {
    for (const common of [4, 8]) {
      if (Math.abs(baselineUnit - common) < 1) {
        baselineUnit = common;
        break;
      }
    }
  }

  if (baselineUnit <= 0) {
    return { baselineUnit: null, rhythmScore: 0, alignments };
  }

  // Check alignment of each line-height
  let alignedCount = 0;
  for (const a of alignments) {
    const multiple = a.lineHeightPx / baselineUnit;
    const roundedMultiple = Math.round(multiple);
    a.multiple = roundedMultiple;
    a.aligned = Math.abs(multiple - roundedMultiple) < 0.1;
    if (a.aligned) alignedCount++;
  }

  const rhythmScore = alignments.length > 0
    ? Math.round((alignedCount / alignments.length) * 100) / 100
    : 0;

  return {
    baselineUnit: Math.round(baselineUnit * 100) / 100,
    rhythmScore,
    alignments,
  };
}
