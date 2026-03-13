/**
 * Task: b2b2c3c8 — Popup sends DOWNLOAD_REQUEST message to background on Download button click
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — DOWNLOAD_REQUEST message', () => {
  let mockSendMessage;
  let window;
  let document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    mockSendMessage = mock(() => {});
    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        lastError: null,
      },
    };

    document.body.innerHTML = `
      <button id="extract-btn">Extract</button>
      <button id="download-btn">Download</button>
      <div id="status"></div>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.chrome;
  });

  test('sends DOWNLOAD_REQUEST when Download button is clicked', () => {
    initPopup();

    document.getElementById('download-btn').click();

    const downloadCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'DOWNLOAD_REQUEST'
    );
    expect(downloadCalls).toHaveLength(1);
  });

  test('DOWNLOAD_REQUEST is distinct from EXTRACT_START', () => {
    initPopup();

    document.getElementById('extract-btn').click();
    document.getElementById('download-btn').click();

    const types = mockSendMessage.mock.calls.map(([m]) => m.type);
    expect(types).toContain('EXTRACT_START');
    expect(types).toContain('DOWNLOAD_REQUEST');
    expect(types[0]).toBe('EXTRACT_START');
    expect(types[1]).toBe('DOWNLOAD_REQUEST');
  });

  test('does not send DOWNLOAD_REQUEST when Extract button is clicked', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    const downloadCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'DOWNLOAD_REQUEST'
    );
    expect(downloadCalls).toHaveLength(0);
  });

  test('does not throw if download button is absent from DOM', () => {
    document.body.innerHTML = '<button id="extract-btn">Extract</button>';

    expect(() => initPopup()).not.toThrow();
  });
});
