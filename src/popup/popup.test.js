/**
 * Task: 75edb8e9 — Popup sends EXTRACT_START message to background on Extract button click
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — EXTRACT_START message', () => {
  let mockSendMessage;
  let window;
  let document;

  beforeEach(() => {
    window = new Window();
    document = window.document;

    // Inject DOM globals
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
      <div id="status"></div>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.chrome;
  });

  test('sends EXTRACT_START when Extract button is clicked', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'EXTRACT_START' });
  });

  test('sends EXTRACT_START on every click', () => {
    initPopup();

    document.getElementById('extract-btn').click();
    document.getElementById('extract-btn').click();

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage.mock.calls.every(([arg]) => arg.type === 'EXTRACT_START')).toBe(true);
  });

  test('does not send message if extract button is absent from DOM', () => {
    document.body.innerHTML = '<div id="status"></div>';

    initPopup();

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
