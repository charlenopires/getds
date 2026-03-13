/**
 * Task: db2145ff — Generate W3C DTCG spacing tokens
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateSpacingTokens } from './generateSpacingTokens.js';

describe('generateSpacingTokens — W3C DTCG spacing tokens', () => {
  test('returns an object (token map)', () => {
    const result = generateSpacingTokens([]);
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  test('each token has $value and $type fields', () => {
    const scale = [{ step: 1, px: 8, value: '8px', multiplier: 1 }];
    const tokens = generateSpacingTokens(scale);
    const token = Object.values(tokens)[0];
    expect(token).toHaveProperty('$value');
    expect(token).toHaveProperty('$type');
  });

  test('$type is "dimension" for all tokens', () => {
    const scale = [{ step: 1, px: 8, value: '8px', multiplier: 1 }];
    const tokens = generateSpacingTokens(scale);
    for (const token of Object.values(tokens)) {
      expect(token.$type).toBe('dimension');
    }
  });

  test('$value matches the original value string', () => {
    const scale = [{ step: 1, px: 8, value: '8px', multiplier: 1 }];
    const tokens = generateSpacingTokens(scale);
    const token = Object.values(tokens)[0];
    expect(token.$value).toBe('8px');
  });

  test('token key includes the step number', () => {
    const scale = [{ step: 1, px: 8, value: '8px', multiplier: 1 }];
    const tokens = generateSpacingTokens(scale);
    expect(Object.keys(tokens).some(k => k.includes('1'))).toBe(true);
  });

  test('token key follows spacing-{step} pattern', () => {
    const scale = [
      { step: 1, px: 8,  value: '8px',  multiplier: 1 },
      { step: 2, px: 16, value: '16px', multiplier: 2 },
    ];
    const tokens = generateSpacingTokens(scale);
    expect(tokens).toHaveProperty('spacing-1');
    expect(tokens).toHaveProperty('spacing-2');
  });

  test('produces one token per scale entry', () => {
    const scale = [
      { step: 1, px: 8,  value: '8px',  multiplier: 1 },
      { step: 2, px: 16, value: '16px', multiplier: 2 },
      { step: 3, px: 24, value: '24px', multiplier: 3 },
    ];
    const tokens = generateSpacingTokens(scale);
    expect(Object.keys(tokens).length).toBe(3);
  });

  test('returns empty object for empty scale', () => {
    expect(generateSpacingTokens([])).toEqual({});
  });

  test('includes px as a comment or description field', () => {
    const scale = [{ step: 1, px: 8, value: '8px', multiplier: 1 }];
    const tokens = generateSpacingTokens(scale);
    const token = Object.values(tokens)[0];
    // Either $description or a px field should expose the px value
    const hasContext = token.$description !== undefined || token.px !== undefined;
    expect(hasContext).toBe(true);
  });

  test('token values preserve rem units when given', () => {
    const scale = [{ step: 1, px: 16, value: '1rem', multiplier: 2 }];
    const tokens = generateSpacingTokens(scale);
    expect(tokens['spacing-1'].$value).toBe('1rem');
  });
});
