/**
 * Task: 3c240874 — Detect navigation components via semantic HTML and ARIA landmarks
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectNavigation } from './detectNavigation.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('detectNavigation — detect navigation components', () => {
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

  test('returns an object with a navComponents array', () => {
    const result = detectNavigation();
    expect(result).toHaveProperty('navComponents');
    expect(Array.isArray(result.navComponents)).toBe(true);
  });

  test('detects <nav> element', () => {
    addEl('nav');
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.tag === 'nav')).toBe(true);
  });

  test('detects <header> element', () => {
    addEl('header');
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.tag === 'header')).toBe(true);
  });

  test('detects element with role="banner" (header landmark)', () => {
    addEl('div', { role: 'banner' });
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.role === 'banner')).toBe(true);
  });

  test('detects <aside> element (sidebar)', () => {
    addEl('aside');
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.tag === 'aside')).toBe(true);
  });

  test('detects element with role="complementary" (sidebar landmark)', () => {
    addEl('div', { role: 'complementary' });
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.role === 'complementary')).toBe(true);
  });

  test('detects role="navigation" landmark', () => {
    addEl('div', { role: 'navigation' });
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.role === 'navigation')).toBe(true);
  });

  test('detects breadcrumb via aria-label containing "breadcrumb"', () => {
    addEl('nav', { 'aria-label': 'breadcrumb' });
    const { navComponents } = detectNavigation();
    const found = navComponents.find(n => n.navType === 'breadcrumb');
    expect(found).toBeDefined();
  });

  test('detects breadcrumb via class name', () => {
    addEl('ol', { class: 'breadcrumb' });
    const { navComponents } = detectNavigation();
    const found = navComponents.find(n => n.navType === 'breadcrumb');
    expect(found).toBeDefined();
  });

  test('detects tablist via role="tablist"', () => {
    addEl('div', { role: 'tablist' });
    const { navComponents } = detectNavigation();
    expect(navComponents.some(n => n.role === 'tablist')).toBe(true);
  });

  test('detects pagination by class pattern', () => {
    addEl('nav', { class: 'pagination' });
    const { navComponents } = detectNavigation();
    const found = navComponents.find(n => n.navType === 'pagination');
    expect(found).toBeDefined();
  });

  test('detects pagination by aria-label containing "pagination"', () => {
    addEl('nav', { 'aria-label': 'pagination' });
    const { navComponents } = detectNavigation();
    const found = navComponents.find(n => n.navType === 'pagination');
    expect(found).toBeDefined();
  });

  test('each entry has tag, role, classes, and navType fields', () => {
    addEl('nav');
    const { navComponents } = detectNavigation();
    const entry = navComponents[0];
    expect(entry).toHaveProperty('tag');
    expect(entry).toHaveProperty('role');
    expect(entry).toHaveProperty('classes');
    expect(entry).toHaveProperty('navType');
  });

  test('navType is "nav" for a plain <nav>', () => {
    addEl('nav');
    const { navComponents } = detectNavigation();
    const entry = navComponents.find(n => n.tag === 'nav' && !n.classes.includes('pagination') && !n.classes.includes('breadcrumb'));
    expect(entry.navType).toBe('nav');
  });

  test('navType is "header" for <header>', () => {
    addEl('header');
    const { navComponents } = detectNavigation();
    expect(navComponents.find(n => n.tag === 'header').navType).toBe('header');
  });

  test('navType is "sidebar" for <aside>', () => {
    addEl('aside');
    const { navComponents } = detectNavigation();
    expect(navComponents.find(n => n.tag === 'aside').navType).toBe('sidebar');
  });

  test('navType is "tabs" for role=tablist', () => {
    addEl('div', { role: 'tablist' });
    const { navComponents } = detectNavigation();
    expect(navComponents.find(n => n.role === 'tablist').navType).toBe('tabs');
  });

  test('skips invisible navigation elements', () => {
    addEl('nav', {}, { display: 'none' });
    const { navComponents } = detectNavigation();
    expect(navComponents).toHaveLength(0);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { navComponents } = detectNavigation();
    expect(navComponents).toHaveLength(0);
  });
});
