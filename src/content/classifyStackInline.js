/**
 * Stack/Inline spacing classification — Layout Analysis
 * Classifies flex containers as stack (column), inline (row), or wrap-grid patterns.
 */

/**
 * Classify the spacing intent of a flex descriptor.
 * @param {{ flexDirection: string, flexWrap: string, gap: string }} descriptor
 * @returns {{ intent: 'stack'|'inline'|'wrap-grid', gap: string }}
 */
export function classifySpacingIntent(descriptor) {
  const { flexDirection, flexWrap, gap } = descriptor;
  const isWrapping = flexWrap === 'wrap' || flexWrap === 'wrap-reverse';

  if (isWrapping) return { intent: 'wrap-grid', gap: gap || '0px' };
  if (flexDirection === 'column' || flexDirection === 'column-reverse') {
    return { intent: 'stack', gap: gap || '0px' };
  }
  return { intent: 'inline', gap: gap || '0px' };
}

/**
 * Extract stack, inline, and wrap-grid patterns from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ stacks: Array<{ gap: string, count: number }>, inlines: Array<{ gap: string, count: number }>, wrapGrids: Array<{ gap: string, count: number }> }}
 */
export function extractStackInlinePatterns(computedStyles) {
  const stackMap = new Map();
  const inlineMap = new Map();
  const wrapGridMap = new Map();

  for (const cs of computedStyles) {
    const display = cs.display ?? cs.getPropertyValue('display');
    if (display !== 'flex' && display !== 'inline-flex') continue;

    const flexDirection = cs.getPropertyValue('flex-direction') ?? 'row';
    const flexWrap = cs.getPropertyValue('flex-wrap') ?? 'nowrap';
    const gap = cs.getPropertyValue('gap') ?? '0px';

    const { intent } = classifySpacingIntent({ flexDirection, flexWrap, gap });

    const targetMap = intent === 'stack' ? stackMap : intent === 'inline' ? inlineMap : wrapGridMap;
    targetMap.set(gap, (targetMap.get(gap) ?? 0) + 1);
  }

  const toArray = (map) => Array.from(map.entries()).map(([gap, count]) => ({ gap, count }));

  return {
    stacks: toArray(stackMap),
    inlines: toArray(inlineMap),
    wrapGrids: toArray(wrapGridMap),
  };
}
