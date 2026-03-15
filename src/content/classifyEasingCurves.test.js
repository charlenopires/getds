import { describe, test, expect } from 'bun:test';
import { classifyEasingCurves } from './classifyEasingCurves.js';

describe('classifyEasingCurves', () => {
  test('returns empty for no animations or transitions', () => {
    const result = classifyEasingCurves([], []);
    expect(result.easingClassifications).toEqual([]);
    expect(result.summary.total).toBe(0);
  });

  test('classifies named easing keywords', () => {
    const anims = [
      { timingFunction: 'ease' },
      { timingFunction: 'linear' },
      { timingFunction: 'ease-in-out' },
    ];
    const result = classifyEasingCurves(anims, []);
    expect(result.easingClassifications).toHaveLength(3);

    const ease = result.easingClassifications.find(e => e.raw === 'ease');
    expect(ease.classification).toBe('ease');
    expect(ease.isCustom).toBe(false);

    const linear = result.easingClassifications.find(e => e.raw === 'linear');
    expect(linear.classification).toBe('linear');
  });

  test('classifies spring/overshoot cubic-bezier', () => {
    const transitions = [
      { timingFunction: 'cubic-bezier(0.17, 0.67, 0.3, 1.33)' },
    ];
    const result = classifyEasingCurves([], transitions);
    expect(result.easingClassifications).toHaveLength(1);
    expect(result.easingClassifications[0].overshoot).toBe(true);
    expect(result.easingClassifications[0].physicsModel).toBe('spring');
    expect(result.easingClassifications[0].controlPoints).toEqual([0.17, 0.67, 0.3, 1.33]);
  });

  test('classifies step functions', () => {
    const anims = [{ timingFunction: 'steps(4, end)' }];
    const result = classifyEasingCurves(anims, []);
    expect(result.easingClassifications[0].classification).toBe('step');
    expect(result.easingClassifications[0].isCustom).toBe(true);
  });

  test('deduplicates identical easings', () => {
    const anims = [
      { timingFunction: 'ease' },
      { timingFunction: 'ease' },
    ];
    const transitions = [
      { easing: 'ease' },
    ];
    const result = classifyEasingCurves(anims, transitions);
    expect(result.easingClassifications).toHaveLength(1);
  });

  test('matches close-to-named cubic-bezier', () => {
    // This is very close to ease (0.25, 0.1, 0.25, 1.0)
    const anims = [{ timingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)' }];
    const result = classifyEasingCurves(anims, []);
    expect(result.easingClassifications[0].namedEquivalent).toBe('ease');
    expect(result.easingClassifications[0].isCustom).toBe(false);
  });

  test('builds correct summary', () => {
    const anims = [
      { timingFunction: 'ease' },
      { timingFunction: 'cubic-bezier(0.17, 0.67, 0.3, 1.33)' },
      { timingFunction: 'linear' },
    ];
    const result = classifyEasingCurves(anims, []);
    expect(result.summary.total).toBe(3);
    expect(result.summary.withOvershoot).toBe(1);
    expect(result.summary.custom).toBeGreaterThanOrEqual(1);
  });

  test('handles transitions with easing field', () => {
    const transitions = [
      { easing: 'cubic-bezier(0.42, 0, 0.58, 1)' },
    ];
    const result = classifyEasingCurves([], transitions);
    expect(result.easingClassifications).toHaveLength(1);
    expect(result.easingClassifications[0].namedEquivalent).toBe('ease-in-out');
  });
});
