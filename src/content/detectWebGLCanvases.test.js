import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectWebGLCanvases } from './detectWebGLCanvases.js';

describe('detectWebGLCanvases', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  function addCanvas(opts = {}) {
    const canvas = document.createElement('canvas');
    if (opts.id) canvas.id = opts.id;
    if (opts.width) canvas.width = opts.width;
    if (opts.height) canvas.height = opts.height;
    if (opts.className) canvas.className = opts.className;
    if (opts.dataAttrs) {
      for (const [k, v] of Object.entries(opts.dataAttrs)) {
        canvas.setAttribute(k, v);
      }
    }

    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = () => ({
      width: opts.cssWidth ?? opts.width ?? 0,
      height: opts.cssHeight ?? opts.height ?? 0,
      top: 0, left: 0, right: 0, bottom: 0,
    });

    // Mock getContext — happy-dom doesn't support WebGL
    if (opts.contextType === 'webgl2') {
      canvas.getContext = (type) => type === 'webgl2' ? {} : null;
    } else if (opts.contextType === 'webgl') {
      canvas.getContext = (type) => type === 'webgl' ? {} : null;
    } else {
      canvas.getContext = () => null;
    }

    // r3f marker
    if (opts.r3f) canvas.__r3f = true;

    const parent = opts.parentEl ?? document.body;
    parent.appendChild(canvas);
    return canvas;
  }

  test('returns an object with a webglCanvases array', () => {
    const result = detectWebGLCanvases();
    expect(result).toHaveProperty('webglCanvases');
    expect(Array.isArray(result.webglCanvases)).toBe(true);
  });

  test('returns empty array when no canvases exist', () => {
    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(0);
  });

  test('detects canvas with webgl2 context', () => {
    addCanvas({ id: 'scene', width: 1920, height: 1080, contextType: 'webgl2' });

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(1);
    expect(webglCanvases[0].contextType).toBe('webgl2');
    expect(webglCanvases[0].id).toBe('scene');
  });

  test('detects canvas with webgl context', () => {
    addCanvas({ width: 800, height: 600, contextType: 'webgl' });

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(1);
    expect(webglCanvases[0].contextType).toBe('webgl');
  });

  test('detects react-three-fiber canvas via __r3f marker', () => {
    addCanvas({ r3f: true });

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(1);
    expect(webglCanvases[0].contextType).toBe('webgl2');
  });

  test('detects canvas with library-hint parent class', () => {
    const parent = document.createElement('div');
    parent.className = 'three-container';
    document.body.appendChild(parent);
    addCanvas({ parentEl: parent });

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(1);
    expect(webglCanvases[0].parentInfo).toContain('three-container');
  });

  test('detects canvas with webgl data attributes', () => {
    addCanvas({ dataAttrs: { 'data-engine': 'three.js' } });

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(1);
    expect(webglCanvases[0].dataAttributes).toHaveProperty('data-engine');
  });

  test('skips plain 2D canvas without hints', () => {
    addCanvas({});

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases).toHaveLength(0);
  });

  test('includes CSS dimensions from getBoundingClientRect', () => {
    addCanvas({ width: 1920, height: 1080, cssWidth: 960, cssHeight: 540, contextType: 'webgl2' });

    const { webglCanvases } = detectWebGLCanvases();
    expect(webglCanvases[0].cssWidth).toBe(960);
    expect(webglCanvases[0].cssHeight).toBe(540);
  });

  test('each entry has required shape', () => {
    addCanvas({ id: 'test', contextType: 'webgl' });

    const { webglCanvases } = detectWebGLCanvases();
    const c = webglCanvases[0];
    expect(c).toHaveProperty('id');
    expect(c).toHaveProperty('width');
    expect(c).toHaveProperty('height');
    expect(c).toHaveProperty('cssWidth');
    expect(c).toHaveProperty('cssHeight');
    expect(c).toHaveProperty('contextType');
    expect(c).toHaveProperty('parentInfo');
    expect(c).toHaveProperty('dataAttributes');
  });
});
