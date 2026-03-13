/**
 * Task: 22795a89 — Detect focus styles by comparing :focus computed styles
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { hasFocusIndicator, classifyFocusStyle } from './auditFocusStyles.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function style(props = {}) {
  return { getPropertyValue: (name) => props[name] ?? '' };
}

// ── hasFocusIndicator ─────────────────────────────────────────────────────────

describe('hasFocusIndicator — detect visible focus indicator from computed style', () => {
  test('outline with non-none value = has indicator', () => {
    expect(hasFocusIndicator(style({ outline: '2px solid blue' }))).toBe(true);
  });

  test('outline:none = no indicator', () => {
    expect(hasFocusIndicator(style({ outline: 'none', 'outline-style': 'none' }))).toBe(false);
  });

  test('box-shadow present = has indicator', () => {
    expect(hasFocusIndicator(style({ 'box-shadow': '0 0 0 3px blue', outline: 'none' }))).toBe(true);
  });

  test('border change (non-transparent) = has indicator', () => {
    expect(hasFocusIndicator(style({ 'border-color': 'blue', outline: 'none' }))).toBe(true);
  });

  test('no focus properties = no indicator', () => {
    expect(hasFocusIndicator(style({}))).toBe(false);
  });

  test('outline-style:none explicitly = no indicator from outline', () => {
    expect(hasFocusIndicator(style({ 'outline-style': 'none', outline: '' }))).toBe(false);
  });
});

// ── classifyFocusStyle ────────────────────────────────────────────────────────

describe('classifyFocusStyle — classify focus indicator quality', () => {
  test('outline with offset = good', () => {
    const result = classifyFocusStyle(style({
      outline: '2px solid blue',
      'outline-offset': '2px',
    }));
    expect(result).toBe('good');
  });

  test('outline without offset = present', () => {
    const result = classifyFocusStyle(style({ outline: '2px solid blue' }));
    expect(result).toBe('present');
  });

  test('box-shadow only = present', () => {
    const result = classifyFocusStyle(style({
      'box-shadow': '0 0 0 3px blue',
      outline: 'none',
    }));
    expect(result).toBe('present');
  });

  test('no indicator = none', () => {
    expect(classifyFocusStyle(style({}))).toBe('none');
  });

  test('outline:none = none', () => {
    expect(classifyFocusStyle(style({ outline: 'none', 'outline-style': 'none' }))).toBe('none');
  });
});
