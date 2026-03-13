/**
 * Heading hierarchy audit — Spec: 10ab6f26 — Accessibility Audit
 *
 * Validates that heading levels (h1–h6) do not skip levels when going deeper.
 * Going back to a higher-level heading (e.g. h3→h2) is always valid.
 */

/**
 * @typedef {{ skippedFrom: number, skippedTo: number, index: number }} HeadingIssue
 */

/**
 * Validate a sequence of heading levels for skipped levels.
 *
 * A skip occurs when a heading increases by more than 1 level
 * (e.g. h1→h3 skips h2). Decreasing or staying the same is always valid.
 *
 * @param {number[]} levels  Array of heading levels (1–6) in DOM order
 * @returns {HeadingIssue[]}
 */
export function validateHeadingHierarchy(levels) {
  const issues = [];

  for (let i = 1; i < levels.length; i++) {
    const prev = levels[i - 1];
    const curr = levels[i];
    if (curr > prev + 1) {
      issues.push({ skippedFrom: prev, skippedTo: curr, index: i });
    }
  }

  return issues;
}
