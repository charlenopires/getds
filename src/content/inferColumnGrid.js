/**
 * Column grid inference — Layout Analysis
 * Infers whether the page uses a standard column grid system (12-col, 16-col, etc.).
 */

/**
 * Infer the column grid system from grid descriptors.
 * @param {Array<{ columnCount: number }>} gridDescriptors
 * @returns {{ detectedSystem: '12-column'|'16-column'|'custom'|'none', dominantColumnCount: number, confidence: number }}
 */
export function inferColumnGridSystem(gridDescriptors) {
  const counts = gridDescriptors.map((d) => d.columnCount).filter((n) => n > 0);
  if (counts.length === 0) {
    return { detectedSystem: 'none', dominantColumnCount: 0, confidence: 0 };
  }

  // Count frequency of each column count
  const freq = new Map();
  for (const c of counts) freq.set(c, (freq.get(c) ?? 0) + 1);
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const dominantFreq = sorted[0][1];

  // Check if most grids are divisors of 12 or 16
  const divisorsOf12 = new Set([1, 2, 3, 4, 6, 12]);
  const divisorsOf16 = new Set([1, 2, 4, 8, 16]);

  const is12 = counts.filter((c) => divisorsOf12.has(c)).length;
  const is16 = counts.filter((c) => divisorsOf16.has(c)).length;

  const total = counts.length;
  const ratio12 = is12 / total;
  const ratio16 = is16 / total;

  if (dominant === 12 || (ratio12 >= 0.6 && ratio12 > ratio16)) {
    return { detectedSystem: '12-column', dominantColumnCount: dominant, confidence: Math.round(ratio12 * 100) / 100 };
  }
  if (dominant === 16 || (ratio16 >= 0.6 && ratio16 > ratio12)) {
    return { detectedSystem: '16-column', dominantColumnCount: dominant, confidence: Math.round(ratio16 * 100) / 100 };
  }

  return { detectedSystem: 'custom', dominantColumnCount: dominant, confidence: dominantFreq / total };
}

/**
 * Detect if the grid is a modular grid (both rows and columns defined).
 * @param {Array<{ columnCount: number, templateRows: string }>} gridDescriptors
 * @returns {{ isModular: boolean, rowCount: number, columnCount: number }}
 */
export function detectModularGrid(gridDescriptors) {
  for (const g of gridDescriptors) {
    if (g.columnCount > 1 && g.templateRows && g.templateRows !== 'none') {
      const rowTokens = g.templateRows.trim().split(/\s+/);
      const rowCount = rowTokens.length;
      if (rowCount > 1) {
        return { isModular: true, rowCount, columnCount: g.columnCount };
      }
    }
  }
  return { isModular: false, rowCount: 0, columnCount: 0 };
}

/**
 * Classify grid template patterns from grid descriptors.
 * @param {Array<{ templateColumns?: string }>} gridDescriptors
 * @returns {{ gridClassifications: Array<{ templateColumns: string, classification: string, trackValues: string[], isSymmetric: boolean }>, dominantPattern: string|null }}
 */
export function classifyGridTemplates(gridDescriptors) {
  if (!Array.isArray(gridDescriptors) || gridDescriptors.length === 0) {
    return { gridClassifications: [], dominantPattern: null };
  }

  const seen = new Set();
  const classifications = [];
  const patternCounts = {};

  for (const g of gridDescriptors) {
    const template = g.templateColumns;
    if (!template || template === 'none' || seen.has(template)) continue;
    seen.add(template);

    const trackValues = template.trim().split(/\s+/);
    let classification;

    // Check for auto-fill/auto-fit (responsive)
    if (/repeat\s*\(\s*auto-(fill|fit)/i.test(template)) {
      classification = 'auto-responsive';
    } else if (trackValues.length > 0 && trackValues.every(t => t === trackValues[0])) {
      // All tracks identical → equal
      classification = 'equal';
    } else if (isSymmetricPattern(trackValues)) {
      // Mirror pattern → editorial
      classification = 'editorial';
    } else {
      classification = 'asymmetric';
    }

    const isSymmetric = isSymmetricPattern(trackValues);
    classifications.push({ templateColumns: template, classification, trackValues, isSymmetric });
    patternCounts[classification] = (patternCounts[classification] ?? 0) + 1;
  }

  // Dominant pattern by frequency
  let dominantPattern = null;
  let maxCount = 0;
  for (const [pattern, count] of Object.entries(patternCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantPattern = pattern;
    }
  }

  return { gridClassifications: classifications, dominantPattern };
}

function isSymmetricPattern(tracks) {
  if (tracks.length < 2) return true;
  const len = tracks.length;
  for (let i = 0; i < Math.floor(len / 2); i++) {
    if (tracks[i] !== tracks[len - 1 - i]) return false;
  }
  return true;
}
