import { describe, test, expect } from 'bun:test';
import { detectViewTransitions } from './detectViewTransitions.js';

describe('detectViewTransitions', () => {
  test('detects view-transition-name', () => {
    const css = '.hero { view-transition-name: hero; }';
    const result = detectViewTransitions([css]);
    expect(result.hasViewTransitions).toBe(true);
    expect(result.transitionNames).toContain('hero');
  });

  test('detects ::view-transition pseudo-elements', () => {
    const css = '::view-transition-old(hero) { animation: fade-out 0.3s; }';
    const result = detectViewTransitions([css]);
    expect(result.hasViewTransitions).toBe(true);
    expect(result.pseudoElements.length).toBeGreaterThan(0);
  });

  test('detects multiple transition names', () => {
    const css = '.a { view-transition-name: header; } .b { view-transition-name: content; }';
    const result = detectViewTransitions([css]);
    expect(result.transitionNames).toContain('header');
    expect(result.transitionNames).toContain('content');
  });

  test('ignores view-transition-name: none', () => {
    const css = '.a { view-transition-name: none; }';
    const result = detectViewTransitions([css]);
    expect(result.hasViewTransitions).toBe(false);
    expect(result.transitionNames).toHaveLength(0);
  });

  test('returns false when no transitions found', () => {
    const css = '.box { color: red; }';
    const result = detectViewTransitions([css]);
    expect(result.hasViewTransitions).toBe(false);
  });

  test('handles empty input', () => {
    const result = detectViewTransitions([]);
    expect(result.hasViewTransitions).toBe(false);
    expect(result.transitionNames).toEqual([]);
    expect(result.pseudoElements).toEqual([]);
  });
});
