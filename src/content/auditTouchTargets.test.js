/**
 * Task: c43ab1f7 — Check touch target sizes against 44x44px minimum
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { checkTouchTarget, TOUCH_TARGET_MIN } from './auditTouchTargets.js';

describe('TOUCH_TARGET_MIN — minimum touch target constant', () => {
  test('minimum is 44', () => expect(TOUCH_TARGET_MIN).toBe(44));
});

describe('checkTouchTarget — classify touch target size', () => {
  test('returns object with width, height, passes, severity', () => {
    const result = checkTouchTarget(44, 44);
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
    expect(result).toHaveProperty('passes');
    expect(result).toHaveProperty('severity');
  });

  test('44x44 passes', () => {
    expect(checkTouchTarget(44, 44).passes).toBe(true);
  });

  test('48x48 passes', () => {
    expect(checkTouchTarget(48, 48).passes).toBe(true);
  });

  test('43x44 fails (width too small)', () => {
    expect(checkTouchTarget(43, 44).passes).toBe(false);
  });

  test('44x43 fails (height too small)', () => {
    expect(checkTouchTarget(44, 43).passes).toBe(false);
  });

  test('24x24 fails', () => {
    expect(checkTouchTarget(24, 24).passes).toBe(false);
  });

  test('severity is "pass" when passes', () => {
    expect(checkTouchTarget(44, 44).severity).toBe('pass');
  });

  test('severity is "minor" when slightly below (>= 32px both dimensions)', () => {
    expect(checkTouchTarget(36, 36).severity).toBe('minor');
  });

  test('severity is "major" when significantly below (< 32px either dimension)', () => {
    expect(checkTouchTarget(20, 20).severity).toBe('major');
  });

  test('width and height preserved in result', () => {
    const r = checkTouchTarget(30, 40);
    expect(r.width).toBe(30);
    expect(r.height).toBe(40);
  });
});
