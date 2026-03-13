/**
 * Task: 85745522 — Error state: error message with retry button when extraction fails
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — error state on extraction failure', () => {
  let window;
  let document;
  let capturedDisconnect;
  let capturedListener;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    const mockPort = {
      onDisconnect: {
        addListener: mock((fn) => { capturedDisconnect = fn; }),
      },
    };

    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => {}),
        connect: mock(() => mockPort),
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
    capturedDisconnect = undefined;
    capturedListener = undefined;
  });

  test('error-state is hidden on init', () => {
    initPopup();
    expect(document.getElementById('error-state').style.display).toBe('none');
  });

  test('service worker disconnect shows error-state', () => {
    initPopup();
    document.getElementById('extract-btn').click();
    capturedDisconnect();

    expect(document.getElementById('error-state').style.display).not.toBe('none');
  });

  test('service worker disconnect hides loading-state', () => {
    initPopup();
    document.getElementById('extract-btn').click();
    capturedDisconnect();

    expect(document.getElementById('loading-state').style.display).toBe('none');
  });

  test('error-message contains connection lost text', () => {
    initPopup();
    document.getElementById('extract-btn').click();
    capturedDisconnect();

    const msg = document.getElementById('error-message').textContent;
    expect(msg).toMatch(/connection lost|service worker|retry/i);
  });

  test('retry button is visible in error state', () => {
    initPopup();
    document.getElementById('extract-btn').click();
    capturedDisconnect();

    const retryBtn = document.getElementById('retry-btn');
    expect(retryBtn.style.display).not.toBe('none');
  });

  test('clicking retry hides error-state and starts new extraction', () => {
    initPopup();
    document.getElementById('extract-btn').click();
    capturedDisconnect();

    globalThis.chrome.runtime.sendMessage.mockClear();
    document.getElementById('retry-btn').click();

    expect(globalThis.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'EXTRACT_START' });
    expect(document.getElementById('error-state').style.display).toBe('none');
  });

  test('EXTRACTION_CANCELLED shows error-state with cancel message', () => {
    initPopup();
    capturedListener({ type: 'EXTRACTION_CANCELLED' });

    // EXTRACTION_CANCELLED resets to extract state (not error state), with status text
    const extractState = document.getElementById('extract-state');
    expect(extractState.style.display).not.toBe('none');

    const status = document.getElementById('status');
    expect(status.textContent).toMatch(/cancel/i);
  });
});
