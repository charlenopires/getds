/**
 * Task: 8a78f54b — Extract CSS animation shorthand properties from computed styles
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractCssAnimations } from './extractCssAnimations.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extractCssAnimations — extract CSS animation sub-properties from computed styles', () => {
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

  function animStyle(overrides = {}) {
    return {
      'animation-name': 'fadeIn',
      'animation-duration': '300ms',
      'animation-timing-function': 'ease',
      'animation-delay': '0s',
      'animation-iteration-count': '1',
      'animation-direction': 'normal',
      'animation-fill-mode': 'none',
      ...overrides,
    };
  }

  test('returns an object with an animations array', () => {
    const result = extractCssAnimations();
    expect(result).toHaveProperty('animations');
    expect(Array.isArray(result.animations)).toBe(true);
  });

  test('detects an element with an animation-name', () => {
    addEl('div', animStyle());
    const { animations } = extractCssAnimations();
    expect(animations.length).toBeGreaterThanOrEqual(1);
  });

  test('each entry has name field', () => {
    addEl('div', animStyle({ 'animation-name': 'slideUp' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('name');
    expect(animations[0].name).toBe('slideUp');
  });

  test('each entry has duration field', () => {
    addEl('div', animStyle({ 'animation-duration': '500ms' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('duration');
    expect(animations[0].duration).toBe('500ms');
  });

  test('each entry has timingFunction field', () => {
    addEl('div', animStyle({ 'animation-timing-function': 'ease-in-out' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('timingFunction');
    expect(animations[0].timingFunction).toBe('ease-in-out');
  });

  test('each entry has delay field', () => {
    addEl('div', animStyle({ 'animation-delay': '100ms' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('delay');
    expect(animations[0].delay).toBe('100ms');
  });

  test('each entry has iterationCount field', () => {
    addEl('div', animStyle({ 'animation-iteration-count': 'infinite' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('iterationCount');
    expect(animations[0].iterationCount).toBe('infinite');
  });

  test('each entry has direction field', () => {
    addEl('div', animStyle({ 'animation-direction': 'alternate' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('direction');
    expect(animations[0].direction).toBe('alternate');
  });

  test('each entry has fillMode field', () => {
    addEl('div', animStyle({ 'animation-fill-mode': 'forwards' }));
    const { animations } = extractCssAnimations();
    expect(animations[0]).toHaveProperty('fillMode');
    expect(animations[0].fillMode).toBe('forwards');
  });

  test('skips elements with animation-name "none"', () => {
    addEl('div', { 'animation-name': 'none' });
    const { animations } = extractCssAnimations();
    expect(animations).toHaveLength(0);
  });

  test('skips elements with no animation-name', () => {
    addEl('div', {});
    const { animations } = extractCssAnimations();
    expect(animations).toHaveLength(0);
  });

  test('skips invisible elements', () => {
    addEl('div', { display: 'none', ...animStyle() });
    const { animations } = extractCssAnimations();
    expect(animations).toHaveLength(0);
  });

  test('deduplicates identical animation signatures', () => {
    const style = animStyle();
    addEl('div', style);
    addEl('span', style);
    const { animations } = extractCssAnimations();
    expect(animations).toHaveLength(1);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { animations } = extractCssAnimations();
    expect(animations).toHaveLength(0);
  });
});
