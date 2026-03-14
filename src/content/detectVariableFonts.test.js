import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectVariableFonts } from './detectVariableFonts.js';

describe('detectVariableFonts', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => el.__fakeStyle__ ?? {
      fontVariationSettings: 'normal',
      fontFamily: 'Arial',
    };
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  test('returns empty array for no rules', () => {
    const { variableFonts } = detectVariableFonts([]);
    expect(variableFonts).toEqual([]);
  });

  test('detects variable font from weight range', () => {
    const rules = [{
      fontFamily: 'Inter',
      fontWeight: '100 900',
      fontStyle: 'normal',
      sources: [{ url: '/inter.woff2', format: 'woff2', isVariable: false }],
    }];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts).toHaveLength(1);
    expect(variableFonts[0].family).toBe('Inter');
    expect(variableFonts[0].axes).toContainEqual(
      expect.objectContaining({ tag: 'wght', min: 100, max: 900 })
    );
  });

  test('detects variable font from format hint', () => {
    const rules = [{
      fontFamily: 'Roboto',
      fontWeight: '400',
      fontStyle: 'normal',
      sources: [{ url: '/roboto.woff2', format: 'woff2-variations', isVariable: true }],
    }];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts).toHaveLength(1);
    expect(variableFonts[0].family).toBe('Roboto');
  });

  test('detects variable font from stretch range', () => {
    const rules = [{
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'normal',
      fontStretch: '75 125',
      sources: [{ url: '/inter.woff2', format: 'woff2', isVariable: false }],
    }];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts).toHaveLength(1);
    expect(variableFonts[0].axes).toContainEqual(
      expect.objectContaining({ tag: 'wdth', min: 75, max: 125 })
    );
  });

  test('detects variable font from oblique style range', () => {
    const rules = [{
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'oblique -12deg 12deg',
      sources: [{ url: '/inter.woff2', format: 'woff2', isVariable: false }],
    }];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts).toHaveLength(1);
    expect(variableFonts[0].axes).toContainEqual(
      expect.objectContaining({ tag: 'slnt' })
    );
  });

  test('skips non-variable fonts', () => {
    const rules = [{
      fontFamily: 'Arial',
      fontWeight: '400',
      fontStyle: 'normal',
      sources: [{ url: '/arial.woff2', format: 'woff2', isVariable: false }],
    }];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts).toHaveLength(0);
  });

  test('merges axes from multiple rules for same family', () => {
    const rules = [
      {
        fontFamily: 'Inter',
        fontWeight: '100 400',
        fontStyle: 'normal',
        sources: [{ url: '/inter-light.woff2', format: 'woff2', isVariable: false }],
      },
      {
        fontFamily: 'Inter',
        fontWeight: '400 900',
        fontStyle: 'normal',
        sources: [{ url: '/inter-bold.woff2', format: 'woff2', isVariable: false }],
      },
    ];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts).toHaveLength(1);
    const wght = variableFonts[0].axes.find(a => a.tag === 'wght');
    expect(wght.min).toBe(100);
    expect(wght.max).toBe(900);
  });

  test('includes source URL', () => {
    const rules = [{
      fontFamily: 'Inter',
      fontWeight: '100 900',
      fontStyle: 'normal',
      sources: [{ url: '/fonts/inter-var.woff2', format: 'woff2', isVariable: true }],
    }];
    const { variableFonts } = detectVariableFonts(rules);
    expect(variableFonts[0].source).toBe('/fonts/inter-var.woff2');
  });
});
