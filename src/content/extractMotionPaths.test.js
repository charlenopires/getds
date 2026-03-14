import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractMotionPaths } from './extractMotionPaths.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extractMotionPaths', () => {
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

  test('returns an object with a motionPaths array', () => {
    const result = extractMotionPaths();
    expect(result).toHaveProperty('motionPaths');
    expect(Array.isArray(result.motionPaths)).toBe(true);
  });

  test('returns empty array when no motion paths exist', () => {
    addEl('div');
    const { motionPaths } = extractMotionPaths();
    expect(motionPaths).toEqual([]);
  });

  test('extracts offset-path from visible elements', () => {
    addEl('div', {
      'offset-path': 'path("M 0 0 L 100 100")',
      'offset-distance': '50%',
      'offset-rotate': 'auto',
    });

    const { motionPaths } = extractMotionPaths();
    expect(motionPaths).toHaveLength(1);
    expect(motionPaths[0].path).toContain('path');
    expect(motionPaths[0].distance).toBe('50%');
    expect(motionPaths[0].rotate).toBe('auto');
  });

  test('skips hidden elements', () => {
    addEl('div', {
      display: 'none',
      'offset-path': 'path("M 0 0 L 100 100")',
    });

    const { motionPaths } = extractMotionPaths();
    expect(motionPaths).toEqual([]);
  });

  test('skips elements with offset-path none', () => {
    addEl('div', { 'offset-path': 'none' });
    const { motionPaths } = extractMotionPaths();
    expect(motionPaths).toEqual([]);
  });

  test('each entry has selector, path, distance, rotate', () => {
    addEl('div', {
      'offset-path': 'circle(50%)',
      'offset-distance': '25%',
      'offset-rotate': '45deg',
    });

    const { motionPaths } = extractMotionPaths();
    expect(motionPaths[0]).toHaveProperty('selector');
    expect(motionPaths[0]).toHaveProperty('path');
    expect(motionPaths[0]).toHaveProperty('distance');
    expect(motionPaths[0]).toHaveProperty('rotate');
  });

  test('defaults distance to 0% and rotate to auto', () => {
    addEl('div', { 'offset-path': 'ray(45deg)' });

    const { motionPaths } = extractMotionPaths();
    expect(motionPaths[0].distance).toBe('0%');
    expect(motionPaths[0].rotate).toBe('auto');
  });
});
