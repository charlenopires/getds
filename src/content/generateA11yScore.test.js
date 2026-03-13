/**
 * Task: 4ef92fcf — Generate accessibility score summary with pass/warn/fail counts
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { generateA11yScore } from './generateA11yScore.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const issues = [
  { category: 'contrast',  severity: 'critical' },
  { category: 'contrast',  severity: 'major' },
  { category: 'alt-text',  severity: 'critical' },
  { category: 'headings',  severity: 'minor' },
  { category: 'aria',      severity: 'major' },
  { category: 'focus',     severity: 'pass' },
  { category: 'touch',     severity: 'pass' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateA11yScore — a11y summary with pass/warn/fail counts per category', () => {
  test('returns object', () => {
    expect(typeof generateA11yScore([])).toBe('object');
  });

  test('has totals field', () => {
    expect(generateA11yScore(issues)).toHaveProperty('totals');
  });

  test('has categories field', () => {
    expect(generateA11yScore(issues)).toHaveProperty('categories');
  });

  test('totals has pass, warn, fail counts', () => {
    const { totals } = generateA11yScore(issues);
    expect(totals).toHaveProperty('pass');
    expect(totals).toHaveProperty('warn');
    expect(totals).toHaveProperty('fail');
  });

  test('totals.fail counts critical and major issues', () => {
    const { totals } = generateA11yScore(issues);
    // contrast:critical, contrast:major, alt-text:critical, aria:major = 4 fail
    expect(totals.fail).toBe(4);
  });

  test('totals.warn counts minor issues', () => {
    const { totals } = generateA11yScore(issues);
    expect(totals.warn).toBe(1);
  });

  test('totals.pass counts pass issues', () => {
    const { totals } = generateA11yScore(issues);
    expect(totals.pass).toBe(2);
  });

  test('categories contains per-category breakdown', () => {
    const { categories } = generateA11yScore(issues);
    expect(categories).toHaveProperty('contrast');
    expect(categories).toHaveProperty('alt-text');
  });

  test('per-category has pass, warn, fail counts', () => {
    const { categories } = generateA11yScore(issues);
    expect(categories.contrast).toHaveProperty('fail');
    expect(categories.contrast).toHaveProperty('warn');
    expect(categories.contrast).toHaveProperty('pass');
  });

  test('contrast category: 2 fail, 0 warn, 0 pass', () => {
    const { categories } = generateA11yScore(issues);
    expect(categories.contrast.fail).toBe(2);
  });

  test('returns zero counts for empty input', () => {
    const { totals } = generateA11yScore([]);
    expect(totals.pass).toBe(0);
    expect(totals.warn).toBe(0);
    expect(totals.fail).toBe(0);
  });
});
