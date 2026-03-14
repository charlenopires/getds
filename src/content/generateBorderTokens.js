// -- Border Token Generation (W3C DTCG) ---------------------------------------
// Inspired by dembrandt w3c-exporter.js:exportBorders.

import { normalizeColor } from './normalizeColor.js';

/**
 * Generate W3C DTCG border tokens from extractBorders() output.
 *
 * @param {Array<{width: string, style: string, color: string, count?: number}>} borders
 * @returns {Record<string, {$type: string, $value: object}>}
 */
export function generateBorderTokens(borders) {
  if (!borders || borders.length === 0) return {};

  const tokens = {};
  const widthSet = new Set();

  borders.forEach((b, i) => {
    const norm = normalizeColor(b.color);
    const hex = norm?.hex ?? b.color;

    tokens[`border-${i + 1}`] = {
      $type: 'border',
      $value: {
        color: hex,
        width: b.width,
        style: b.style,
      },
      $extensions: {
        'com.getds.usageCount': b.count ?? 1,
      },
    };

    widthSet.add(b.width);
  });

  // Generate individual borderWidth tokens for unique widths
  let idx = 1;
  for (const w of [...widthSet].sort((a, b) => parseFloat(a) - parseFloat(b))) {
    tokens[`borderWidth-${idx}`] = {
      $type: 'dimension',
      $value: w,
    };
    idx++;
  }

  return tokens;
}
