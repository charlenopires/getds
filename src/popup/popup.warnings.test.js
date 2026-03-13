/**
 * Task: fb91a309 — Popup warning badge with limitations count
 * Spec: 21d9e937 — Protected Page Resilience
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';

let window;

function buildDom() {
  window = new Window({ url: 'https://example.com' });
  globalThis.document = window.document;
  globalThis.window   = window;

  document.body.innerHTML = `
    <div id="extract-state" class="state"></div>
    <div id="loading-state" class="state" style="display:none"></div>
    <div id="download-state" class="state" style="display:none">
      <button id="download-btn">Download</button>
      <div id="preview-summary">
        <span id="count-colors">–</span>
        <span id="count-fonts">–</span>
        <span id="count-components">–</span>
        <span id="count-a11y">–</span>
      </div>
      <span id="warnings-badge" class="warnings-badge" style="display:none" aria-label="Warnings"></span>
    </div>
    <div id="error-state" class="state" style="display:none"></div>
  `;

  // minimal chrome stub
  globalThis.chrome = {
    runtime: { sendMessage: () => {}, onMessage: { addListener: () => {} }, connect: () => ({ onDisconnect: { addListener: () => {} } }) },
    tabs: { query: () => {} },
  };
}

async function cleanup() {
  await window.happyDOM.abort();
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.chrome;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('popup warning badge — limitations count display', () => {
  beforeEach(buildDom);
  afterEach(cleanup);

  test('warnings badge element exists in DOM', async () => {
    const { initPopup } = await import('./popup.js');
    initPopup();
    expect(document.getElementById('warnings-badge')).not.toBeNull();
  });

  test('warnings badge is hidden when no limitations', async () => {
    const { initPopup } = await import('./popup.js');
    initPopup();

    // Simulate EXTRACTION_COMPLETE with no limitations
    const listeners = [];
    globalThis.chrome.runtime.onMessage = { addListener: (fn) => listeners.push(fn) };
    initPopup();
    listeners.forEach(fn => fn({ type: 'EXTRACTION_COMPLETE', summary: { colors: 5 }, limitations: [] }));

    const badge = document.getElementById('warnings-badge');
    expect(badge.style.display).toBe('none');
  });

  test('warnings badge is visible when limitations count > 0', async () => {
    const listeners = [];
    globalThis.chrome.runtime.onMessage = { addListener: (fn) => listeners.push(fn) };

    const { initPopup } = await import('./popup.js');
    initPopup();

    listeners.forEach(fn => fn({
      type: 'EXTRACTION_COMPLETE',
      summary: { colors: 5 },
      limitations: [{ layer: 'visual-foundations', message: 'CSP', element: 'meta' }],
    }));

    const badge = document.getElementById('warnings-badge');
    expect(badge.style.display).not.toBe('none');
  });

  test('warnings badge shows correct count', async () => {
    const listeners = [];
    globalThis.chrome.runtime.onMessage = { addListener: (fn) => listeners.push(fn) };

    const { initPopup } = await import('./popup.js');
    initPopup();

    listeners.forEach(fn => fn({
      type: 'EXTRACTION_COMPLETE',
      summary: {},
      limitations: [
        { layer: 'visual-foundations', message: 'A', element: 'a' },
        { layer: 'visual-foundations', message: 'B', element: 'b' },
        { layer: 'visual-foundations', message: 'C', element: 'c' },
      ],
    }));

    const badge = document.getElementById('warnings-badge');
    expect(badge.textContent).toContain('3');
  });

  test('warnings badge has aria-label describing warnings', async () => {
    const listeners = [];
    globalThis.chrome.runtime.onMessage = { addListener: (fn) => listeners.push(fn) };

    const { initPopup } = await import('./popup.js');
    initPopup();

    listeners.forEach(fn => fn({
      type: 'EXTRACTION_COMPLETE',
      summary: {},
      limitations: [{ layer: 'visual-foundations', message: 'X', element: 'x' }],
    }));

    const badge = document.getElementById('warnings-badge');
    const label = badge.getAttribute('aria-label') ?? '';
    expect(label.toLowerCase()).toMatch(/warning/);
  });
});
