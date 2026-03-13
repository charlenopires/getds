/**
 * Task: 6b3ce3f0 — Map animations/transitions to DOM elements and inferred components
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect } from 'bun:test';
import { buildElementContext, inferComponentType } from './mapAnimationToElement.js';

// Helper: fake element with tag, classes, role
function makeEl(tag, classes = [], role = null) {
  return {
    tagName: tag.toUpperCase(),
    className: classes.join(' '),
    getAttribute: (attr) => attr === 'role' ? role : null,
  };
}

describe('inferComponentType — infer component from element context', () => {
  test('identifies button tag as "button"', () => {
    expect(inferComponentType(makeEl('button'))).toBe('button');
  });

  test('identifies input tag as "input"', () => {
    expect(inferComponentType(makeEl('input'))).toBe('input');
  });

  test('identifies nav tag as "nav"', () => {
    expect(inferComponentType(makeEl('nav'))).toBe('nav');
  });

  test('identifies a[role=button] as "button"', () => {
    expect(inferComponentType(makeEl('a', [], 'button'))).toBe('button');
  });

  test('identifies role=dialog as "modal"', () => {
    expect(inferComponentType(makeEl('div', [], 'dialog'))).toBe('modal');
  });

  test('identifies table tag as "table"', () => {
    expect(inferComponentType(makeEl('table'))).toBe('table');
  });

  test('identifies element with btn class as "button"', () => {
    expect(inferComponentType(makeEl('div', ['btn']))).toBe('button');
  });

  test('identifies element with card class as "card"', () => {
    expect(inferComponentType(makeEl('div', ['card']))).toBe('card');
  });

  test('returns "unknown" for generic div with no signals', () => {
    expect(inferComponentType(makeEl('div'))).toBe('unknown');
  });

  test('returns "unknown" for span with no signals', () => {
    expect(inferComponentType(makeEl('span'))).toBe('unknown');
  });
});

describe('buildElementContext — build context object from a DOM element', () => {
  test('returns an object with tag field', () => {
    const ctx = buildElementContext(makeEl('button'));
    expect(ctx).toHaveProperty('tag');
    expect(ctx.tag).toBe('button');
  });

  test('returns an object with classes array', () => {
    const ctx = buildElementContext(makeEl('div', ['btn', 'btn-primary']));
    expect(ctx).toHaveProperty('classes');
    expect(ctx.classes).toContain('btn');
    expect(ctx.classes).toContain('btn-primary');
  });

  test('returns an object with role field', () => {
    const ctx = buildElementContext(makeEl('div', [], 'dialog'));
    expect(ctx).toHaveProperty('role');
    expect(ctx.role).toBe('dialog');
  });

  test('role is null when not set', () => {
    const ctx = buildElementContext(makeEl('button'));
    expect(ctx.role).toBeNull();
  });

  test('returns an object with componentType field', () => {
    const ctx = buildElementContext(makeEl('button'));
    expect(ctx).toHaveProperty('componentType');
    expect(ctx.componentType).toBe('button');
  });

  test('componentType reflects inferred component', () => {
    const ctx = buildElementContext(makeEl('nav'));
    expect(ctx.componentType).toBe('nav');
  });

  test('classes is empty array when element has no classes', () => {
    const ctx = buildElementContext(makeEl('button'));
    expect(Array.isArray(ctx.classes)).toBe(true);
    expect(ctx.classes).toHaveLength(0);
  });
});
