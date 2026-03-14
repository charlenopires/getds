import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { measureLayoutWhitespace } from './measureWhitespace.js';

describe('measureLayoutWhitespace', () => {
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

  test('returns empty gaps when no landmark elements exist', () => {
    const result = measureLayoutWhitespace();
    expect(result.gaps).toEqual([]);
  });

  test('returns empty gaps when landmark has fewer than 2 children', () => {
    const main = document.createElement('main');
    const child = document.createElement('div');
    main.appendChild(child);
    document.body.appendChild(main);

    const result = measureLayoutWhitespace();
    expect(result.gaps).toEqual([]);
  });

  test('returns result object with gaps array', () => {
    const result = measureLayoutWhitespace();
    expect(result).toHaveProperty('gaps');
    expect(Array.isArray(result.gaps)).toBe(true);
  });
});
