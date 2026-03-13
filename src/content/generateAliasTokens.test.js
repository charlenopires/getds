/**
 * Task: 1cb61493 — Generate semantic color alias tokens referencing primitives
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateAliasTokens } from './generateAliasTokens.js';

/**
 * Helpers to build the inputs that inferSemanticRoles + generatePrimitiveTokens produce.
 */
function roleEntry(colorRaw, role) {
  return { colorRaw, role };
}

function primitiveTokens(entries) {
  // entries: [{ raw, hex }]
  const tokens = {};
  for (const { hex } of entries) {
    const name = `color-${hex.replace('#', '').slice(0, 6)}`;
    tokens[name] = { $value: hex, $type: 'color' };
  }
  return tokens;
}

describe('generateAliasTokens — semantic alias tokens referencing primitives', () => {
  test('returns an object', () => {
    const result = generateAliasTokens([], {});
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  test('each alias token has $value and $type fields', () => {
    const roles = [roleEntry('rgb(255,0,0)', 'danger')];
    const prims = primitiveTokens([{ hex: '#ff0000' }]);
    // Need colorRaw → hex mapping
    const colorMap = [{ raw: 'rgb(255,0,0)', hex: '#ff0000' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    const token = Object.values(result)[0];
    expect(token).toHaveProperty('$value');
    expect(token).toHaveProperty('$type');
  });

  test('$type is "color"', () => {
    const roles = [roleEntry('rgb(255,0,0)', 'danger')];
    const prims = primitiveTokens([{ hex: '#ff0000' }]);
    const colorMap = [{ raw: 'rgb(255,0,0)', hex: '#ff0000' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    expect(Object.values(result)[0].$type).toBe('color');
  });

  test('$value is a DTCG reference to the primitive token name', () => {
    const roles = [roleEntry('rgb(255,0,0)', 'danger')];
    const prims = primitiveTokens([{ hex: '#ff0000' }]);
    const colorMap = [{ raw: 'rgb(255,0,0)', hex: '#ff0000' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    // DTCG reference format: {token-name}
    expect(Object.values(result)[0].$value).toMatch(/^\{color-[0-9a-f]+\}$/);
  });

  test('alias key matches the semantic role name', () => {
    const roles = [roleEntry('rgb(255,0,0)', 'danger')];
    const prims = primitiveTokens([{ hex: '#ff0000' }]);
    const colorMap = [{ raw: 'rgb(255,0,0)', hex: '#ff0000' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    expect(result).toHaveProperty('color-danger');
  });

  test('generates alias for each role entry', () => {
    const roles = [
      roleEntry('rgb(255,0,0)', 'danger'),
      roleEntry('rgb(0,255,0)', 'success'),
      roleEntry('rgb(255,255,255)', 'surface'),
    ];
    const prims = primitiveTokens([
      { hex: '#ff0000' },
      { hex: '#00ff00' },
      { hex: '#ffffff' },
    ]);
    const colorMap = [
      { raw: 'rgb(255,0,0)',   hex: '#ff0000' },
      { raw: 'rgb(0,255,0)',   hex: '#00ff00' },
      { raw: 'rgb(255,255,255)', hex: '#ffffff' },
    ];
    const result = generateAliasTokens(roles, prims, colorMap);
    expect(result).toHaveProperty('color-danger');
    expect(result).toHaveProperty('color-success');
    expect(result).toHaveProperty('color-surface');
  });

  test('returns empty object when no roles provided', () => {
    const result = generateAliasTokens([], {}, []);
    expect(result).toEqual({});
  });

  test('skips role entry if no matching primitive found', () => {
    // colorRaw not in primitives
    const roles = [roleEntry('rgb(1,2,3)', 'primary')];
    const prims = {}; // empty
    const colorMap = [{ raw: 'rgb(1,2,3)', hex: '#010203' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('reference points to the correct primitive key', () => {
    const roles = [roleEntry('rgb(0,128,255)', 'info')];
    const prims = { 'color-0080ff': { $value: '#0080ff', $type: 'color' } };
    const colorMap = [{ raw: 'rgb(0,128,255)', hex: '#0080ff' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    expect(result['color-info'].$value).toBe('{color-0080ff}');
  });

  test('handles multiple roles mapping to the same primitive', () => {
    // primary and on-surface can share a color in some designs
    const roles = [
      roleEntry('rgb(0,0,0)', 'primary'),
      roleEntry('rgb(0,0,0)', 'on-surface'),
    ];
    const prims = { 'color-000000': { $value: '#000000', $type: 'color' } };
    const colorMap = [{ raw: 'rgb(0,0,0)', hex: '#000000' }];
    const result = generateAliasTokens(roles, prims, colorMap);
    expect(result['color-primary'].$value).toBe('{color-000000}');
    expect(result['color-on-surface'].$value).toBe('{color-000000}');
  });
});
