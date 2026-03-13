/**
 * Task: c42d59df — Detect Flexbox elements and extract flex properties
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractFlexDescriptors } from './extractFlexbox.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function style(props = {}) {
  return {
    display: props.display ?? 'block',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

function flexEl(props = {}) {
  return style({ display: 'flex', ...props });
}

function inlineFlexEl(props = {}) {
  return style({ display: 'inline-flex', ...props });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('extractFlexDescriptors — detect Flexbox and extract flex properties', () => {
  test('returns array', () => {
    expect(Array.isArray(extractFlexDescriptors([]))).toBe(true);
  });

  test('ignores non-flex elements', () => {
    expect(extractFlexDescriptors([style({ display: 'block' })])).toHaveLength(0);
    expect(extractFlexDescriptors([style({ display: 'grid' })])).toHaveLength(0);
  });

  test('includes elements with display:flex', () => {
    expect(extractFlexDescriptors([flexEl()])).toHaveLength(1);
  });

  test('includes elements with display:inline-flex', () => {
    expect(extractFlexDescriptors([inlineFlexEl()])).toHaveLength(1);
  });

  test('extracts flex-direction', () => {
    const [desc] = extractFlexDescriptors([flexEl({ 'flex-direction': 'row' })]);
    expect(desc.flexDirection).toBe('row');
  });

  test('extracts flex-wrap', () => {
    const [desc] = extractFlexDescriptors([flexEl({ 'flex-wrap': 'wrap' })]);
    expect(desc.flexWrap).toBe('wrap');
  });

  test('extracts justify-content', () => {
    const [desc] = extractFlexDescriptors([flexEl({ 'justify-content': 'space-between' })]);
    expect(desc.justifyContent).toBe('space-between');
  });

  test('extracts align-items', () => {
    const [desc] = extractFlexDescriptors([flexEl({ 'align-items': 'center' })]);
    expect(desc.alignItems).toBe('center');
  });

  test('extracts gap', () => {
    const [desc] = extractFlexDescriptors([flexEl({ gap: '8px' })]);
    expect(desc.gap).toBe('8px');
  });

  test('descriptor has all expected fields', () => {
    const [desc] = extractFlexDescriptors([flexEl()]);
    expect(desc).toHaveProperty('flexDirection');
    expect(desc).toHaveProperty('flexWrap');
    expect(desc).toHaveProperty('justifyContent');
    expect(desc).toHaveProperty('alignItems');
    expect(desc).toHaveProperty('gap');
  });

  test('handles multiple flex elements', () => {
    const els = [flexEl({ 'flex-direction': 'row' }), flexEl({ 'flex-direction': 'column' })];
    expect(extractFlexDescriptors(els)).toHaveLength(2);
  });

  test('handles empty input', () => {
    expect(extractFlexDescriptors([])).toEqual([]);
  });
});
