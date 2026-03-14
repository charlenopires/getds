import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detect3DLibraries } from './detect3DLibraries.js';

describe('detect3DLibraries', () => {
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

  test('returns an object with a libraries3D array', () => {
    const result = detect3DLibraries();
    expect(result).toHaveProperty('libraries3D');
    expect(Array.isArray(result.libraries3D)).toBe(true);
  });

  test('returns empty array when no 3D libraries are present', () => {
    const { libraries3D } = detect3DLibraries();
    expect(libraries3D).toHaveLength(0);
  });

  test('detects Three.js via script tag', () => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.min.js');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const three = libraries3D.find(l => l.name === 'Three.js');
    expect(three).toBeDefined();
    expect(three.detected).toBe(true);
    expect(three.scriptSrc).toContain('three');
  });

  test('detects Babylon.js via script tag', () => {
    const script = document.createElement('script');
    script.setAttribute('src', '/lib/babylonjs.js');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const babylon = libraries3D.find(l => l.name === 'Babylon.js');
    expect(babylon).toBeDefined();
    expect(babylon.detected).toBe(true);
  });

  test('detects A-Frame via script tag', () => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://aframe.io/releases/1.4.0/aframe.min.js');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const aframe = libraries3D.find(l => l.name === 'A-Frame');
    expect(aframe).toBeDefined();
  });

  test('detects Spline via script tag', () => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://unpkg.com/@splinetool/runtime');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const spline = libraries3D.find(l => l.name === 'Spline');
    expect(spline).toBeDefined();
  });

  test('detects model-viewer via script tag', () => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const mv = libraries3D.find(l => l.name === 'model-viewer');
    expect(mv).toBeDefined();
  });

  test('detects Rive via script tag', () => {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://unpkg.com/@rive-app/canvas');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const rive = libraries3D.find(l => l.name === 'Rive');
    expect(rive).toBeDefined();
  });

  test('detects multiple libraries simultaneously', () => {
    const s1 = document.createElement('script');
    s1.setAttribute('src', '/three.min.js');
    document.head.appendChild(s1);

    const s2 = document.createElement('script');
    s2.setAttribute('src', '/aframe.js');
    document.head.appendChild(s2);

    const { libraries3D } = detect3DLibraries();
    expect(libraries3D.length).toBeGreaterThanOrEqual(2);
  });

  test('each entry has required shape', () => {
    const script = document.createElement('script');
    script.setAttribute('src', '/three.module.js');
    document.head.appendChild(script);

    const { libraries3D } = detect3DLibraries();
    const lib = libraries3D[0];
    expect(lib).toHaveProperty('name');
    expect(lib).toHaveProperty('version');
    expect(lib).toHaveProperty('detected');
    expect(lib).toHaveProperty('globalVar');
    expect(lib).toHaveProperty('scriptSrc');
  });

  test('does not duplicate libraries detected via both script and global', () => {
    // Simulate script detection only (globals require page-world injection which happy-dom can't do)
    const s1 = document.createElement('script');
    s1.setAttribute('src', '/three.min.js');
    document.head.appendChild(s1);

    const s2 = document.createElement('script');
    s2.setAttribute('src', '/three.module.js');
    document.head.appendChild(s2);

    const { libraries3D } = detect3DLibraries();
    const threeEntries = libraries3D.filter(l => l.name === 'Three.js');
    expect(threeEntries).toHaveLength(1);
  });
});
