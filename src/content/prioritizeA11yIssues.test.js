/**
 * Task: 15b43c4f — Output prioritized list of accessibility issues sorted by severity
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { prioritizeA11yIssues, SEVERITY_ORDER } from './prioritizeA11yIssues.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const issues = [
  { category: 'headings',  severity: 'minor',    message: 'Skipped heading level' },
  { category: 'contrast',  severity: 'critical', message: 'Contrast too low' },
  { category: 'aria',      severity: 'major',    message: 'aria-hidden on focusable' },
  { category: 'alt-text',  severity: 'critical', message: 'Missing alt text' },
  { category: 'touch',     severity: 'pass',     message: 'Touch target ok' },
  { category: 'focus',     severity: 'major',    message: 'No focus indicator' },
  { category: 'contrast',  severity: 'minor',    message: 'Slightly low contrast' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SEVERITY_ORDER — severity priority map', () => {
  test('is an object', () => {
    expect(typeof SEVERITY_ORDER).toBe('object');
  });

  test('critical has lower index (higher priority) than major', () => {
    expect(SEVERITY_ORDER.critical).toBeLessThan(SEVERITY_ORDER.major);
  });

  test('major has lower index than minor', () => {
    expect(SEVERITY_ORDER.major).toBeLessThan(SEVERITY_ORDER.minor);
  });

  test('minor has lower index than pass', () => {
    expect(SEVERITY_ORDER.minor).toBeLessThan(SEVERITY_ORDER.pass);
  });
});

describe('prioritizeA11yIssues — sort issues by severity', () => {
  test('returns an array', () => {
    expect(Array.isArray(prioritizeA11yIssues([]))).toBe(true);
  });

  test('empty input returns empty array', () => {
    expect(prioritizeA11yIssues([])).toEqual([]);
  });

  test('first item has critical severity', () => {
    const result = prioritizeA11yIssues(issues);
    expect(result[0].severity).toBe('critical');
  });

  test('last item has pass severity', () => {
    const result = prioritizeA11yIssues(issues);
    expect(result[result.length - 1].severity).toBe('pass');
  });

  test('all critical items come before major', () => {
    const result = prioritizeA11yIssues(issues);
    const lastCritical = result.map(i => i.severity).lastIndexOf('critical');
    const firstMajor = result.map(i => i.severity).indexOf('major');
    expect(lastCritical).toBeLessThan(firstMajor);
  });

  test('all major items come before minor', () => {
    const result = prioritizeA11yIssues(issues);
    const lastMajor = result.map(i => i.severity).lastIndexOf('major');
    const firstMinor = result.map(i => i.severity).indexOf('minor');
    expect(lastMajor).toBeLessThan(firstMinor);
  });

  test('all minor items come before pass', () => {
    const result = prioritizeA11yIssues(issues);
    const lastMinor = result.map(i => i.severity).lastIndexOf('minor');
    const firstPass = result.map(i => i.severity).indexOf('pass');
    expect(lastMinor).toBeLessThan(firstPass);
  });

  test('does not mutate the original array', () => {
    const input = [...issues];
    prioritizeA11yIssues(input);
    expect(input[0].severity).toBe('minor'); // original order preserved
  });

  test('preserves all items (no filtering)', () => {
    expect(prioritizeA11yIssues(issues).length).toBe(issues.length);
  });

  test('single item returned as-is', () => {
    const single = [{ category: 'alt-text', severity: 'critical', message: 'Missing alt' }];
    expect(prioritizeA11yIssues(single)).toEqual(single);
  });

  test('items with same severity preserve original relative order (stable sort)', () => {
    const result = prioritizeA11yIssues(issues);
    const criticals = result.filter(i => i.severity === 'critical');
    expect(criticals[0].category).toBe('contrast');
    expect(criticals[1].category).toBe('alt-text');
  });
});
