/**
 * Task: e4bf7ec5 — Popup resets state when EXTRACTION_CANCELLED is received
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — reset state on EXTRACTION_CANCELLED', () => {
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
        onMessage: {
          addListener: mock((fn) => { capturedListener = fn; }),
        },
        lastError: null,
      },
    };

    document.body.innerHTML = `
      <button id="extract-btn">Extract</button>
      <button id="download-btn" style="display:none">Download</button>
      <div id="status"></div>
      <div id="progress" style="display:none"></div>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.chrome;
    capturedListener = undefined;
  });

  test('popup registers a chrome.runtime.onMessage listener on init', () => {
    initPopup();
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  test('hides progress and shows extract button when EXTRACTION_CANCELLED received', () => {
    initPopup();

    // Simulate mid-extraction state: progress visible, extract btn hidden
    const progress = document.getElementById('progress');
    const extractBtn = document.getElementById('extract-btn');
    progress.style.display = 'block';
    extractBtn.style.display = 'none';

    // Fire EXTRACTION_CANCELLED
    capturedListener({ type: 'EXTRACTION_CANCELLED' });

    expect(progress.style.display).toBe('none');
    expect(extractBtn.style.display).not.toBe('none');
  });

  test('sets status text to cancelled message on EXTRACTION_CANCELLED', () => {
    initPopup();

    capturedListener({ type: 'EXTRACTION_CANCELLED' });

    const status = document.getElementById('status');
    expect(status.textContent).toMatch(/cancel/i);
  });

  test('does not affect UI for unrelated message types', () => {
    initPopup();

    const extractBtn = document.getElementById('extract-btn');
    const originalDisplay = extractBtn.style.display;

    capturedListener({ type: 'SOME_OTHER_MESSAGE' });

    expect(extractBtn.style.display).toBe(originalDisplay);
  });
});
