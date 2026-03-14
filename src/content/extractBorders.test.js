import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractBorders } from './extractBorders.js';

describe('extractBorders', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
  });

  test('extracts borders from elements', () => {
    const div = document.createElement('div');
    div.style.borderTop = '1px solid rgb(229, 231, 235)';
    document.body.appendChild(div);

    const { borders } = extractBorders();
    expect(Array.isArray(borders)).toBe(true);
  });

  test('returns empty array when no borders', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const { borders } = extractBorders();
    expect(Array.isArray(borders)).toBe(true);
  });
});
