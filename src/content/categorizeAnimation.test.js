/**
 * Task: fb59aa93 — Categorize animations into types
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect } from 'bun:test';
import { categorizeAnimation } from './categorizeAnimation.js';

// Helper: build a minimal animation descriptor
function anim(overrides = {}) {
  return {
    name: 'myAnim',
    iterationCount: '1',
    componentType: 'unknown',
    ...overrides,
  };
}

describe('categorizeAnimation — classify animation by type', () => {
  test('returns a string category', () => {
    expect(typeof categorizeAnimation(anim())).toBe('string');
  });

  // continuous — infinite iteration
  test('infinite iteration → "continuous"', () => {
    expect(categorizeAnimation(anim({ iterationCount: 'infinite' }))).toBe('continuous');
  });

  test('Infinity iteration → "continuous"', () => {
    expect(categorizeAnimation(anim({ iterationCount: Infinity }))).toBe('continuous');
  });

  // loading — name patterns
  test('name "spin" → "loading"', () => {
    expect(categorizeAnimation(anim({ name: 'spin' }))).toBe('loading');
  });

  test('name "pulse" → "loading"', () => {
    expect(categorizeAnimation(anim({ name: 'pulse' }))).toBe('loading');
  });

  test('name "loader-spin" → "loading"', () => {
    expect(categorizeAnimation(anim({ name: 'loader-spin' }))).toBe('loading');
  });

  test('name "skeleton" → "loading"', () => {
    expect(categorizeAnimation(anim({ name: 'skeleton' }))).toBe('loading');
  });

  // entrance — name patterns
  test('name "fadeIn" → "entrance"', () => {
    expect(categorizeAnimation(anim({ name: 'fadeIn' }))).toBe('entrance');
  });

  test('name "slideIn" → "entrance"', () => {
    expect(categorizeAnimation(anim({ name: 'slideIn' }))).toBe('entrance');
  });

  test('name "fade-in-up" → "entrance"', () => {
    expect(categorizeAnimation(anim({ name: 'fade-in-up' }))).toBe('entrance');
  });

  test('name "bounceIn" → "entrance"', () => {
    expect(categorizeAnimation(anim({ name: 'bounceIn' }))).toBe('entrance');
  });

  test('name "zoomIn" → "entrance"', () => {
    expect(categorizeAnimation(anim({ name: 'zoomIn' }))).toBe('entrance');
  });

  // exit — name patterns
  test('name "fadeOut" → "exit"', () => {
    expect(categorizeAnimation(anim({ name: 'fadeOut' }))).toBe('exit');
  });

  test('name "slideOut" → "exit"', () => {
    expect(categorizeAnimation(anim({ name: 'slideOut' }))).toBe('exit');
  });

  test('name "fade-out" → "exit"', () => {
    expect(categorizeAnimation(anim({ name: 'fade-out' }))).toBe('exit');
  });

  test('name "zoomOut" → "exit"', () => {
    expect(categorizeAnimation(anim({ name: 'zoomOut' }))).toBe('exit');
  });

  // micro-interaction — interactive component types
  test('componentType "button" → "micro-interaction"', () => {
    expect(categorizeAnimation(anim({ componentType: 'button' }))).toBe('micro-interaction');
  });

  test('componentType "input" → "micro-interaction"', () => {
    expect(categorizeAnimation(anim({ componentType: 'input' }))).toBe('micro-interaction');
  });

  // fallback
  test('unknown name on unknown component → "micro-interaction" (default)', () => {
    expect(categorizeAnimation(anim({ name: 'my-custom-anim', componentType: 'unknown' }))).toBe('micro-interaction');
  });
});
