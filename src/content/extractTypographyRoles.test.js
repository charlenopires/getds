/**
 * Tests for extractTypographyRoles — typography style capture per semantic role.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractTypographyRoles } from './extractTypographyRoles.js';

function fakeComputedStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    fontSize: props.fontSize ?? '16px',
    fontWeight: props.fontWeight ?? '400',
    lineHeight: props.lineHeight ?? '1.5',
    letterSpacing: props.letterSpacing ?? 'normal',
    textTransform: props.textTransform ?? 'none',
    color: props.color ?? 'rgb(0, 0, 0)',
    fontFamily: props.fontFamily ?? 'sans-serif',
    fontStyle: props.fontStyle ?? 'normal',
    fontVariant: props.fontVariant ?? 'normal',
    textDecoration: props.textDecoration ?? 'none',
    backgroundColor: props.backgroundColor ?? 'rgba(0, 0, 0, 0)',
  };
}

describe('extractTypographyRoles — captureTypographyStyle includes new fields', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    // happy-dom's querySelector needs SyntaxError on the internal window reference
    if (!window.SyntaxError) window.SyntaxError = globalThis.SyntaxError;
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => el.__fakeStyle__ ?? fakeComputedStyle();
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function addEl(tag, styleProps = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeComputedStyle(styleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a typographyRoles property', () => {
    const result = extractTypographyRoles();
    expect(result).toHaveProperty('typographyRoles');
  });

  test('heading role includes fontStyle', () => {
    addEl('h1', { fontStyle: 'italic' });
    const result = extractTypographyRoles();
    expect(result.typographyRoles.h1).toHaveProperty('fontStyle', 'italic');
  });

  test('heading role includes fontVariant', () => {
    addEl('h1', { fontVariant: 'small-caps' });
    const result = extractTypographyRoles();
    expect(result.typographyRoles.h1).toHaveProperty('fontVariant', 'small-caps');
  });

  test('heading role includes textDecoration', () => {
    addEl('h1', { textDecoration: 'underline' });
    const result = extractTypographyRoles();
    expect(result.typographyRoles.h1).toHaveProperty('textDecoration', 'underline');
  });

  test('body role includes fontStyle, fontVariant, textDecoration', () => {
    addEl('p', {
      fontStyle: 'normal',
      fontVariant: 'normal',
      textDecoration: 'none',
    });
    const result = extractTypographyRoles();
    expect(result.typographyRoles.body).toHaveProperty('fontStyle');
    expect(result.typographyRoles.body).toHaveProperty('fontVariant');
    expect(result.typographyRoles.body).toHaveProperty('textDecoration');
  });
});
