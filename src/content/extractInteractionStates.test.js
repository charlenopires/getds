/**
 * Task: ee1ccce5 — Extract component interaction states from CSS pseudo-class rules
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect } from 'bun:test';
import { parseInteractionStates } from './extractInteractionStates.js';

describe('parseInteractionStates — extract pseudo-class rules from CSS text', () => {
  test('returns an array of state entries', () => {
    const result = parseInteractionStates('');
    expect(Array.isArray(result)).toBe(true);
  });

  test('detects :hover rule', () => {
    const css = '.btn:hover { background-color: darkblue; }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'hover')).toBe(true);
  });

  test('detects :focus rule', () => {
    const css = '.btn:focus { outline: 2px solid blue; }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'focus')).toBe(true);
  });

  test('detects :focus-visible rule', () => {
    const css = '.btn:focus-visible { outline: 3px solid orange; }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'focus-visible')).toBe(true);
  });

  test('detects :active rule', () => {
    const css = '.btn:active { transform: scale(0.98); }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'active')).toBe(true);
  });

  test('detects :disabled rule', () => {
    const css = '.btn:disabled { opacity: 0.5; }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'disabled')).toBe(true);
  });

  test('detects [disabled] attribute selector', () => {
    const css = '.btn[disabled] { opacity: 0.4; cursor: not-allowed; }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'disabled')).toBe(true);
  });

  test('detects [aria-disabled="true"] selector', () => {
    const css = '.btn[aria-disabled="true"] { opacity: 0.4; }';
    const result = parseInteractionStates(css);
    expect(result.some(r => r.pseudoClass === 'disabled')).toBe(true);
  });

  test('each entry has selector field', () => {
    const css = '.btn:hover { color: red; }';
    const result = parseInteractionStates(css);
    expect(result[0]).toHaveProperty('selector');
    expect(result[0].selector).toContain('.btn');
  });

  test('each entry has pseudoClass field', () => {
    const css = '.btn:hover { color: red; }';
    const result = parseInteractionStates(css);
    expect(result[0]).toHaveProperty('pseudoClass');
  });

  test('each entry has styles object', () => {
    const css = '.btn:hover { color: red; background-color: blue; }';
    const result = parseInteractionStates(css);
    expect(result[0]).toHaveProperty('styles');
    expect(typeof result[0].styles).toBe('object');
  });

  test('styles captures the declarations inside the rule', () => {
    const css = '.btn:hover { color: red; }';
    const result = parseInteractionStates(css);
    expect(result[0].styles['color']).toBe('red');
  });

  test('multiple pseudo-class rules are all detected', () => {
    const css = `
      .btn:hover  { background-color: darkblue; }
      .btn:focus  { outline: 2px solid blue; }
      .btn:active { opacity: 0.8; }
    `;
    const result = parseInteractionStates(css);
    const pseudos = result.map(r => r.pseudoClass);
    expect(pseudos).toContain('hover');
    expect(pseudos).toContain('focus');
    expect(pseudos).toContain('active');
  });

  test('returns empty array for CSS with no interaction rules', () => {
    const css = '.btn { background-color: blue; color: white; }';
    const result = parseInteractionStates(css);
    expect(result).toHaveLength(0);
  });

  test('returns empty array for empty CSS string', () => {
    expect(parseInteractionStates('')).toHaveLength(0);
  });

  test('ignores non-interaction pseudo-classes like :first-child', () => {
    const css = 'li:first-child { margin-top: 0; }';
    const result = parseInteractionStates(css);
    expect(result).toHaveLength(0);
  });
});
