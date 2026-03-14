import { describe, it, expect } from 'bun:test';
import { extractZIndexLayers, inferZIndexRole } from './extractZIndexLayers.js';

function mockCs(props) {
  return { getPropertyValue: (key) => props[key] ?? '' };
}

describe('inferZIndexRole', () => {
  it('returns base for 0-9', () => {
    expect(inferZIndexRole(0)).toBe('base');
    expect(inferZIndexRole(5)).toBe('base');
  });

  it('returns dropdown for 10-99', () => {
    expect(inferZIndexRole(10)).toBe('dropdown');
    expect(inferZIndexRole(50)).toBe('dropdown');
  });

  it('returns modal for 1000-9999', () => {
    expect(inferZIndexRole(1000)).toBe('modal');
  });

  it('returns below for negatives', () => {
    expect(inferZIndexRole(-1)).toBe('below');
  });

  it('returns toast for 10000+', () => {
    expect(inferZIndexRole(99999)).toBe('toast');
  });
});

describe('extractZIndexLayers', () => {
  it('returns empty for no z-index', () => {
    const styles = [mockCs({ 'z-index': 'auto' })];
    const { zIndexLayers } = extractZIndexLayers(styles);
    expect(zIndexLayers).toEqual([]);
  });

  it('extracts z-index values with counts', () => {
    const styles = [
      mockCs({ 'z-index': '10' }),
      mockCs({ 'z-index': '10' }),
      mockCs({ 'z-index': '1000' }),
    ];
    const { zIndexLayers } = extractZIndexLayers(styles);
    expect(zIndexLayers.length).toBe(2);
    expect(zIndexLayers[0]).toEqual({ value: 10, count: 2, inferredRole: 'dropdown' });
    expect(zIndexLayers[1]).toEqual({ value: 1000, count: 1, inferredRole: 'modal' });
  });

  it('sorts ascending by value', () => {
    const styles = [
      mockCs({ 'z-index': '1000' }),
      mockCs({ 'z-index': '1' }),
    ];
    const { zIndexLayers } = extractZIndexLayers(styles);
    expect(zIndexLayers[0].value).toBe(1);
    expect(zIndexLayers[1].value).toBe(1000);
  });

  it('handles empty input', () => {
    const { zIndexLayers } = extractZIndexLayers([]);
    expect(zIndexLayers).toEqual([]);
  });
});
