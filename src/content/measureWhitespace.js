/**
 * Whitespace measurement — Layout Analysis
 * Measures gaps between sibling elements in landmark containers.
 */

const LANDMARK_SELECTORS = [
  'main', 'header', 'nav', 'aside', 'footer',
  '[role="main"]', '[role="banner"]', '[role="navigation"]',
  '[role="complementary"]', '[role="contentinfo"]',
];

/**
 * Measure vertical gaps between direct children of landmark elements.
 * @returns {{ gaps: Array<{ landmark: string, gaps: number[] }> }}
 */
export function measureLayoutWhitespace() {
  const results = [];

  for (const selector of LANDMARK_SELECTORS) {
    let elements;
    try { elements = document.querySelectorAll(selector); } catch { continue; }

    for (const container of elements) {
      const children = Array.from(container.children);
      if (children.length < 2) continue;

      const gaps = [];
      for (let i = 1; i < children.length; i++) {
        try {
          const prevRect = children[i - 1].getBoundingClientRect();
          const currRect = children[i].getBoundingClientRect();
          const gap = Math.round(currRect.top - prevRect.bottom);
          if (gap >= 0) gaps.push(gap);
        } catch { continue; }
      }

      if (gaps.length > 0) {
        results.push({ landmark: container.tagName?.toLowerCase() ?? selector, gaps });
      }
    }
  }

  return { gaps: results };
}
