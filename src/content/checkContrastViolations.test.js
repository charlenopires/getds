/**
 * Task: 0074d669 — Flag contrast violations against WCAG AA and AAA thresholds
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { checkContrastViolation, WCAG_THRESHOLDS } from './checkContrastViolations.js';

describe('WCAG_THRESHOLDS — exported threshold constants', () => {
  test('AA normal text is 4.5', () => expect(WCAG_THRESHOLDS.AA.normal).toBe(4.5));
  test('AA large text is 3', () => expect(WCAG_THRESHOLDS.AA.large).toBe(3));
  test('AAA normal text is 7', () => expect(WCAG_THRESHOLDS.AAA.normal).toBe(7));
  test('AAA large text is 4.5', () => expect(WCAG_THRESHOLDS.AAA.large).toBe(4.5));
});

describe('checkContrastViolation — classify a contrast ratio result', () => {
  test('returns object with ratio, isLargeText, passAA, passAAA, severity', () => {
    const result = checkContrastViolation(5.0, false);
    expect(result).toHaveProperty('ratio');
    expect(result).toHaveProperty('isLargeText');
    expect(result).toHaveProperty('passAA');
    expect(result).toHaveProperty('passAAA');
    expect(result).toHaveProperty('severity');
  });

  test('ratio 21 normal text: passAA=true, passAAA=true', () => {
    const r = checkContrastViolation(21, false);
    expect(r.passAA).toBe(true);
    expect(r.passAAA).toBe(true);
  });

  test('ratio 5.0 normal text: passAA=true, passAAA=false', () => {
    const r = checkContrastViolation(5.0, false);
    expect(r.passAA).toBe(true);
    expect(r.passAAA).toBe(false);
  });

  test('ratio 3.0 normal text: passAA=false, passAAA=false', () => {
    const r = checkContrastViolation(3.0, false);
    expect(r.passAA).toBe(false);
    expect(r.passAAA).toBe(false);
  });

  test('ratio 3.5 large text: passAA=true', () => {
    const r = checkContrastViolation(3.5, true);
    expect(r.passAA).toBe(true);
  });

  test('ratio 2.0 large text: passAA=false', () => {
    const r = checkContrastViolation(2.0, true);
    expect(r.passAA).toBe(false);
  });

  test('severity is "pass" when passAA=true', () => {
    expect(checkContrastViolation(5.0, false).severity).toBe('pass');
  });

  test('severity is "major" when passAA=false (normal text)', () => {
    expect(checkContrastViolation(3.0, false).severity).toBe('major');
  });

  test('severity is "critical" when ratio < 3:1 (unusable)', () => {
    expect(checkContrastViolation(1.5, false).severity).toBe('critical');
  });

  test('isLargeText is preserved in result', () => {
    expect(checkContrastViolation(4.0, true).isLargeText).toBe(true);
    expect(checkContrastViolation(4.0, false).isLargeText).toBe(false);
  });

  test('ratio is preserved in result', () => {
    expect(checkContrastViolation(6.5, false).ratio).toBe(6.5);
  });
});
