import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extract3DSceneProperties } from './extract3DSceneProperties.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extract3DSceneProperties', () => {
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

  function addEl(tag, styleProps = {}, opts = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(styleProps);
    if (opts.id) el.id = opts.id;
    if (opts.className) el.className = opts.className;
    if (opts.children) {
      for (let i = 0; i < opts.children; i++) {
        el.appendChild(document.createElement('div'));
      }
    }
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a css3DScenes array', () => {
    const result = extract3DSceneProperties();
    expect(result).toHaveProperty('css3DScenes');
    expect(Array.isArray(result.css3DScenes)).toBe(true);
  });

  test('returns empty array when no 3D scene properties exist', () => {
    addEl('div');
    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toEqual([]);
  });

  test('detects perspective property', () => {
    addEl('div', { perspective: '1000px' }, { className: 'card-flip', children: 2 });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toHaveLength(1);
    expect(css3DScenes[0].perspective).toBe('1000px');
  });

  test('detects transform-style preserve-3d', () => {
    addEl('div', { 'transform-style': 'preserve-3d' }, { id: 'scene' });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toHaveLength(1);
    expect(css3DScenes[0].transformStyle).toBe('preserve-3d');
    expect(css3DScenes[0].selector).toBe('#scene');
  });

  test('detects backface-visibility hidden', () => {
    addEl('div', { 'backface-visibility': 'hidden' });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toHaveLength(1);
    expect(css3DScenes[0].backfaceVisibility).toBe('hidden');
  });

  test('detects non-default perspective-origin', () => {
    addEl('div', { perspective: '800px', 'perspective-origin': '25% 75%' });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toHaveLength(1);
    expect(css3DScenes[0].perspectiveOrigin).toBe('25% 75%');
  });

  test('skips elements with all default values', () => {
    addEl('div', {
      perspective: 'none',
      'perspective-origin': '50% 50%',
      'transform-style': 'flat',
      'backface-visibility': 'visible',
    });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toEqual([]);
  });

  test('skips hidden elements', () => {
    addEl('div', {
      display: 'none',
      perspective: '1000px',
    });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes).toEqual([]);
  });

  test('includes childCount', () => {
    addEl('div', { 'transform-style': 'preserve-3d' }, { children: 3 });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes[0].childCount).toBe(3);
  });

  test('nulls out default values in output', () => {
    addEl('div', { perspective: '500px' });

    const { css3DScenes } = extract3DSceneProperties();
    expect(css3DScenes[0].perspective).toBe('500px');
    expect(css3DScenes[0].perspectiveOrigin).toBeNull();
    expect(css3DScenes[0].transformStyle).toBeNull();
    expect(css3DScenes[0].backfaceVisibility).toBeNull();
  });
});
