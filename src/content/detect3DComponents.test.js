import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detect3DComponents } from './detect3DComponents.js';

describe('detect3DComponents', () => {
  let window;
  let originalQuerySelectorAll;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;

    originalQuerySelectorAll = document.querySelectorAll.bind(document);
    document.querySelectorAll = function(selector) {
      try {
        return originalQuerySelectorAll(selector);
      } catch {
        return [];
      }
    };
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('returns an object with a components3D array', () => {
    const result = detect3DComponents();
    expect(result).toHaveProperty('components3D');
    expect(Array.isArray(result.components3D)).toBe(true);
  });

  test('returns empty array when no 3D components exist', () => {
    const { components3D } = detect3DComponents();
    expect(components3D).toHaveLength(0);
  });

  test('detects Spline iframe', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://my.spline.design/abc123');
    document.body.appendChild(iframe);

    const { components3D } = detect3DComponents();
    const spline = components3D.find(c => c.type === 'spline-iframe');
    expect(spline).toBeDefined();
    expect(spline.src).toContain('spline.design');
  });

  test('detects Sketchfab iframe', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://sketchfab.com/models/xyz/embed');
    document.body.appendChild(iframe);

    const { components3D } = detect3DComponents();
    const sf = components3D.find(c => c.type === 'sketchfab-iframe');
    expect(sf).toBeDefined();
    expect(sf.src).toContain('sketchfab.com');
  });

  test('detects rive canvas via data-rive attribute', () => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-rive', '/animations/hero.riv');
    document.body.appendChild(canvas);

    const { components3D } = detect3DComponents();
    const rive = components3D.find(c => c.type === 'rive-canvas');
    expect(rive).toBeDefined();
    expect(rive.modelUrl).toContain('hero.riv');
  });

  test('detects multiple component types simultaneously', () => {
    const iframe1 = document.createElement('iframe');
    iframe1.setAttribute('src', 'https://my.spline.design/abc');
    document.body.appendChild(iframe1);

    const iframe2 = document.createElement('iframe');
    iframe2.setAttribute('src', 'https://sketchfab.com/models/xyz');
    document.body.appendChild(iframe2);

    const { components3D } = detect3DComponents();
    expect(components3D.length).toBeGreaterThanOrEqual(2);
  });

  test('each entry has required shape', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://my.spline.design/test');
    document.body.appendChild(iframe);

    const { components3D } = detect3DComponents();
    const c = components3D[0];
    expect(c).toHaveProperty('type');
    expect(c).toHaveProperty('selector');
    expect(c).toHaveProperty('src');
    expect(c).toHaveProperty('attributes');
    expect(c).toHaveProperty('modelUrl');
  });

  test('ignores non-3D iframes', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://youtube.com/embed/xyz');
    document.body.appendChild(iframe);

    const { components3D } = detect3DComponents();
    expect(components3D).toHaveLength(0);
  });
});
