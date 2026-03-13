/**
 * Task: a53913a3 — Output W3C DTCG design tokens as fenced JSON code blocks in relevant sections
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import { renderTokensSection, renderDtcgTokenBlock } from './renderTokensSection.js';

// Minimal W3C DTCG token map
const colorTokens = {
  'color-ff0000': { $value: '#ff0000', $type: 'color' },
  'color-00ff00': { $value: '#00ff00', $type: 'color' },
};

const spacingTokens = {
  'space-100': { $value: '8px',  $type: 'dimension' },
  'space-200': { $value: '16px', $type: 'dimension' },
};

const typographyTokens = {
  'text-body': {
    $type: 'typography',
    $value: { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5' },
  },
};

const mixedTokens = { ...colorTokens, ...spacingTokens };

describe('renderDtcgTokenBlock — fenced JSON block with label', () => {
  test('returns a string', () => {
    expect(typeof renderDtcgTokenBlock('Color', colorTokens)).toBe('string');
  });

  test('starts with a H3 label heading', () => {
    const result = renderDtcgTokenBlock('Color', colorTokens);
    expect(result).toMatch(/^### Color/);
  });

  test('contains a fenced JSON code block', () => {
    const result = renderDtcgTokenBlock('Color', colorTokens);
    expect(result).toContain('```json');
    expect(result).toContain('```');
  });

  test('JSON block contains $value fields', () => {
    const result = renderDtcgTokenBlock('Color', colorTokens);
    expect(result).toContain('"$value"');
  });

  test('JSON block contains $type fields', () => {
    const result = renderDtcgTokenBlock('Color', colorTokens);
    expect(result).toContain('"$type"');
  });

  test('JSON is valid and parseable', () => {
    const result = renderDtcgTokenBlock('Color', colorTokens);
    const jsonMatch = result.match(/```json\n([\s\S]+?)\n```/);
    expect(jsonMatch).not.toBeNull();
    expect(() => JSON.parse(jsonMatch[1])).not.toThrow();
  });

  test('handles empty token map', () => {
    expect(() => renderDtcgTokenBlock('Empty', {})).not.toThrow();
    const result = renderDtcgTokenBlock('Empty', {});
    expect(result).toContain('```json');
  });
});

describe('renderTokensSection — full tokens layer renderer', () => {
  test('returns a string', () => {
    expect(typeof renderTokensSection(colorTokens)).toBe('string');
  });

  test('groups tokens by $type into separate blocks', () => {
    const result = renderTokensSection(mixedTokens);
    // Should have a color block and a dimension block
    expect(result.toLowerCase()).toContain('color');
    expect(result.toLowerCase()).toContain('dimension');
  });

  test('each group has its own fenced JSON block', () => {
    const result = renderTokensSection(mixedTokens);
    const blocks = result.match(/```json/g);
    expect(blocks).not.toBeNull();
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  test('only includes tokens for the group in each block', () => {
    const result = renderTokensSection(mixedTokens);
    // color tokens block should have color values
    expect(result).toContain('#ff0000');
    // spacing tokens block should have dimension values
    expect(result).toContain('8px');
  });

  test('handles tokens with typography $type', () => {
    const result = renderTokensSection(typographyTokens);
    expect(result.toLowerCase()).toContain('typography');
    expect(result).toContain('Inter');
  });

  test('handles empty token map gracefully', () => {
    expect(() => renderTokensSection({})).not.toThrow();
  });

  test('handles non-DTCG data gracefully (no $type field)', () => {
    const nonDtcg = { foo: 'bar', baz: 42 };
    expect(() => renderTokensSection(nonDtcg)).not.toThrow();
  });

  test('token names appear in the JSON output', () => {
    const result = renderTokensSection(colorTokens);
    expect(result).toContain('color-ff0000');
    expect(result).toContain('color-00ff00');
  });
});
