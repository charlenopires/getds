/**
 * Tests for classifyStackInline — stack/inline/wrap-grid spacing classification
 */

import { describe, test, expect } from 'bun:test';
import { classifySpacingIntent, extractStackInlinePatterns } from './classifyStackInline.js';

describe('classifySpacingIntent — classify a flex descriptor', () => {
  test('returns "stack" for column direction', () => {
    const result = classifySpacingIntent({ flexDirection: 'column', flexWrap: 'nowrap', gap: '16px' });
    expect(result.intent).toBe('stack');
    expect(result.gap).toBe('16px');
  });

  test('returns "stack" for column-reverse direction', () => {
    const result = classifySpacingIntent({ flexDirection: 'column-reverse', flexWrap: 'nowrap', gap: '8px' });
    expect(result.intent).toBe('stack');
    expect(result.gap).toBe('8px');
  });

  test('returns "inline" for row direction without wrapping', () => {
    const result = classifySpacingIntent({ flexDirection: 'row', flexWrap: 'nowrap', gap: '12px' });
    expect(result.intent).toBe('inline');
    expect(result.gap).toBe('12px');
  });

  test('returns "inline" for row-reverse direction without wrapping', () => {
    const result = classifySpacingIntent({ flexDirection: 'row-reverse', flexWrap: 'nowrap', gap: '4px' });
    expect(result.intent).toBe('inline');
    expect(result.gap).toBe('4px');
  });

  test('returns "wrap-grid" when flex-wrap is "wrap"', () => {
    const result = classifySpacingIntent({ flexDirection: 'row', flexWrap: 'wrap', gap: '24px' });
    expect(result.intent).toBe('wrap-grid');
    expect(result.gap).toBe('24px');
  });

  test('returns "wrap-grid" when flex-wrap is "wrap-reverse"', () => {
    const result = classifySpacingIntent({ flexDirection: 'row', flexWrap: 'wrap-reverse', gap: '8px' });
    expect(result.intent).toBe('wrap-grid');
  });

  test('wrap-grid takes priority over column direction', () => {
    const result = classifySpacingIntent({ flexDirection: 'column', flexWrap: 'wrap', gap: '16px' });
    expect(result.intent).toBe('wrap-grid');
  });

  test('defaults gap to "0px" when gap is empty string', () => {
    const result = classifySpacingIntent({ flexDirection: 'row', flexWrap: 'nowrap', gap: '' });
    expect(result.gap).toBe('0px');
  });

  test('defaults gap to "0px" when gap is undefined', () => {
    const result = classifySpacingIntent({ flexDirection: 'row', flexWrap: 'nowrap', gap: undefined });
    expect(result.gap).toBe('0px');
  });
});

describe('extractStackInlinePatterns — extract patterns from computed styles', () => {
  /** Helper to create a fake computed style for flex containers */
  function flexCS(direction, wrap, gap) {
    const map = {
      display: 'flex',
      'flex-direction': direction,
      'flex-wrap': wrap,
      gap: gap,
    };
    return {
      display: 'flex',
      getPropertyValue: (prop) => map[prop] ?? '',
    };
  }

  /** Helper for non-flex elements */
  function blockCS() {
    return {
      display: 'block',
      getPropertyValue: (prop) => (prop === 'display' ? 'block' : ''),
    };
  }

  test('returns an object with stacks, inlines, and wrapGrids arrays', () => {
    const result = extractStackInlinePatterns([]);
    expect(result).toHaveProperty('stacks');
    expect(result).toHaveProperty('inlines');
    expect(result).toHaveProperty('wrapGrids');
    expect(Array.isArray(result.stacks)).toBe(true);
    expect(Array.isArray(result.inlines)).toBe(true);
    expect(Array.isArray(result.wrapGrids)).toBe(true);
  });

  test('returns empty arrays for empty input', () => {
    const result = extractStackInlinePatterns([]);
    expect(result.stacks).toEqual([]);
    expect(result.inlines).toEqual([]);
    expect(result.wrapGrids).toEqual([]);
  });

  test('skips non-flex elements', () => {
    const result = extractStackInlinePatterns([blockCS()]);
    expect(result.stacks).toEqual([]);
    expect(result.inlines).toEqual([]);
    expect(result.wrapGrids).toEqual([]);
  });

  test('classifies column flex as stack', () => {
    const result = extractStackInlinePatterns([flexCS('column', 'nowrap', '16px')]);
    expect(result.stacks).toHaveLength(1);
    expect(result.stacks[0].gap).toBe('16px');
    expect(result.stacks[0].count).toBe(1);
  });

  test('classifies row flex as inline', () => {
    const result = extractStackInlinePatterns([flexCS('row', 'nowrap', '8px')]);
    expect(result.inlines).toHaveLength(1);
    expect(result.inlines[0].gap).toBe('8px');
    expect(result.inlines[0].count).toBe(1);
  });

  test('classifies wrapping flex as wrap-grid', () => {
    const result = extractStackInlinePatterns([flexCS('row', 'wrap', '24px')]);
    expect(result.wrapGrids).toHaveLength(1);
    expect(result.wrapGrids[0].gap).toBe('24px');
    expect(result.wrapGrids[0].count).toBe(1);
  });

  test('counts duplicate gap values within the same category', () => {
    const styles = [
      flexCS('column', 'nowrap', '16px'),
      flexCS('column', 'nowrap', '16px'),
      flexCS('column', 'nowrap', '16px'),
    ];
    const result = extractStackInlinePatterns(styles);
    expect(result.stacks).toHaveLength(1);
    expect(result.stacks[0].count).toBe(3);
  });

  test('separates different gap values within the same category', () => {
    const styles = [
      flexCS('column', 'nowrap', '8px'),
      flexCS('column', 'nowrap', '16px'),
    ];
    const result = extractStackInlinePatterns(styles);
    expect(result.stacks).toHaveLength(2);
    const gaps = result.stacks.map((s) => s.gap).sort();
    expect(gaps).toEqual(['16px', '8px']);
  });

  test('handles mixed flex types in a single pass', () => {
    const styles = [
      flexCS('column', 'nowrap', '16px'),
      flexCS('row', 'nowrap', '8px'),
      flexCS('row', 'wrap', '24px'),
    ];
    const result = extractStackInlinePatterns(styles);
    expect(result.stacks).toHaveLength(1);
    expect(result.inlines).toHaveLength(1);
    expect(result.wrapGrids).toHaveLength(1);
  });

  test('handles inline-flex display value', () => {
    const cs = {
      display: 'inline-flex',
      getPropertyValue: (prop) => {
        const map = {
          display: 'inline-flex',
          'flex-direction': 'row',
          'flex-wrap': 'nowrap',
          gap: '4px',
        };
        return map[prop] ?? '';
      },
    };
    const result = extractStackInlinePatterns([cs]);
    expect(result.inlines).toHaveLength(1);
    expect(result.inlines[0].gap).toBe('4px');
  });

  test('each entry has gap and count fields', () => {
    const result = extractStackInlinePatterns([flexCS('row', 'nowrap', '12px')]);
    expect(result.inlines[0]).toHaveProperty('gap');
    expect(result.inlines[0]).toHaveProperty('count');
  });
});
