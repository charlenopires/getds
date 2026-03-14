import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectCssFramework } from './detectCssFramework.js';

describe('detectCssFramework', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
  });

  test('returns frameworks array', () => {
    const result = detectCssFramework();
    expect(Array.isArray(result.frameworks)).toBe(true);
    expect(Array.isArray(result.fontSources)).toBe(true);
  });

  test('detects Tailwind-style classes', () => {
    for (let i = 0; i < 10; i++) {
      const div = document.createElement('div');
      div.className = `p-${i} m-${i} flex grid text-blue-${i * 100}`;
      document.body.appendChild(div);
    }

    const result = detectCssFramework();
    expect(result).toHaveProperty('frameworks');
  });

  test('detects Bootstrap-style classes', () => {
    const div1 = document.createElement('div');
    div1.className = 'container row';
    const div2 = document.createElement('div');
    div2.className = 'col-md-6 btn-primary';
    const div3 = document.createElement('div');
    div3.className = 'col-lg-4 navbar';
    document.body.appendChild(div1);
    document.body.appendChild(div2);
    document.body.appendChild(div3);

    const result = detectCssFramework();
    expect(result).toHaveProperty('frameworks');
  });
});
