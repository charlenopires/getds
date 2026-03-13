/**
 * Task: 56c36f0e — Handle service worker termination mid-extraction with retry option
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — service worker termination → retry option', () => {
  let window;
  let document;
  let mockConnect;
  let capturedDisconnectHandler;
  let mockPort;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    // Simulate a chrome Port with onDisconnect support
    mockPort = {
      onDisconnect: {
        addListener: mock((fn) => { capturedDisconnectHandler = fn; }),
      },
      postMessage: mock(() => {}),
      disconnect: mock(() => {}),
    };

    mockConnect = mock(() => mockPort);

    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => {}),
        connect: mockConnect,
        onMessage: {
          addListener: mock(() => {}),
        },
        lastError: null,
      },
    };

    document.body.innerHTML = `
      <button id="extract-btn">Extract</button>
      <button id="download-btn" style="display:none">Download</button>
      <button id="retry-btn" style="display:none">Retry</button>
      <div id="status"></div>
      <div id="progress" style="display:none"></div>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.chrome;
    capturedDisconnectHandler = undefined;
  });

  test('popup connects a port to background when Extract is clicked', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith({ name: 'extraction' });
  });

  test('popup registers onDisconnect listener on the port after connecting', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    expect(mockPort.onDisconnect.addListener).toHaveBeenCalledTimes(1);
  });

  test('shows retry button when port disconnects unexpectedly during extraction', () => {
    initPopup();

    // Start extraction (marks extraction as in-progress)
    document.getElementById('extract-btn').click();

    // Simulate SW termination — port disconnects
    capturedDisconnectHandler();

    const retryBtn = document.getElementById('retry-btn');
    expect(retryBtn.style.display).not.toBe('none');
  });

  test('shows error status message when SW terminates mid-extraction', () => {
    initPopup();

    document.getElementById('extract-btn').click();
    capturedDisconnectHandler();

    const status = document.getElementById('status');
    expect(status.textContent).toMatch(/connection lost|retry|disconnected/i);
  });

  test('retry button click restarts extraction', () => {
    initPopup();

    document.getElementById('extract-btn').click();
    capturedDisconnectHandler();

    // Reset call count after initial extract
    mockConnect.mockClear();
    globalThis.chrome.runtime.sendMessage.mockClear();

    document.getElementById('retry-btn').click();

    expect(globalThis.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'EXTRACT_START' });
  });

  test('hides retry button when retry is clicked', () => {
    initPopup();

    document.getElementById('extract-btn').click();
    capturedDisconnectHandler();

    document.getElementById('retry-btn').click();

    const retryBtn = document.getElementById('retry-btn');
    expect(retryBtn.style.display).toBe('none');
  });
});
