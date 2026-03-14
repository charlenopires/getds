/**
 * Semantic spacing name assignment — Layout Analysis
 * Maps spacing scale steps to semantic t-shirt size names.
 */

const SEMANTIC_NAMES = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

/**
 * Assign semantic names to a spacing scale.
 * Centers the scale on 'md' for the median value.
 * @param {Array<{ step: number, px: number, value: string }>} scale
 * @returns {Array<{ step: number, px: number, value: string, semanticName: string }>}
 */
export function assignSemanticNames(scale) {
  if (!scale || scale.length === 0) return [];

  const sorted = [...scale].sort((a, b) => a.px - b.px);
  const midIndex = Math.floor(sorted.length / 2);

  return sorted.map((entry, i) => {
    // Center on md
    const offset = i - midIndex;
    const nameIndex = Math.floor(SEMANTIC_NAMES.length / 2) + offset;
    const clampedIndex = Math.max(0, Math.min(SEMANTIC_NAMES.length - 1, nameIndex));
    const semanticName = SEMANTIC_NAMES[clampedIndex];

    return { ...entry, semanticName };
  });
}
