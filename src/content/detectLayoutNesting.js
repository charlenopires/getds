/**
 * Layout nesting detection — Layout Analysis
 * Detects nesting depth of layout containers (grid/flex).
 */

const LAYOUT_DISPLAYS = new Set(['flex', 'inline-flex', 'grid', 'inline-grid']);

/**
 * Detect layout nesting depth from computed styles and elements.
 * @param {Array<{ element: Element, computedStyle: CSSStyleDeclaration }>} elementStyles
 * @returns {{ maxDepth: number, nestingPatterns: Array<{ path: string, depth: number, count: number }> }}
 */
export function detectLayoutNestingDepth(elementStyles) {
  const nestingMap = new Map();
  let maxDepth = 0;

  for (const { element, computedStyle } of elementStyles) {
    const display = computedStyle.getPropertyValue('display') ?? '';
    if (!LAYOUT_DISPLAYS.has(display)) continue;

    let depth = 0;
    const pathParts = [display];
    let parent = element.parentElement;
    while (parent) {
      try {
        const parentDisplay = getComputedStyle(parent).getPropertyValue('display') ?? '';
        if (LAYOUT_DISPLAYS.has(parentDisplay)) {
          depth++;
          pathParts.unshift(parentDisplay);
        }
      } catch { break; }
      parent = parent.parentElement;
    }

    if (depth > maxDepth) maxDepth = depth;

    if (depth > 0) {
      const path = pathParts.join(' > ');
      nestingMap.set(path, (nestingMap.get(path) ?? 0) + 1);
    }
  }

  const nestingPatterns = Array.from(nestingMap.entries())
    .map(([path, count]) => ({ path, depth: path.split(' > ').length - 1, count }))
    .sort((a, b) => b.depth - a.depth)
    .slice(0, 10);

  return { maxDepth, nestingPatterns };
}
