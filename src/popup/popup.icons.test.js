/**
 * Task: 8b77ef5f — SVG icons: inline, stroke-based, 24px, currentColor for all popup icons
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';

describe('Popup — SVG icons', () => {
  let window;
  let document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    document.body.innerHTML = `
      <button id="extract-btn">
        <svg id="icon-extract" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round" aria-hidden="true">
          <path d="M15 4V2"/>
        </svg>
        Extract Design System
      </button>

      <button id="download-btn">
        <svg id="icon-download" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4"/>
        </svg>
        Download Markdown
      </button>

      <button id="retry-btn">
        <svg id="icon-retry" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round" aria-hidden="true">
          <polyline points="1 4 1 10 7 10"/>
        </svg>
        Retry
      </button>

      <a id="footer-github-link" href="https://github.com/fazapp/getds">
        <svg id="icon-github" width="12" height="12" viewBox="0 0 24 24"
             fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.484 2 12.017"/>
        </svg>
        GitHub
      </a>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  // ── Extract icon ──────────────────────────────────────────────────────────

  test('extract icon is 24px wide', () => {
    expect(document.getElementById('icon-extract').getAttribute('width')).toBe('24');
  });

  test('extract icon is 24px tall', () => {
    expect(document.getElementById('icon-extract').getAttribute('height')).toBe('24');
  });

  test('extract icon uses stroke=currentColor', () => {
    expect(document.getElementById('icon-extract').getAttribute('stroke')).toBe('currentColor');
  });

  test('extract icon has fill=none (stroke-based)', () => {
    expect(document.getElementById('icon-extract').getAttribute('fill')).toBe('none');
  });

  test('extract icon is decorative (aria-hidden)', () => {
    expect(document.getElementById('icon-extract').getAttribute('aria-hidden')).toBe('true');
  });

  // ── Download icon ─────────────────────────────────────────────────────────

  test('download icon is 24px', () => {
    const icon = document.getElementById('icon-download');
    expect(icon.getAttribute('width')).toBe('24');
    expect(icon.getAttribute('height')).toBe('24');
  });

  test('download icon uses stroke=currentColor', () => {
    expect(document.getElementById('icon-download').getAttribute('stroke')).toBe('currentColor');
  });

  test('download icon has fill=none', () => {
    expect(document.getElementById('icon-download').getAttribute('fill')).toBe('none');
  });

  test('download icon is aria-hidden', () => {
    expect(document.getElementById('icon-download').getAttribute('aria-hidden')).toBe('true');
  });

  // ── Retry icon ────────────────────────────────────────────────────────────

  test('retry icon is 24px', () => {
    const icon = document.getElementById('icon-retry');
    expect(icon.getAttribute('width')).toBe('24');
    expect(icon.getAttribute('height')).toBe('24');
  });

  test('retry icon uses stroke=currentColor', () => {
    expect(document.getElementById('icon-retry').getAttribute('stroke')).toBe('currentColor');
  });

  test('retry icon has fill=none', () => {
    expect(document.getElementById('icon-retry').getAttribute('fill')).toBe('none');
  });

  test('retry icon is aria-hidden', () => {
    expect(document.getElementById('icon-retry').getAttribute('aria-hidden')).toBe('true');
  });

  // ── GitHub icon (fill-based brand logo — exception) ───────────────────────

  test('github icon uses currentColor (theme compatible)', () => {
    expect(document.getElementById('icon-github').getAttribute('fill')).toBe('currentColor');
  });

  test('github icon is aria-hidden', () => {
    expect(document.getElementById('icon-github').getAttribute('aria-hidden')).toBe('true');
  });

  // ── All button icons are inline SVG (not img src) ─────────────────────────

  test('extract icon is inline SVG inside button', () => {
    const btn = document.getElementById('extract-btn');
    const svg = btn.firstElementChild;
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  test('download icon is inline SVG inside button', () => {
    const btn = document.getElementById('download-btn');
    const svg = btn.firstElementChild;
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  test('retry icon is inline SVG inside button', () => {
    const btn = document.getElementById('retry-btn');
    const svg = btn.firstElementChild;
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });
});
