/**
 * Task: 485a6301 — Completion state: Download Markdown button with SVG download icon
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — completion state on EXTRACTION_COMPLETE', () => {
  let window;
  let document;
  let capturedListener;
  let mockSendMessage;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    mockSendMessage = mock(() => {});
    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
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
        <button id="extract-btn">Extract Design System</button>
        <p id="status"></p>
      </div>
      <div id="loading-state" style="display:none">
        <div class="loader"></div>
        <p id="progress">Initialising…</p>
      </div>
      <div id="download-state" style="display:none">
        <button id="download-btn">Download Markdown</button>
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

  const fireComplete = (summary = {}) =>
    capturedListener({ type: 'EXTRACTION_COMPLETE', summary });

  test('EXTRACTION_COMPLETE shows download-state', () => {
    initPopup();
    fireComplete();
    expect(document.getElementById('download-state').style.display).not.toBe('none');
  });

  test('EXTRACTION_COMPLETE hides loading-state', () => {
    initPopup();
    // Simulate extraction in progress
    document.getElementById('loading-state').style.display = '';

    fireComplete();
    expect(document.getElementById('loading-state').style.display).toBe('none');
  });

  test('EXTRACTION_COMPLETE hides extract-state', () => {
    initPopup();
    fireComplete();
    expect(document.getElementById('extract-state').style.display).toBe('none');
  });

  test('download-btn is visible after EXTRACTION_COMPLETE', () => {
    initPopup();
    fireComplete();
    const btn = document.getElementById('download-btn');
    expect(btn.style.display).not.toBe('none');
  });

  test('clicking Download sends DOWNLOAD_REQUEST after EXTRACTION_COMPLETE', () => {
    initPopup();
    fireComplete();

    document.getElementById('download-btn').click();

    const calls = mockSendMessage.mock.calls.filter(([m]) => m.type === 'DOWNLOAD_REQUEST');
    expect(calls).toHaveLength(1);
  });

  test('error-state remains hidden after EXTRACTION_COMPLETE', () => {
    initPopup();
    fireComplete();
    expect(document.getElementById('error-state').style.display).toBe('none');
  });
});
