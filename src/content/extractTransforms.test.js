/**
 * Task: bd993345 — Extract transform property values from computed styles
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractTransforms, parseTransformFunctions } from './extractTransforms.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('parseTransformFunctions — parse transform value into function names', () => {
  test('returns an empty array for "none"', () => {
    expect(parseTransformFunctions('none')).toEqual([]);
  });

  test('returns empty array for empty string', () => {
    expect(parseTransformFunctions('')).toEqual([]);
  });

  test('detects translateX', () => {
    expect(parseTransformFunctions('translateX(10px)')).toContain('translateX');
  });

  test('detects translateY', () => {
    expect(parseTransformFunctions('translateY(20px)')).toContain('translateY');
  });

  test('detects translate', () => {
    expect(parseTransformFunctions('translate(10px, 20px)')).toContain('translate');
  });

  test('detects rotate', () => {
    expect(parseTransformFunctions('rotate(45deg)')).toContain('rotate');
  });

  test('detects scale', () => {
    expect(parseTransformFunctions('scale(0.8)')).toContain('scale');
  });

  test('detects scaleX and scaleY', () => {
    const fns = parseTransformFunctions('scaleX(1.1) scaleY(0.9)');
    expect(fns).toContain('scaleX');
    expect(fns).toContain('scaleY');
  });

  test('detects skewX', () => {
    expect(parseTransformFunctions('skewX(10deg)')).toContain('skewX');
  });

  test('detects matrix', () => {
    expect(parseTransformFunctions('matrix(1,0,0,1,10,20)')).toContain('matrix');
  });

  test('detects matrix3d', () => {
    expect(parseTransformFunctions('matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,10,20,0,1)')).toContain('matrix3d');
  });

  test('detects multiple functions in one value', () => {
    const fns = parseTransformFunctions('translateX(10px) rotate(45deg) scale(1.2)');
    expect(fns).toContain('translateX');
    expect(fns).toContain('rotate');
    expect(fns).toContain('scale');
  });
});

describe('extractTransforms — extract transform values from DOM elements', () => {
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

  function addEl(tag, styleProps = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(styleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a transforms array', () => {
    const result = extractTransforms();
    expect(result).toHaveProperty('transforms');
    expect(Array.isArray(result.transforms)).toBe(true);
  });

  test('detects an element with a translateX transform', () => {
    addEl('div', { transform: 'translateX(10px)' });
    const { transforms } = extractTransforms();
    expect(transforms.some(t => t.functions.includes('translateX'))).toBe(true);
  });

  test('each entry has value field with original transform string', () => {
    addEl('div', { transform: 'rotate(45deg)' });
    const { transforms } = extractTransforms();
    expect(transforms[0]).toHaveProperty('value');
    expect(transforms[0].value).toBe('rotate(45deg)');
  });

  test('each entry has functions array', () => {
    addEl('div', { transform: 'scale(0.9)' });
    const { transforms } = extractTransforms();
    expect(Array.isArray(transforms[0].functions)).toBe(true);
    expect(transforms[0].functions).toContain('scale');
  });

  test('skips elements with transform "none"', () => {
    addEl('div', { transform: 'none' });
    const { transforms } = extractTransforms();
    expect(transforms).toHaveLength(0);
  });

  test('skips invisible elements', () => {
    addEl('div', { display: 'none', transform: 'scale(1.2)' });
    const { transforms } = extractTransforms();
    expect(transforms).toHaveLength(0);
  });

  test('deduplicates identical transform values', () => {
    addEl('div',  { transform: 'translateX(10px)' });
    addEl('span', { transform: 'translateX(10px)' });
    const { transforms } = extractTransforms();
    expect(transforms).toHaveLength(1);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { transforms } = extractTransforms();
    expect(transforms).toHaveLength(0);
  });
});
