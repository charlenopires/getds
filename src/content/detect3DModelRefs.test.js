import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detect3DModelRefs } from './detect3DModelRefs.js';

describe('detect3DModelRefs', () => {
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

  test('returns an object with a modelFiles array', () => {
    const result = detect3DModelRefs();
    expect(result).toHaveProperty('modelFiles');
    expect(Array.isArray(result.modelFiles)).toBe(true);
  });

  test('returns empty array when no model refs exist', () => {
    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(0);
  });

  test('detects .glb file in <a href>', () => {
    const a = document.createElement('a');
    a.setAttribute('href', '/models/hero.glb');
    document.body.appendChild(a);

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(1);
    expect(modelFiles[0].url).toBe('/models/hero.glb');
    expect(modelFiles[0].format).toBe('glb');
    expect(modelFiles[0].source).toContain('a[href]');
  });

  test('detects .gltf file in <link href>', () => {
    const link = document.createElement('link');
    link.setAttribute('href', '/assets/scene.gltf');
    document.head.appendChild(link);

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(1);
    expect(modelFiles[0].format).toBe('gltf');
  });

  test('detects .usdz file in data-* attribute', () => {
    const div = document.createElement('div');
    div.setAttribute('data-model', '/models/product.usdz');
    document.body.appendChild(div);

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(1);
    expect(modelFiles[0].format).toBe('usdz');
    expect(modelFiles[0].source).toBe('data-model');
  });

  test('detects model URL in inline script', () => {
    const script = document.createElement('script');
    script.textContent = 'const model = "/assets/product.glb";';
    document.body.appendChild(script);

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(1);
    expect(modelFiles[0].url).toBe('/assets/product.glb');
    expect(modelFiles[0].source).toBe('script inline');
  });

  test('deduplicates URLs', () => {
    const a1 = document.createElement('a');
    a1.setAttribute('href', '/models/hero.glb');
    document.body.appendChild(a1);

    const a2 = document.createElement('a');
    a2.setAttribute('href', '/models/hero.glb');
    document.body.appendChild(a2);

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(1);
  });

  test('detects multiple formats', () => {
    for (const [ext, tag] of [['glb', 'a'], ['obj', 'a'], ['fbx', 'a'], ['stl', 'a']]) {
      const el = document.createElement(tag);
      el.setAttribute('href', `/models/file.${ext}`);
      document.body.appendChild(el);
    }

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(4);
    const formats = modelFiles.map(f => f.format);
    expect(formats).toContain('glb');
    expect(formats).toContain('obj');
    expect(formats).toContain('fbx');
    expect(formats).toContain('stl');
  });

  test('each entry has required shape', () => {
    const a = document.createElement('a');
    a.setAttribute('href', '/models/test.glb');
    document.body.appendChild(a);

    const { modelFiles } = detect3DModelRefs();
    const f = modelFiles[0];
    expect(f).toHaveProperty('url');
    expect(f).toHaveProperty('format');
    expect(f).toHaveProperty('source');
    expect(f).toHaveProperty('element');
  });

  test('handles URLs with query strings', () => {
    const a = document.createElement('a');
    a.setAttribute('href', '/models/hero.glb?v=123');
    document.body.appendChild(a);

    const { modelFiles } = detect3DModelRefs();
    expect(modelFiles).toHaveLength(1);
    expect(modelFiles[0].format).toBe('glb');
  });
});
