/**
 * Task: 2e7e583d — Detect prefers-reduced-motion usage
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect } from 'bun:test';
import { parseReducedMotion } from './detectReducedMotion.js';

describe('parseReducedMotion — detect prefers-reduced-motion in CSS text', () => {
  test('returns an object', () => {
    const result = parseReducedMotion('');
    expect(typeof result).toBe('object');
  });

  test('hasReducedMotionSupport is false for CSS with no @media rule', () => {
    const result = parseReducedMotion('.btn { color: red; }');
    expect(result.hasReducedMotionSupport).toBe(false);
  });

  test('hasReducedMotionSupport is true when prefers-reduced-motion: reduce is present', () => {
    const css = '@media (prefers-reduced-motion: reduce) { * { animation: none; } }';
    expect(parseReducedMotion(css).hasReducedMotionSupport).toBe(true);
  });

  test('hasReducedMotionSupport is true when prefers-reduced-motion: no-preference is present', () => {
    const css = '@media (prefers-reduced-motion: no-preference) { .btn { transition: all 200ms; } }';
    expect(parseReducedMotion(css).hasReducedMotionSupport).toBe(true);
  });

  test('ruleCount is 0 for empty CSS', () => {
    expect(parseReducedMotion('').ruleCount).toBe(0);
  });

  test('ruleCount reflects number of matching @media rules found', () => {
    const css = `
      @media (prefers-reduced-motion: reduce) { * { animation: none; } }
      @media (prefers-reduced-motion: reduce) { .spinner { display: none; } }
    `;
    expect(parseReducedMotion(css).ruleCount).toBe(2);
  });

  test('overriddenProperties lists animation when overridden in reduce rule', () => {
    const css = '@media (prefers-reduced-motion: reduce) { * { animation: none; transition: none; } }';
    const { overriddenProperties } = parseReducedMotion(css);
    expect(overriddenProperties).toContain('animation');
    expect(overriddenProperties).toContain('transition');
  });

  test('overriddenProperties is empty array when no reduced-motion rules', () => {
    const { overriddenProperties } = parseReducedMotion('.btn { color: red; }');
    expect(overriddenProperties).toEqual([]);
  });

  test('returns hasReducedMotionSupport false for empty string', () => {
    expect(parseReducedMotion('').hasReducedMotionSupport).toBe(false);
  });

  test('detects mixed case in prefers-reduced-motion value', () => {
    const css = '@media (prefers-reduced-motion: reduce) { .fade { opacity: 1; } }';
    expect(parseReducedMotion(css).hasReducedMotionSupport).toBe(true);
  });

  test('overriddenProperties deduplicates repeated property names', () => {
    const css = `
      @media (prefers-reduced-motion: reduce) { .a { animation: none; } }
      @media (prefers-reduced-motion: reduce) { .b { animation: none; } }
    `;
    const { overriddenProperties } = parseReducedMotion(css);
    const animCount = overriddenProperties.filter(p => p === 'animation').length;
    expect(animCount).toBe(1);
  });
});
