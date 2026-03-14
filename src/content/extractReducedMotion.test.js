/**
 * Tests for extractReducedMotion — wrapper with assessment
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractReducedMotion } from './extractReducedMotion.js';

describe('extractReducedMotion — extract reduced motion data with assessment', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;

    // Provide a minimal styleSheets mock to avoid happy-dom querySelectorAll issue
    Object.defineProperty(document, 'styleSheets', {
      value: [],
      configurable: true,
    });
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('returns an object with a reducedMotion key', () => {
    const result = extractReducedMotion();
    expect(result).toHaveProperty('reducedMotion');
  });

  test('reducedMotion has supported, ruleCount, overriddenProperties, assessment fields', () => {
    const { reducedMotion } = extractReducedMotion();
    expect(reducedMotion).toHaveProperty('supported');
    expect(reducedMotion).toHaveProperty('ruleCount');
    expect(reducedMotion).toHaveProperty('overriddenProperties');
    expect(reducedMotion).toHaveProperty('assessment');
  });

  test('assessment is "None" when no prefers-reduced-motion rules exist', () => {
    const { reducedMotion } = extractReducedMotion();
    expect(reducedMotion.assessment).toBe('None');
    expect(reducedMotion.supported).toBe(false);
  });

  test('overriddenProperties is an array', () => {
    const { reducedMotion } = extractReducedMotion();
    expect(Array.isArray(reducedMotion.overriddenProperties)).toBe(true);
  });

  test('ruleCount is 0 when page has no reduced-motion rules', () => {
    const { reducedMotion } = extractReducedMotion();
    expect(reducedMotion.ruleCount).toBe(0);
  });
});
