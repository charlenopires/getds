/**
 * Task: f1c4e5cc — Loading state: animated SVG orbital/pulse loader replaces Extract button
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — loading state on extraction start', () => {
  let window;
  let document;

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
        onMessage: { addListener: mock(() => {}) },
        lastError: null,
      },
      tabs: { query: mock(() => {}) },
    };

    // Mirror the real popup HTML state structure
    document.body.innerHTML = `
      <div id="extract-state">
        <button id="extract-btn">Extract Design System</button>
        <p id="status"></p>
      </div>
      <div id="loading-state" style="display:none">
        <div class="loader">
          <div class="loader-ring"></div>
          <div class="loader-ring"></div>
          <div class="loader-ring"></div>
          <div class="loader-pulse"></div>
        </div>
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
  });

  test('extract-state is visible on init', () => {
    initPopup();

    const extractState = document.getElementById('extract-state');
    expect(extractState.style.display).not.toBe('none');
  });

  test('loading-state is hidden on init', () => {
    initPopup();

    const loadingState = document.getElementById('loading-state');
    expect(loadingState.style.display).toBe('none');
  });

  test('clicking Extract shows loading-state', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    const loadingState = document.getElementById('loading-state');
    expect(loadingState.style.display).not.toBe('none');
  });

  test('clicking Extract hides extract-state', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    const extractState = document.getElementById('extract-state');
    expect(extractState.style.display).toBe('none');
  });

  test('loader container is present in loading-state', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    const loader = document.getElementById('loading-state').firstElementChild;
    expect(loader).not.toBeNull();
    // loader has multiple child elements (rings + pulse)
    expect(loader.children.length).toBeGreaterThanOrEqual(2);
  });

  test('progress element is present in loading-state', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    const progress = document.getElementById('progress');
    expect(progress).not.toBeNull();
    expect(progress.textContent).toBeTruthy();
  });

  test('download-state and error-state remain hidden while loading', () => {
    initPopup();

    document.getElementById('extract-btn').click();

    expect(document.getElementById('download-state').style.display).toBe('none');
    expect(document.getElementById('error-state').style.display).toBe('none');
  });
});
