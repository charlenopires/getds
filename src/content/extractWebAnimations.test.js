/**
 * Task: 02636083 — Capture JS-driven animations via element.getAnimations()
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractWebAnimations } from './extractWebAnimations.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

function makeTiming(overrides = {}) {
  return {
    duration: 300,
    delay: 0,
    easing: 'ease',
    fill: 'none',
    iterations: 1,
    direction: 'normal',
    ...overrides,
  };
}

function makeAnimation(id, timingOverrides = {}) {
  return {
    id,
    effect: {
      getTiming: () => makeTiming(timingOverrides),
    },
  };
}

describe('extractWebAnimations — capture Web Animations API instances', () => {
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

  function addEl(tag, animations = [], styleProps = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(styleProps);
    el.getAnimations = () => animations;
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a webAnimations array', () => {
    const result = extractWebAnimations();
    expect(result).toHaveProperty('webAnimations');
    expect(Array.isArray(result.webAnimations)).toBe(true);
  });

  test('returns empty array when no elements have animations', () => {
    addEl('div', []);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations).toHaveLength(0);
  });

  test('captures an animation from an element', () => {
    addEl('div', [makeAnimation('anim-1')]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations).toHaveLength(1);
  });

  test('each entry has id field', () => {
    addEl('div', [makeAnimation('my-anim')]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0]).toHaveProperty('id');
    expect(webAnimations[0].id).toBe('my-anim');
  });

  test('each entry has duration field from getTiming()', () => {
    addEl('div', [makeAnimation('a', { duration: 500 })]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0]).toHaveProperty('duration');
    expect(webAnimations[0].duration).toBe(500);
  });

  test('each entry has delay field', () => {
    addEl('div', [makeAnimation('a', { delay: 100 })]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0].delay).toBe(100);
  });

  test('each entry has easing field', () => {
    addEl('div', [makeAnimation('a', { easing: 'ease-in-out' })]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0].easing).toBe('ease-in-out');
  });

  test('each entry has fill field', () => {
    addEl('div', [makeAnimation('a', { fill: 'forwards' })]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0].fill).toBe('forwards');
  });

  test('each entry has iterations field', () => {
    addEl('div', [makeAnimation('a', { iterations: Infinity })]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0].iterations).toBe(Infinity);
  });

  test('each entry has direction field', () => {
    addEl('div', [makeAnimation('a', { direction: 'alternate' })]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations[0].direction).toBe('alternate');
  });

  test('captures animations from multiple elements', () => {
    addEl('div',  [makeAnimation('a1')]);
    addEl('span', [makeAnimation('a2')]);
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations).toHaveLength(2);
  });

  test('handles elements without getAnimations gracefully', () => {
    const el = document.createElement('div');
    el.__fakeStyle__ = fakeStyle();
    // no getAnimations defined
    document.body.appendChild(el);
    expect(() => extractWebAnimations()).not.toThrow();
  });

  test('skips invisible elements', () => {
    addEl('div', [makeAnimation('a')], { display: 'none' });
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations).toHaveLength(0);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { webAnimations } = extractWebAnimations();
    expect(webAnimations).toHaveLength(0);
  });
});
