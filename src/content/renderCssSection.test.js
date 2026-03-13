/**
 * Task: 7d2e73b0 — Output CSS snippets as fenced CSS code blocks for keyframes, computed styles, and media queries
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import {
  renderCssBlock,
  keyframesToCss,
  animationsToCss,
  renderAnimationsSection,
} from './renderCssSection.js';

const keyframes = [
  {
    name: 'fadeIn',
    stops: [
      { key: 'from', styles: { opacity: '0' } },
      { key: 'to',   styles: { opacity: '1' } },
    ],
  },
  {
    name: 'slideUp',
    stops: [
      { key: '0%',   styles: { transform: 'translateY(10px)' } },
      { key: '100%', styles: { transform: 'translateY(0)' } },
    ],
  },
];

const cssAnimations = [
  { name: 'fadeIn',  duration: '300ms', timingFunction: 'ease',        delay: '0s', iterationCount: '1', direction: 'normal',  fillMode: 'none' },
  { name: 'slideUp', duration: '200ms', timingFunction: 'ease-out',    delay: '0s', iterationCount: '1', direction: 'normal',  fillMode: 'forwards' },
];

const animationsPayload = {
  keyframes,
  cssAnimations,
  transitions: [],
  reducedMotion: { hasReducedMotionSupport: false, ruleCount: 0, overriddenProperties: [] },
};

describe('renderCssBlock — fenced CSS code block with label', () => {
  test('returns a string', () => {
    expect(typeof renderCssBlock('Keyframes', '@keyframes fadeIn {}')).toBe('string');
  });

  test('starts with H3 label heading', () => {
    const result = renderCssBlock('Keyframes', '@keyframes fadeIn {}');
    expect(result).toMatch(/^### Keyframes/);
  });

  test('wraps content in fenced CSS code block', () => {
    const result = renderCssBlock('Keyframes', '@keyframes fadeIn {}');
    expect(result).toContain('```css');
    expect(result).toContain('```');
    expect(result).toContain('@keyframes fadeIn {}');
  });

  test('handles empty CSS string', () => {
    expect(() => renderCssBlock('Empty', '')).not.toThrow();
    expect(renderCssBlock('Empty', '')).toContain('```css');
  });
});

describe('keyframesToCss — convert keyframe objects to CSS text', () => {
  test('returns a string', () => {
    expect(typeof keyframesToCss(keyframes)).toBe('string');
  });

  test('outputs @keyframes rule for each keyframe', () => {
    const result = keyframesToCss(keyframes);
    expect(result).toContain('@keyframes fadeIn');
    expect(result).toContain('@keyframes slideUp');
  });

  test('includes stop keys (from/to/percentages)', () => {
    const result = keyframesToCss(keyframes);
    expect(result).toContain('from');
    expect(result).toContain('to');
    expect(result).toContain('0%');
    expect(result).toContain('100%');
  });

  test('includes CSS properties for each stop', () => {
    const result = keyframesToCss(keyframes);
    expect(result).toContain('opacity: 0');
    expect(result).toContain('opacity: 1');
    expect(result).toContain('transform: translateY(10px)');
  });

  test('separates multiple keyframe rules with blank lines', () => {
    const result = keyframesToCss(keyframes);
    expect(result).toContain('\n\n');
  });

  test('handles empty array gracefully', () => {
    expect(() => keyframesToCss([])).not.toThrow();
    expect(keyframesToCss([])).toBe('');
  });

  test('handles keyframe with no stops', () => {
    expect(() => keyframesToCss([{ name: 'empty', stops: [] }])).not.toThrow();
  });
});

describe('animationsToCss — convert animation objects to CSS shorthand', () => {
  test('returns a string', () => {
    expect(typeof animationsToCss(cssAnimations)).toBe('string');
  });

  test('includes animation name', () => {
    const result = animationsToCss(cssAnimations);
    expect(result).toContain('fadeIn');
    expect(result).toContain('slideUp');
  });

  test('includes duration', () => {
    const result = animationsToCss(cssAnimations);
    expect(result).toContain('300ms');
    expect(result).toContain('200ms');
  });

  test('includes timing function', () => {
    const result = animationsToCss(cssAnimations);
    expect(result).toContain('ease');
    expect(result).toContain('ease-out');
  });

  test('outputs CSS animation property declarations', () => {
    const result = animationsToCss(cssAnimations);
    expect(result).toContain('animation:');
  });

  test('handles empty array gracefully', () => {
    expect(() => animationsToCss([])).not.toThrow();
  });
});

describe('renderAnimationsSection — full animations layer renderer', () => {
  test('returns a string', () => {
    expect(typeof renderAnimationsSection(animationsPayload)).toBe('string');
  });

  test('includes a keyframes CSS block when keyframes are present', () => {
    const result = renderAnimationsSection(animationsPayload);
    expect(result).toContain('```css');
    expect(result).toContain('@keyframes');
  });

  test('includes animation shorthand block when cssAnimations are present', () => {
    const result = renderAnimationsSection(animationsPayload);
    expect(result).toContain('animation:');
  });

  test('includes H3 section headers', () => {
    const result = renderAnimationsSection(animationsPayload);
    expect(result).toMatch(/^### /m);
  });

  test('handles empty payload gracefully', () => {
    expect(() => renderAnimationsSection({})).not.toThrow();
  });

  test('handles payload with no keyframes', () => {
    const noKf = { ...animationsPayload, keyframes: [] };
    expect(() => renderAnimationsSection(noKf)).not.toThrow();
  });

  test('handles payload with no cssAnimations', () => {
    const noAnim = { ...animationsPayload, cssAnimations: [] };
    expect(() => renderAnimationsSection(noAnim)).not.toThrow();
  });
});
