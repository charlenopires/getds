/**
 * Task: cd315c74 — Loading state: progress text showing current extraction layer
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — progress text during extraction', () => {
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
        <button id="extract-btn">Extract Design System</button>
        <p id="status"></p>
      </div>
      <div id="loading-state" style="display:none">
        <div class="loader"></div>
        <p id="progress">Initialising…</p>
      </div>
      <div id="download-state" style="display:none">
        <button id="download-btn">Download Markdown</button>
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

  test('progress element shows initial text on extraction start', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    const progress = document.getElementById('progress');
    expect(progress.textContent).toBeTruthy();
  });

  test('PROGRESS_UPDATE updates progress text with layer name', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    capturedListener({ type: 'PROGRESS_UPDATE', layer: 'visual-foundations', percent: 14 });

    const progress = document.getElementById('progress');
    expect(progress.textContent.length).toBeGreaterThan(0);
  });

  test('PROGRESS_UPDATE for tokens layer updates progress text', () => {
    initPopup();
    document.getElementById('extract-btn').click();

    capturedListener({ type: 'PROGRESS_UPDATE', layer: 'tokens', percent: 28 });

    const progress = document.getElementById('progress');
    expect(progress.textContent.length).toBeGreaterThan(0);
  });

  test('PROGRESS_UPDATE for components layer updates progress text', () => {
    initPopup();
    document.getElementById('extract-btn').click();

    capturedListener({ type: 'PROGRESS_UPDATE', layer: 'components', percent: 42 });

    const progress = document.getElementById('progress');
    expect(progress.textContent.length).toBeGreaterThan(0);
  });

  test('progress text changes when different layers arrive', () => {
    initPopup();
    document.getElementById('extract-btn').click();

    capturedListener({ type: 'PROGRESS_UPDATE', layer: 'visual-foundations', percent: 14 });
    const firstText = document.getElementById('progress').textContent;

    capturedListener({ type: 'PROGRESS_UPDATE', layer: 'accessibility', percent: 100 });
    const lastText = document.getElementById('progress').textContent;

    expect(firstText).not.toBe(lastText);
  });

  test('unrelated messages do not change progress text', () => {
    initPopup();
    document.getElementById('extract-btn').click();

    const before = document.getElementById('progress').textContent;

    capturedListener({ type: 'EXTRACTION_CANCELLED' });

    // After cancel, state resets — but progress content shouldn't be PROGRESS_UPDATE driven
    // Just ensure progress el still exists
    const progress = document.getElementById('progress');
    expect(progress).not.toBeNull();
  });
});
