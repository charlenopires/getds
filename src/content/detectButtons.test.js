/**
 * Task: 6ce964c9 — Detect button components via tags, class patterns, and interactive styles
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectButtons } from './detectButtons.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    cursor: props.cursor ?? 'default',
    getPropertyValue(name) {
      return props[name] ?? '';
    },
  };
}

describe('detectButtons — detect button components on the page', () => {
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

  function addEl(tag, attrs = {}, fakeStyleProps = {}) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    el.__fakeStyle__ = fakeStyle(fakeStyleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a buttons array', () => {
    const result = detectButtons();
    expect(result).toHaveProperty('buttons');
    expect(Array.isArray(result.buttons)).toBe(true);
  });

  test('detects a native <button> element', () => {
    addEl('button', {}, { cursor: 'pointer' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.tag === 'button')).toBe(true);
  });

  test('detects <input type="submit">', () => {
    addEl('input', { type: 'submit' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.tag === 'input' && b.type === 'submit')).toBe(true);
  });

  test('detects <input type="button">', () => {
    addEl('input', { type: 'button' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.type === 'button')).toBe(true);
  });

  test('detects <input type="reset">', () => {
    addEl('input', { type: 'reset' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.type === 'reset')).toBe(true);
  });

  test('detects <a role="button">', () => {
    addEl('a', { role: 'button', href: '#' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.tag === 'a' && b.role === 'button')).toBe(true);
  });

  test('detects element with class "btn"', () => {
    addEl('div', { class: 'btn' }, { cursor: 'pointer' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.classes.includes('btn'))).toBe(true);
  });

  test('detects element with class "button"', () => {
    addEl('span', { class: 'button primary' }, { cursor: 'pointer' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.classes.includes('button'))).toBe(true);
  });

  test('detects element with class "cta"', () => {
    addEl('div', { class: 'cta' }, { cursor: 'pointer' });
    const { buttons } = detectButtons();
    expect(buttons.some(b => b.classes.includes('cta'))).toBe(true);
  });

  test('each button entry has tag, classes, and role fields', () => {
    addEl('button');
    const { buttons } = detectButtons();
    const entry = buttons[0];
    expect(entry).toHaveProperty('tag');
    expect(entry).toHaveProperty('classes');
    expect(entry).toHaveProperty('role');
  });

  test('classes is an array of class names', () => {
    addEl('button', { class: 'btn btn-primary' });
    const { buttons } = detectButtons();
    const entry = buttons.find(b => b.tag === 'button');
    expect(Array.isArray(entry.classes)).toBe(true);
    expect(entry.classes).toContain('btn');
    expect(entry.classes).toContain('btn-primary');
  });

  test('does not detect invisible button elements', () => {
    addEl('button', {}, { display: 'none' });
    const { buttons } = detectButtons();
    expect(buttons).toHaveLength(0);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { buttons } = detectButtons();
    expect(buttons).toHaveLength(0);
  });

  test('does not detect a plain div with no button signals', () => {
    addEl('div', { class: 'card' });
    const { buttons } = detectButtons();
    expect(buttons.every(b => !b.classes.includes('card'))).toBe(true);
  });

  test('detects multiple button types on the same page', () => {
    addEl('button');
    addEl('a', { role: 'button' });
    addEl('div', { class: 'btn' }, { cursor: 'pointer' });
    const { buttons } = detectButtons();
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});
