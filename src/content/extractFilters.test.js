import { describe, it, expect } from 'bun:test';
import { extractFilters } from './extractFilters.js';

function mockCs(props) {
  return { getPropertyValue: (key) => props[key] ?? '' };
}

describe('extractFilters', () => {
  it('returns empty for no filters', () => {
    const styles = [mockCs({ filter: 'none', 'backdrop-filter': 'none' })];
    const { filters, backdropFilters } = extractFilters(styles);
    expect(filters).toEqual([]);
    expect(backdropFilters).toEqual([]);
  });

  it('extracts filter values with function names', () => {
    const styles = [mockCs({ filter: 'blur(5px) brightness(0.8)' })];
    const { filters } = extractFilters(styles);
    expect(filters.length).toBe(1);
    expect(filters[0].functions).toContain('blur');
    expect(filters[0].functions).toContain('brightness');
  });

  it('extracts backdrop-filter', () => {
    const styles = [mockCs({ 'backdrop-filter': 'blur(10px)' })];
    const { backdropFilters } = extractFilters(styles);
    expect(backdropFilters.length).toBe(1);
    expect(backdropFilters[0].functions).toContain('blur');
  });

  it('deduplicates identical filter values', () => {
    const styles = [
      mockCs({ filter: 'blur(5px)' }),
      mockCs({ filter: 'blur(5px)' }),
    ];
    const { filters } = extractFilters(styles);
    expect(filters.length).toBe(1);
  });

  it('handles empty input', () => {
    const { filters, backdropFilters } = extractFilters([]);
    expect(filters).toEqual([]);
    expect(backdropFilters).toEqual([]);
  });
});
