import { describe, it, expect } from 'bun:test';
import { extractOpacity } from './extractOpacity.js';

function mockCs(props) {
  return { getPropertyValue: (key) => props[key] ?? '' };
}

describe('extractOpacity', () => {
  it('returns empty for all opacity 1', () => {
    const styles = [mockCs({ opacity: '1' }), mockCs({ opacity: '1' })];
    const { opacityValues } = extractOpacity(styles);
    expect(opacityValues).toEqual([]);
  });

  it('extracts non-1 opacity values with counts', () => {
    const styles = [
      mockCs({ opacity: '0.5' }),
      mockCs({ opacity: '0.5' }),
      mockCs({ opacity: '0.8' }),
    ];
    const { opacityValues } = extractOpacity(styles);
    expect(opacityValues.length).toBe(2);
    expect(opacityValues[0]).toEqual({ value: '0.5', count: 2 });
    expect(opacityValues[1]).toEqual({ value: '0.8', count: 1 });
  });

  it('sorts by value ascending', () => {
    const styles = [
      mockCs({ opacity: '0.8' }),
      mockCs({ opacity: '0.2' }),
    ];
    const { opacityValues } = extractOpacity(styles);
    expect(parseFloat(opacityValues[0].value)).toBeLessThan(parseFloat(opacityValues[1].value));
  });

  it('handles empty input', () => {
    const { opacityValues } = extractOpacity([]);
    expect(opacityValues).toEqual([]);
  });
});
