/**
 * Layout token generation — W3C DTCG tokens for layout classification
 *
 * Generates tokens for layout type, column system, spacing consistency,
 * and inset patterns.
 */

/**
 * Generate DTCG-compliant layout tokens.
 *
 * @param {{
 *   layoutType?: { layoutType: string, confidence: number },
 *   columnSystem?: { detectedSystem: string, dominantColumnCount: number, confidence: number },
 *   spacingConsistency?: { score: number, grade: string },
 *   insets?: Array<{ type: string, values: { top: number, right: number, bottom: number, left: number }, count: number }>
 * }} input
 * @returns {Record<string, object>}
 */
export function generateLayoutTokens({
  layoutType,
  columnSystem,
  spacingConsistency,
  insets = [],
} = {}) {
  const tokens = {};

  if (layoutType) {
    tokens['layout-type'] = {
      $value: layoutType.layoutType,
      $type: 'string',
      $description: `Page layout classification (${Math.round(layoutType.confidence * 100)}% confidence)`,
    };
  }

  if (columnSystem && columnSystem.detectedSystem !== 'none') {
    tokens['column-system'] = {
      $value: columnSystem.detectedSystem,
      $type: 'string',
      $description: `Dominant ${columnSystem.dominantColumnCount}-column grid`,
    };
  }

  if (spacingConsistency) {
    tokens['spacing-consistency'] = {
      $value: spacingConsistency.grade,
      $type: 'string',
      $description: `Spacing consistency score: ${spacingConsistency.score}`,
    };
  }

  // Inset tokens — top patterns by count
  const sorted = [...insets].sort((a, b) => b.count - a.count);
  let idx = 0;
  for (const inset of sorted.slice(0, 5)) {
    idx++;
    const { top, right, bottom, left } = inset.values;
    tokens[`inset-${inset.type}-${idx}`] = {
      $value: `${top}px ${right}px ${bottom}px ${left}px`,
      $type: 'dimension',
      $description: `${inset.type} inset (used ${inset.count}×)`,
    };
  }

  return tokens;
}
