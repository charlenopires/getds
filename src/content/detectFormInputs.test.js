/**
 * Task: 99b21ccf — Detect form input components
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectFormInputs } from './detectFormInputs.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('detectFormInputs — detect form input components', () => {
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
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.__fakeStyle__ = fakeStyle(fakeStyleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with an inputs array', () => {
    const result = detectFormInputs();
    expect(result).toHaveProperty('inputs');
    expect(Array.isArray(result.inputs)).toBe(true);
  });

  test('detects input[type=text]', () => {
    addEl('input', { type: 'text' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.tag === 'input' && i.type === 'text')).toBe(true);
  });

  test('detects input[type=email]', () => {
    addEl('input', { type: 'email' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'email')).toBe(true);
  });

  test('detects input[type=password]', () => {
    addEl('input', { type: 'password' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'password')).toBe(true);
  });

  test('detects input[type=number]', () => {
    addEl('input', { type: 'number' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'number')).toBe(true);
  });

  test('detects input[type=search]', () => {
    addEl('input', { type: 'search' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'search')).toBe(true);
  });

  test('detects <textarea>', () => {
    addEl('textarea');
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.tag === 'textarea')).toBe(true);
  });

  test('detects <select>', () => {
    addEl('select');
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.tag === 'select')).toBe(true);
  });

  test('detects input[type=checkbox]', () => {
    addEl('input', { type: 'checkbox' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'checkbox')).toBe(true);
  });

  test('detects input[type=radio]', () => {
    addEl('input', { type: 'radio' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'radio')).toBe(true);
  });

  test('detects input[type=range] (slider)', () => {
    addEl('input', { type: 'range' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'range')).toBe(true);
  });

  test('detects input[type=date]', () => {
    addEl('input', { type: 'date' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'date')).toBe(true);
  });

  test('detects input[type=file]', () => {
    addEl('input', { type: 'file' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.type === 'file')).toBe(true);
  });

  test('detects custom toggle via role=switch', () => {
    addEl('div', { role: 'switch', 'aria-checked': 'false' });
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.role === 'switch')).toBe(true);
  });

  test('each entry has tag, type, role, and classes fields', () => {
    addEl('input', { type: 'text' });
    const { inputs } = detectFormInputs();
    const entry = inputs[0];
    expect(entry).toHaveProperty('tag');
    expect(entry).toHaveProperty('type');
    expect(entry).toHaveProperty('role');
    expect(entry).toHaveProperty('classes');
  });

  test('classes is an array', () => {
    addEl('input', { type: 'text', class: 'form-control' });
    const { inputs } = detectFormInputs();
    expect(Array.isArray(inputs[0].classes)).toBe(true);
    expect(inputs[0].classes).toContain('form-control');
  });

  test('skips invisible inputs', () => {
    addEl('input', { type: 'text' }, { display: 'none' });
    const { inputs } = detectFormInputs();
    expect(inputs).toHaveLength(0);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { inputs } = detectFormInputs();
    expect(inputs).toHaveLength(0);
  });

  test('detects multiple different input types on same page', () => {
    addEl('input', { type: 'text' });
    addEl('input', { type: 'checkbox' });
    addEl('select');
    addEl('textarea');
    const { inputs } = detectFormInputs();
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });

  test('does not detect button input types', () => {
    addEl('input', { type: 'submit' });
    addEl('input', { type: 'button' });
    addEl('input', { type: 'reset' });
    const { inputs } = detectFormInputs();
    expect(inputs.every(i => !['submit', 'button', 'reset'].includes(i.type))).toBe(true);
  });

  test('input with no type attribute is detected as text input', () => {
    addEl('input', {});
    const { inputs } = detectFormInputs();
    expect(inputs.some(i => i.tag === 'input')).toBe(true);
  });
});
