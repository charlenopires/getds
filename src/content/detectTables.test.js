/**
 * Task: ac0b50ef — Detect table components including data tables with sortable headers
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectTables } from './detectTables.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('detectTables — detect table components', () => {
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

  function tag(name, attrs = {}, children = []) {
    const el = document.createElement(name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.__fakeStyle__ = fakeStyle();
    for (const child of children) el.appendChild(child);
    return el;
  }

  function buildNativeTable({ sortable = false } = {}) {
    const thAttrs = sortable ? { 'aria-sort': 'none' } : {};
    const table = tag('table', {}, [
      tag('thead', {}, [
        tag('tr', {}, [
          tag('th', thAttrs),
          tag('th', thAttrs),
        ]),
      ]),
      tag('tbody', {}, [
        tag('tr', {}, [tag('td'), tag('td')]),
      ]),
    ]);
    document.body.appendChild(table);
    return table;
  }

  test('returns an object with a tables array', () => {
    const result = detectTables();
    expect(result).toHaveProperty('tables');
    expect(Array.isArray(result.tables)).toBe(true);
  });

  test('detects a native <table> element', () => {
    buildNativeTable();
    const { tables } = detectTables();
    expect(tables.some(t => t.tag === 'table')).toBe(true);
  });

  test('detects element with role="grid"', () => {
    const grid = tag('div', { role: 'grid' });
    document.body.appendChild(grid);
    const { tables } = detectTables();
    expect(tables.some(t => t.role === 'grid')).toBe(true);
  });

  test('detects element with role="table"', () => {
    const tbl = tag('div', { role: 'table' });
    document.body.appendChild(tbl);
    const { tables } = detectTables();
    expect(tables.some(t => t.role === 'table')).toBe(true);
  });

  test('marks table as sortable when th has aria-sort attribute', () => {
    buildNativeTable({ sortable: true });
    const { tables } = detectTables();
    expect(tables.some(t => t.isSortable === true)).toBe(true);
  });

  test('marks table as not sortable when no aria-sort present', () => {
    buildNativeTable({ sortable: false });
    const { tables } = detectTables();
    expect(tables.find(t => t.tag === 'table').isSortable).toBe(false);
  });

  test('each entry has tag, role, classes, isSortable, and detectionMethod fields', () => {
    buildNativeTable();
    const { tables } = detectTables();
    const entry = tables[0];
    expect(entry).toHaveProperty('tag');
    expect(entry).toHaveProperty('role');
    expect(entry).toHaveProperty('classes');
    expect(entry).toHaveProperty('isSortable');
    expect(entry).toHaveProperty('detectionMethod');
  });

  test('detectionMethod is "native-table" for <table>', () => {
    buildNativeTable();
    const { tables } = detectTables();
    expect(tables.find(t => t.tag === 'table').detectionMethod).toBe('native-table');
  });

  test('detectionMethod is "aria-role" for role=grid', () => {
    document.body.appendChild(tag('div', { role: 'grid' }));
    const { tables } = detectTables();
    expect(tables.find(t => t.role === 'grid').detectionMethod).toBe('aria-role');
  });

  test('detects sortable header when th contains a button child', () => {
    const btn = tag('button');
    const th = tag('th', {}, [btn]);
    const table = tag('table', {}, [
      tag('thead', {}, [tag('tr', {}, [th])]),
      tag('tbody', {}, [tag('tr', {}, [tag('td')])]),
    ]);
    document.body.appendChild(table);
    const { tables } = detectTables();
    expect(tables.find(t => t.tag === 'table').isSortable).toBe(true);
  });

  test('skips invisible table elements', () => {
    const tbl = tag('table');
    tbl.__fakeStyle__ = fakeStyle({ display: 'none' });
    document.body.appendChild(tbl);
    const { tables } = detectTables();
    expect(tables).toHaveLength(0);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { tables } = detectTables();
    expect(tables).toHaveLength(0);
  });
});
