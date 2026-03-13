/**
 * Task: 00b5b89b — Extract all unique margin, padding, and gap values from computed styles
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractSpacing } from './extractSpacing.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) {
      return props[name] ?? '';
    },
  };
}

describe('extractSpacing — unique spacing values from computed styles', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => el.__fakeStyle__ ?? fakeStyle();
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function addEl(tag, fakeStyleProps) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(fakeStyleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a values array', () => {
    const result = extractSpacing();
    expect(result).toHaveProperty('values');
    expect(Array.isArray(result.values)).toBe(true);
  });

  test('extracts a padding value', () => {
    addEl('div', { 'padding-top': '16px' });
    const result = extractSpacing();
    const found = result.values.find(v => v.value === '16px');
    expect(found).toBeDefined();
  });

  test('extracts a margin value', () => {
    addEl('p', { 'margin-top': '24px' });
    const result = extractSpacing();
    const found = result.values.find(v => v.value === '24px');
    expect(found).toBeDefined();
  });

  test('extracts a gap value', () => {
    addEl('div', { 'gap': '8px' });
    const result = extractSpacing();
    const found = result.values.find(v => v.value === '8px');
    expect(found).toBeDefined();
  });

  test('deduplicates identical spacing values', () => {
    addEl('div', { 'padding-top': '16px' });
    addEl('p',   { 'padding-top': '16px' });
    const result = extractSpacing();
    const matches = result.values.filter(v => v.value === '16px');
    expect(matches).toHaveLength(1);
  });

  test('collects multiple distinct spacing values', () => {
    addEl('div', { 'padding-top': '8px', 'margin-top': '16px' });
    const result = extractSpacing();
    const vals = result.values.map(v => v.value);
    expect(vals).toContain('8px');
    expect(vals).toContain('16px');
  });

  test('skips zero values (0px)', () => {
    addEl('div', { 'margin-top': '0px', 'padding-top': '8px' });
    const result = extractSpacing();
    const vals = result.values.map(v => v.value);
    expect(vals).not.toContain('0px');
    expect(vals).toContain('8px');
  });

  test('skips invisible elements', () => {
    addEl('div', { display: 'none', 'padding-top': '999px' });
    addEl('p',   { 'padding-top': '8px' });
    const result = extractSpacing();
    const vals = result.values.map(v => v.value);
    expect(vals).not.toContain('999px');
    expect(vals).toContain('8px');
  });

  test('each value entry has value and properties fields', () => {
    addEl('div', { 'padding-top': '16px' });
    const result = extractSpacing();
    const entry = result.values[0];
    expect(entry).toHaveProperty('value');
    expect(entry).toHaveProperty('properties');
    expect(Array.isArray(entry.properties)).toBe(true);
  });

  test('properties lists which CSS properties the value was found on', () => {
    addEl('div', { 'padding-top': '16px' });
    const result = extractSpacing();
    const entry = result.values.find(v => v.value === '16px');
    expect(entry.properties).toContain('padding-top');
  });

  test('accumulates properties across elements for the same value', () => {
    addEl('div', { 'padding-top': '16px' });
    addEl('p',   { 'margin-top': '16px' });
    const result = extractSpacing();
    const entry = result.values.find(v => v.value === '16px');
    expect(entry.properties).toContain('padding-top');
    expect(entry.properties).toContain('margin-top');
  });

  test('returns empty values for empty document', () => {
    document.body.innerHTML = '';
    const result = extractSpacing();
    expect(result.values).toHaveLength(0);
  });

  test('collects all 4 padding sides', () => {
    addEl('div', {
      'padding-top': '8px', 'padding-right': '16px',
      'padding-bottom': '8px', 'padding-left': '16px',
    });
    const result = extractSpacing();
    const vals = result.values.map(v => v.value);
    expect(vals).toContain('8px');
    expect(vals).toContain('16px');
  });

  test('collects column-gap and row-gap', () => {
    addEl('div', { 'column-gap': '12px', 'row-gap': '24px' });
    const result = extractSpacing();
    const vals = result.values.map(v => v.value);
    expect(vals).toContain('12px');
    expect(vals).toContain('24px');
  });
});
