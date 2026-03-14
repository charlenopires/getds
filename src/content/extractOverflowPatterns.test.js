import { describe, it, expect } from 'bun:test';
import { extractOverflowPatterns } from './extractOverflowPatterns.js';

function mockCs(props) {
  return { getPropertyValue: (key) => props[key] ?? '' };
}

describe('extractOverflowPatterns', () => {
  it('skips default visible', () => {
    const styles = [mockCs({ overflow: 'visible', 'overflow-x': 'visible', 'overflow-y': 'visible' })];
    const { overflowPatterns } = extractOverflowPatterns(styles);
    expect(overflowPatterns).toEqual([]);
  });

  it('extracts non-default overflow', () => {
    const styles = [
      mockCs({ overflow: 'hidden', 'overflow-x': 'hidden', 'overflow-y': 'hidden' }),
      mockCs({ overflow: 'hidden', 'overflow-x': 'hidden', 'overflow-y': 'hidden' }),
    ];
    const { overflowPatterns } = extractOverflowPatterns(styles);
    expect(overflowPatterns.length).toBe(1);
    expect(overflowPatterns[0].count).toBe(2);
    expect(overflowPatterns[0].overflow).toBe('hidden');
  });

  it('detects smooth scroll behavior', () => {
    const styles = [mockCs({
      overflow: 'auto', 'overflow-x': 'auto', 'overflow-y': 'auto',
      'scroll-behavior': 'smooth',
    })];
    const { scrollBehavior } = extractOverflowPatterns(styles);
    expect(scrollBehavior).toBe('smooth');
  });

  it('detects scrollbar styling', () => {
    const styles = [mockCs({
      overflow: 'auto', 'overflow-x': 'auto', 'overflow-y': 'auto',
      'scrollbar-width': 'thin',
    })];
    const { hasScrollbarStyling } = extractOverflowPatterns(styles);
    expect(hasScrollbarStyling).toBe(true);
  });

  it('handles empty input', () => {
    const result = extractOverflowPatterns([]);
    expect(result.overflowPatterns).toEqual([]);
    expect(result.scrollBehavior).toBe('auto');
    expect(result.hasScrollbarStyling).toBe(false);
  });
});
