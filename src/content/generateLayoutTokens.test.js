import { describe, test, expect } from 'bun:test';
import { generateLayoutTokens } from './generateLayoutTokens.js';

describe('generateLayoutTokens', () => {
  test('generates layout-type token', () => {
    const tokens = generateLayoutTokens({
      layoutType: { layoutType: 'Dashboard', confidence: 0.85 },
    });
    expect(tokens['layout-type'].$value).toBe('Dashboard');
    expect(tokens['layout-type'].$type).toBe('string');
  });

  test('generates column-system token', () => {
    const tokens = generateLayoutTokens({
      columnSystem: { detectedSystem: '12-column', dominantColumnCount: 12, confidence: 0.9 },
    });
    expect(tokens['column-system'].$value).toBe('12-column');
  });

  test('skips column-system token for none', () => {
    const tokens = generateLayoutTokens({
      columnSystem: { detectedSystem: 'none', dominantColumnCount: 0, confidence: 0 },
    });
    expect(tokens['column-system']).toBeUndefined();
  });

  test('generates spacing-consistency token', () => {
    const tokens = generateLayoutTokens({
      spacingConsistency: { score: 0.92, grade: 'excellent' },
    });
    expect(tokens['spacing-consistency'].$value).toBe('excellent');
  });

  test('generates inset tokens', () => {
    const tokens = generateLayoutTokens({
      insets: [
        { type: 'equal', values: { top: 16, right: 16, bottom: 16, left: 16 }, count: 10 },
        { type: 'squish', values: { top: 8, right: 16, bottom: 8, left: 16 }, count: 5 },
      ],
    });
    expect(tokens['inset-equal-1']).toBeDefined();
    expect(tokens['inset-squish-2']).toBeDefined();
  });

  test('returns empty for no input', () => {
    const tokens = generateLayoutTokens();
    expect(Object.keys(tokens)).toHaveLength(0);
  });
});
