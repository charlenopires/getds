/**
 * Task: 063bec46 — Extraction preview summary: counts of colors, fonts, components, animations, a11y issues
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — extraction preview summary', () => {
  let window;
  let document;
  let capturedListener;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => {}),
        connect: mock(() => ({
          onDisconnect: { addListener: mock(() => {}) },
        })),
        onMessage: {
          addListener: mock((fn) => { capturedListener = fn; }),
        },
        lastError: null,
      },
      tabs: { query: mock(() => {}) },
    };

    document.body.innerHTML = `
      <div id="extract-state">
        <button id="extract-btn">Extract</button>
        <p id="status"></p>
      </div>
      <div id="loading-state" style="display:none">
        <p id="progress"></p>
      </div>
      <div id="download-state" style="display:none">
        <button id="download-btn">Download</button>
        <div id="preview-summary">
          <span id="count-colors">–</span>
          <span id="count-fonts">–</span>
          <span id="count-components">–</span>
          <span id="count-a11y">–</span>
        </div>
      </div>
      <div id="error-state" style="display:none">
        <p id="error-message"></p>
        <button id="retry-btn">Retry</button>
      </div>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.chrome;
    capturedListener = undefined;
  });

  const fireComplete = (summary) =>
    capturedListener({ type: 'EXTRACTION_COMPLETE', summary });

  test('shows color count from summary', () => {
    initPopup();
    fireComplete({ colors: 12, fonts: 3, components: 8, animations: 2, a11yIssues: 1 });
    expect(document.getElementById('count-colors').textContent).toBe('12');
  });

  test('shows font count from summary', () => {
    initPopup();
    fireComplete({ colors: 12, fonts: 3, components: 8, animations: 2, a11yIssues: 1 });
    expect(document.getElementById('count-fonts').textContent).toBe('3');
  });

  test('shows component count from summary', () => {
    initPopup();
    fireComplete({ colors: 12, fonts: 3, components: 8, animations: 2, a11yIssues: 1 });
    expect(document.getElementById('count-components').textContent).toBe('8');
  });

  test('shows a11y issue count from summary', () => {
    initPopup();
    fireComplete({ colors: 12, fonts: 3, components: 8, animations: 2, a11yIssues: 4 });
    expect(document.getElementById('count-a11y').textContent).toBe('4');
  });

  test('shows dash when summary counts are absent', () => {
    initPopup();
    fireComplete({});
    expect(document.getElementById('count-colors').textContent).toBe('–');
    expect(document.getElementById('count-fonts').textContent).toBe('–');
    expect(document.getElementById('count-components').textContent).toBe('–');
    expect(document.getElementById('count-a11y').textContent).toBe('–');
  });

  test('shows dash when summary is missing entirely', () => {
    initPopup();
    capturedListener({ type: 'EXTRACTION_COMPLETE' });
    expect(document.getElementById('count-colors').textContent).toBe('–');
  });

  test('shows zero counts correctly (not dash)', () => {
    initPopup();
    fireComplete({ colors: 0, fonts: 0, components: 0, animations: 0, a11yIssues: 0 });
    expect(document.getElementById('count-colors').textContent).toBe('0');
    expect(document.getElementById('count-a11y').textContent).toBe('0');
  });
});
