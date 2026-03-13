/**
 * Task: cef03bba — Extract unique font-size values and organize into a sorted type scale
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractTypeScale } from './extractTypeScale.js';

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

describe('extractTypeScale — unique font-sizes sorted into a type scale', () => {
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

  test('returns an object with a scale array', () => {
    const result = extractTypeScale();
    expect(result).toHaveProperty('scale');
    expect(Array.isArray(result.scale)).toBe(true);
  });

  test('extracts a font-size value from a text element', () => {
    addEl('p', { 'font-size': '16px' });
    const result = extractTypeScale();
    const sizes = result.scale.map(s => s.value);
    expect(sizes).toContain('16px');
  });

  test('deduplicates identical font-size values', () => {
    addEl('p',    { 'font-size': '16px' });
    addEl('span', { 'font-size': '16px' });
    const result = extractTypeScale();
    const matches = result.scale.filter(s => s.value === '16px');
    expect(matches).toHaveLength(1);
  });

  test('scale is sorted ascending by pixel value', () => {
    addEl('h1', { 'font-size': '32px' });
    addEl('h2', { 'font-size': '24px' });
    addEl('p',  { 'font-size': '16px' });
    const result = extractTypeScale();
    const pxValues = result.scale.map(s => s.px);
    for (let i = 1; i < pxValues.length; i++) {
      expect(pxValues[i]).toBeGreaterThanOrEqual(pxValues[i - 1]);
    }
  });

  test('each scale step has value and px fields', () => {
    addEl('p', { 'font-size': '16px' });
    const result = extractTypeScale();
    const step = result.scale[0];
    expect(step).toHaveProperty('value');
    expect(step).toHaveProperty('px');
  });

  test('px field is a number', () => {
    addEl('p', { 'font-size': '24px' });
    const result = extractTypeScale();
    expect(typeof result.scale[0].px).toBe('number');
    expect(result.scale[0].px).toBe(24);
  });

  test('each scale step has a step index (1-based)', () => {
    addEl('p',  { 'font-size': '16px' });
    addEl('h1', { 'font-size': '32px' });
    const result = extractTypeScale();
    const steps = result.scale.map(s => s.step);
    expect(steps).toContain(1);
    expect(steps).toContain(2);
  });

  test('skips invisible elements', () => {
    addEl('p', { display: 'none', 'font-size': '99px' });
    addEl('span', { 'font-size': '16px' });
    const result = extractTypeScale();
    const sizes = result.scale.map(s => s.value);
    expect(sizes).not.toContain('99px');
    expect(sizes).toContain('16px');
  });

  test('skips elements with empty font-size', () => {
    addEl('div', { 'font-size': '' });
    const result = extractTypeScale();
    expect(result.scale.every(s => s.value !== '')).toBe(true);
  });

  test('returns empty scale for document with no text elements', () => {
    document.body.innerHTML = '';
    const result = extractTypeScale();
    expect(result.scale).toHaveLength(0);
  });

  test('handles rem values by storing raw value', () => {
    addEl('p', { 'font-size': '1rem' });
    const result = extractTypeScale();
    const step = result.scale.find(s => s.value === '1rem');
    expect(step).toBeDefined();
  });

  test('scale step has a remValue field (null if not rem)', () => {
    addEl('p', { 'font-size': '16px' });
    const result = extractTypeScale();
    expect(result.scale[0]).toHaveProperty('remValue');
  });

  test('remValue is a number for rem values', () => {
    addEl('p', { 'font-size': '1.5rem' });
    const result = extractTypeScale();
    const step = result.scale.find(s => s.value === '1.5rem');
    expect(step.remValue).toBe(1.5);
  });
});
