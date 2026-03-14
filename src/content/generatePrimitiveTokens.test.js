/**
 * Task: 1c39e184 — Generate W3C DTCG primitive color tokens as JSON code block
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generatePrimitiveTokens, tokensToJsonBlock } from './generatePrimitiveTokens.js';

/** Minimal color entry as extractColors() produces */
function color(raw, hex, hsl = null) {
  return { raw, hex, hsl };
}

describe('generatePrimitiveTokens — W3C DTCG token structure', () => {
  test('returns an object (the token group)', () => {
    const result = generatePrimitiveTokens([color('rgb(255,0,0)', '#ff0000', 'hsl(0, 100%, 50%)')]);
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  test('each token has $value and $type fields', () => {
    const tokens = generatePrimitiveTokens([color('rgb(255,0,0)', '#ff0000', 'hsl(0, 100%, 50%)')]);
    const first = Object.values(tokens)[0];
    expect(first).toHaveProperty('$value');
    expect(first).toHaveProperty('$type');
  });

  test('$type is always "color"', () => {
    const tokens = generatePrimitiveTokens([
      color('rgb(255,0,0)', '#ff0000'),
      color('rgb(0,0,255)', '#0000ff'),
    ]);
    for (const token of Object.values(tokens)) {
      expect(token.$type).toBe('color');
    }
  });

  test('$value is the hex representation of the color', () => {
    const tokens = generatePrimitiveTokens([color('rgb(255,0,0)', '#ff0000')]);
    const token = Object.values(tokens)[0];
    expect(token.$value).toBe('#ff0000');
  });

  test('token key is a valid identifier (no spaces, starts with letter)', () => {
    const tokens = generatePrimitiveTokens([color('rgb(255,0,0)', '#ff0000')]);
    const key = Object.keys(tokens)[0];
    expect(/^[a-z][a-z0-9-]*$/.test(key)).toBe(true);
  });

  test('generates one token per unique color', () => {
    const colors = [
      color('rgb(255,0,0)',   '#ff0000'),
      color('rgb(0,255,0)',   '#00ff00'),
      color('rgb(0,0,255)',   '#0000ff'),
    ];
    const tokens = generatePrimitiveTokens(colors);
    expect(Object.keys(tokens)).toHaveLength(3);
  });

  test('returns empty object for empty color array', () => {
    const tokens = generatePrimitiveTokens([]);
    expect(tokens).toEqual({});
  });

  test('uses hex fallback when hex field is missing', () => {
    // raw is rgb — normalizeColor should derive hex
    const tokens = generatePrimitiveTokens([{ raw: 'rgb(0, 128, 255)', hex: '#0080ff' }]);
    const token = Object.values(tokens)[0];
    expect(token.$value).toBe('#0080ff');
  });

  test('token names are unique even for similar colors', () => {
    const colors = [
      color('rgb(10,10,10)', '#0a0a0a'),
      color('rgb(20,20,20)', '#141414'),
    ];
    const tokens = generatePrimitiveTokens(colors);
    const keys = Object.keys(tokens);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('tokens include $extensions with usage metadata', () => {
    const colors = [{ raw: 'rgb(255,0,0)', hex: '#ff0000', count: 42, properties: ['color', 'background-color'] }];
    const tokens = generatePrimitiveTokens(colors);
    const token = Object.values(tokens)[0];
    expect(token.$extensions).toBeDefined();
    expect(token.$extensions['com.getds.authored']).toBe('rgb(255,0,0)');
    expect(token.$extensions['com.getds.usageCount']).toBe(42);
    expect(token.$extensions['com.getds.cssProperties']).toEqual(['color', 'background-color']);
  });

  test('$extensions defaults usageCount to 1 when count not provided', () => {
    const colors = [{ raw: '#ff0000', hex: '#ff0000' }];
    const tokens = generatePrimitiveTokens(colors);
    const token = Object.values(tokens)[0];
    expect(token.$extensions['com.getds.usageCount']).toBe(1);
  });

  test('tokens are grouped under a "color" namespace key', () => {
    const tokens = generatePrimitiveTokens([color('rgb(255,0,0)', '#ff0000')]);
    // The result should be a flat map of token-name → token-object
    // Keys should not contain spaces or special chars
    for (const key of Object.keys(tokens)) {
      expect(key).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

describe('tokensToJsonBlock — format token object as fenced JSON code block', () => {
  test('returns a string', () => {
    const result = tokensToJsonBlock({});
    expect(typeof result).toBe('string');
  });

  test('starts with ```json fence', () => {
    const result = tokensToJsonBlock({ foo: { $value: '#fff', $type: 'color' } });
    expect(result.startsWith('```json')).toBe(true);
  });

  test('ends with closing ``` fence', () => {
    const result = tokensToJsonBlock({ foo: { $value: '#fff', $type: 'color' } });
    expect(result.trimEnd().endsWith('```')).toBe(true);
  });

  test('contains valid JSON between the fences', () => {
    const tokens = { red: { $value: '#ff0000', $type: 'color' } };
    const block = tokensToJsonBlock(tokens);
    const json = block.replace(/^```json\n/, '').replace(/\n```$/, '');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  test('parsed JSON matches the input token object', () => {
    const tokens = { red: { $value: '#ff0000', $type: 'color' } };
    const block = tokensToJsonBlock(tokens);
    const json = block.replace(/^```json\n/, '').replace(/\n```$/, '');
    expect(JSON.parse(json)).toEqual(tokens);
  });
});
