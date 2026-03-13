/**
 * Task: 06f2132c — Document each component anatomy with constituent HTML elements and computed styles
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractComponentAnatomy } from './extractComponentAnatomy.js';

const ANATOMY_STYLE_KEYS = ['color', 'background-color', 'font-size', 'border', 'padding', 'border-radius'];

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extractComponentAnatomy — document component DOM subtree and styles', () => {
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

  function buildButton() {
    const btn = document.createElement('button');
    btn.__fakeStyle__ = fakeStyle({
      'color': 'white',
      'background-color': 'blue',
      'font-size': '16px',
      'border': '1px solid blue',
      'padding': '8px 16px',
      'border-radius': '4px',
    });

    const span = document.createElement('span');
    span.__fakeStyle__ = fakeStyle({ 'font-size': '16px' });
    btn.appendChild(span);

    document.body.appendChild(btn);
    return btn;
  }

  test('returns an anatomy object with a tag field', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy).toHaveProperty('tag');
    expect(anatomy.tag).toBe('button');
  });

  test('returns an anatomy object with a classes field', () => {
    const btn = buildButton();
    btn.setAttribute('class', 'btn btn-primary');
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy).toHaveProperty('classes');
    expect(Array.isArray(anatomy.classes)).toBe(true);
  });

  test('returns an anatomy object with a styles field', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy).toHaveProperty('styles');
    expect(typeof anatomy.styles).toBe('object');
  });

  test('styles includes color property', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy.styles).toHaveProperty('color');
    expect(anatomy.styles['color']).toBe('white');
  });

  test('styles includes background-color property', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy.styles['background-color']).toBe('blue');
  });

  test('styles includes font-size, border, padding, border-radius', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    for (const key of ANATOMY_STYLE_KEYS) {
      expect(anatomy.styles).toHaveProperty(key);
    }
  });

  test('returns a children array', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy).toHaveProperty('children');
    expect(Array.isArray(anatomy.children)).toBe(true);
  });

  test('children contains anatomy of direct child elements', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy.children.length).toBeGreaterThanOrEqual(1);
    expect(anatomy.children[0]).toHaveProperty('tag');
  });

  test('children element has its own styles', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy.children[0]).toHaveProperty('styles');
  });

  test('children elements have a classes array', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(Array.isArray(anatomy.children[0].classes)).toBe(true);
  });

  test('element with no children returns empty children array', () => {
    const el = document.createElement('input');
    el.__fakeStyle__ = fakeStyle();
    document.body.appendChild(el);
    const anatomy = extractComponentAnatomy(el);
    expect(anatomy.children).toHaveLength(0);
  });

  test('classes reflects actual class names', () => {
    const btn = document.createElement('button');
    btn.setAttribute('class', 'btn btn-lg');
    btn.__fakeStyle__ = fakeStyle();
    document.body.appendChild(btn);
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy.classes).toContain('btn');
    expect(anatomy.classes).toContain('btn-lg');
  });

  test('returns role field from element attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'button');
    el.__fakeStyle__ = fakeStyle();
    document.body.appendChild(el);
    const anatomy = extractComponentAnatomy(el);
    expect(anatomy).toHaveProperty('role');
    expect(anatomy.role).toBe('button');
  });

  test('role is null when element has no role attribute', () => {
    const btn = buildButton();
    const anatomy = extractComponentAnatomy(btn);
    expect(anatomy.role).toBeNull();
  });
});
