import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractAnimationChoreography } from './extractAnimationChoreography.js';

describe('extractAnimationChoreography — motion choreography detection', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('returns expected shape', () => {
    const result = extractAnimationChoreography();
    expect(result).toHaveProperty('ambientAnimations');
    expect(result).toHaveProperty('interactiveAnimations');
    expect(result).toHaveProperty('scrollAnimations');
    expect(result).toHaveProperty('hoverChoreography');
    expect(result).toHaveProperty('staggerSequences');
    expect(result).toHaveProperty('animationSequenceMap');
  });

  test('classifies infinite long animation as ambient', () => {
    const animations = [{
      name: 'float',
      duration: '8s',
      iterationCount: 'infinite',
      delay: '0s',
      element: { tag: 'div' },
    }];

    const { ambientAnimations } = extractAnimationChoreography([], animations);
    expect(ambientAnimations.length).toBe(1);
    expect(ambientAnimations[0].category).toBe('ambient');
  });

  test('classifies hover-triggered animation as interactive', () => {
    const cssText = '.card:hover { animation-name: cardHover; }';
    const animations = [{
      name: 'cardHover',
      duration: '0.3s',
      iterationCount: '1',
      delay: '0s',
      element: { tag: 'div' },
    }];

    const { interactiveAnimations } = extractAnimationChoreography([cssText], animations);
    const hover = interactiveAnimations.find(a => a.name === 'cardHover');
    expect(hover).toBeDefined();
    expect(hover.category).toBe('interactive');
  });

  test('detects scroll-driven animations', () => {
    const animations = [{
      name: 'scrollReveal',
      duration: '1s',
      iterationCount: '1',
      delay: '0s',
      animationTimeline: 'scroll()',
      element: { tag: 'div' },
    }];

    const { scrollAnimations } = extractAnimationChoreography([], animations);
    expect(scrollAnimations.length).toBe(1);
    expect(scrollAnimations[0].category).toBe('scroll-driven');
  });

  test('detects hover choreography (parent:hover child)', () => {
    const cssText = '.card:hover .card-image { transform: scale(1.05); opacity: 0.9; }';
    const { hoverChoreography } = extractAnimationChoreography([cssText]);
    expect(hoverChoreography.length).toBeGreaterThan(0);
    expect(hoverChoreography[0].triggerSelector).toBe('.card');
    expect(hoverChoreography[0].affectedChildren.length).toBeGreaterThan(0);
  });

  test('detects stagger sequences', () => {
    const animations = [
      { name: 'fadeIn', delay: '0ms', element: { tag: 'div' } },
      { name: 'fadeIn', delay: '100ms', element: { tag: 'div' } },
      { name: 'fadeIn', delay: '200ms', element: { tag: 'div' } },
      { name: 'fadeIn', delay: '300ms', element: { tag: 'div' } },
    ];

    const { staggerSequences } = extractAnimationChoreography([], animations);
    expect(staggerSequences.length).toBe(1);
    expect(staggerSequences[0].animationName).toBe('fadeIn');
    expect(staggerSequences[0].staggerIncrement).toBe('100ms');
  });

  test('returns empty results when no animations exist', () => {
    const result = extractAnimationChoreography();
    expect(result.ambientAnimations).toEqual([]);
    expect(result.interactiveAnimations).toEqual([]);
    expect(result.scrollAnimations).toEqual([]);
    expect(result.hoverChoreography).toEqual([]);
    expect(result.staggerSequences).toEqual([]);
    expect(result.animationSequenceMap).toEqual([]);
  });
});
