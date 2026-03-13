/**
 * Task: 3b2db912 — Detect modal/dialog components via ARIA roles and overlay CSS patterns
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectModals } from './detectModals.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    position: props.position ?? 'static',
    zIndex: props.zIndex ?? 'auto',
    getPropertyValue(name) {
      const map = {
        'position': this.position,
        'z-index': this.zIndex,
      };
      return map[name] ?? props[name] ?? '';
    },
  };
}

describe('detectModals — detect modal/dialog components', () => {
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

  function addEl(tag, attrs = {}, styleProps = {}) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.__fakeStyle__ = fakeStyle(styleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a modals array', () => {
    const result = detectModals();
    expect(result).toHaveProperty('modals');
    expect(Array.isArray(result.modals)).toBe(true);
  });

  test('detects element with role="dialog"', () => {
    addEl('div', { role: 'dialog' });
    const { modals } = detectModals();
    expect(modals.some(m => m.role === 'dialog')).toBe(true);
  });

  test('detects element with aria-modal="true"', () => {
    addEl('div', { 'aria-modal': 'true' });
    const { modals } = detectModals();
    expect(modals.some(m => m.ariaModal === true)).toBe(true);
  });

  test('detects native <dialog> element', () => {
    addEl('dialog');
    const { modals } = detectModals();
    expect(modals.some(m => m.tag === 'dialog')).toBe(true);
  });

  test('detects element with role="alertdialog"', () => {
    addEl('div', { role: 'alertdialog' });
    const { modals } = detectModals();
    expect(modals.some(m => m.role === 'alertdialog')).toBe(true);
  });

  test('detects overlay by position:fixed and high z-index', () => {
    addEl('div', {}, { position: 'fixed', zIndex: '1000' });
    const { modals } = detectModals();
    expect(modals.some(m => m.detectionMethod === 'overlay-fixed')).toBe(true);
  });

  test('detects overlay by position:absolute and high z-index', () => {
    addEl('div', {}, { position: 'absolute', zIndex: '200' });
    const { modals } = detectModals();
    expect(modals.some(m => m.detectionMethod === 'overlay-absolute')).toBe(true);
  });

  test('does not detect position:fixed with low z-index as modal', () => {
    addEl('div', {}, { position: 'fixed', zIndex: '1' });
    const { modals } = detectModals();
    expect(modals.every(m => m.detectionMethod !== 'overlay-fixed')).toBe(true);
  });

  test('does not detect static positioned element as overlay modal', () => {
    addEl('div', {}, { position: 'static', zIndex: '1000' });
    const { modals } = detectModals();
    expect(modals.filter(m => m.detectionMethod?.startsWith('overlay'))).toHaveLength(0);
  });

  test('each entry has tag, role, ariaModal, classes, and detectionMethod fields', () => {
    addEl('div', { role: 'dialog' });
    const { modals } = detectModals();
    const entry = modals[0];
    expect(entry).toHaveProperty('tag');
    expect(entry).toHaveProperty('role');
    expect(entry).toHaveProperty('ariaModal');
    expect(entry).toHaveProperty('classes');
    expect(entry).toHaveProperty('detectionMethod');
  });

  test('detectionMethod is "aria-role" for role=dialog', () => {
    addEl('div', { role: 'dialog' });
    const { modals } = detectModals();
    expect(modals.find(m => m.role === 'dialog').detectionMethod).toBe('aria-role');
  });

  test('detectionMethod is "dialog-tag" for native <dialog>', () => {
    addEl('dialog');
    const { modals } = detectModals();
    expect(modals.find(m => m.tag === 'dialog').detectionMethod).toBe('dialog-tag');
  });

  test('skips invisible elements', () => {
    addEl('div', { role: 'dialog' }, { display: 'none' });
    const { modals } = detectModals();
    expect(modals).toHaveLength(0);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { modals } = detectModals();
    expect(modals).toHaveLength(0);
  });
});
