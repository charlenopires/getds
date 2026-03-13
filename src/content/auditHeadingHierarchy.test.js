/**
 * Task: 316d8f83 — Validate heading hierarchy (h1-h6) for proper nesting
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { validateHeadingHierarchy } from './auditHeadingHierarchy.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('validateHeadingHierarchy — detect skipped heading levels', () => {
  test('returns array', () => {
    expect(Array.isArray(validateHeadingHierarchy([]))).toBe(true);
  });

  test('returns empty for correct h1→h2→h3 sequence', () => {
    expect(validateHeadingHierarchy([1, 2, 3])).toHaveLength(0);
  });

  test('returns empty for single h1', () => {
    expect(validateHeadingHierarchy([1])).toHaveLength(0);
  });

  test('returns empty for h1→h2→h2 (same level repeated)', () => {
    expect(validateHeadingHierarchy([1, 2, 2])).toHaveLength(0);
  });

  test('flags h1→h3 (skips h2)', () => {
    const issues = validateHeadingHierarchy([1, 3]);
    expect(issues).toHaveLength(1);
  });

  test('issue has skippedFrom, skippedTo, and index fields', () => {
    const [issue] = validateHeadingHierarchy([1, 3]);
    expect(issue).toHaveProperty('skippedFrom');
    expect(issue).toHaveProperty('skippedTo');
    expect(issue).toHaveProperty('index');
  });

  test('skippedFrom=1, skippedTo=3 for h1→h3', () => {
    const [issue] = validateHeadingHierarchy([1, 3]);
    expect(issue.skippedFrom).toBe(1);
    expect(issue.skippedTo).toBe(3);
  });

  test('flags h2→h4 (skips h3)', () => {
    const issues = validateHeadingHierarchy([1, 2, 4]);
    expect(issues.some(i => i.skippedFrom === 2 && i.skippedTo === 4)).toBe(true);
  });

  test('flags multiple skips in one sequence', () => {
    // h1 → h3 → h5: two skips
    const issues = validateHeadingHierarchy([1, 3, 5]);
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  test('allows going back to a lower level (h3→h2 is valid)', () => {
    expect(validateHeadingHierarchy([1, 2, 3, 2])).toHaveLength(0);
  });

  test('returns empty for h1→h2→h3→h4→h5→h6', () => {
    expect(validateHeadingHierarchy([1, 2, 3, 4, 5, 6])).toHaveLength(0);
  });

  test('index in issue reflects position in input array', () => {
    const [issue] = validateHeadingHierarchy([1, 2, 4]);
    expect(issue.index).toBe(2); // h4 is at index 2
  });
});
