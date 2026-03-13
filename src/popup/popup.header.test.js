/**
 * Task: 7eee809d — Popup header: page title and favicon of the analyzed tab
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initPopup } from './popup.js';

describe('Popup — header page title and favicon', () => {
  let window;
  let document;
  let tabsQueryCallback;

  const setupWithTab = (tab) => {
    globalThis.chrome.tabs.query = mock((_, cb) => { cb([tab]); });
  };

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => {}),
        connect: mock(() => ({ onDisconnect: { addListener: mock(() => {}) } })),
        onMessage: { addListener: mock(() => {}) },
        lastError: null,
      },
      tabs: { query: mock(() => {}) },
    };

    document.body.innerHTML = `
      <header>
        <div id="favicon-placeholder"></div>
        <img id="page-favicon" style="display:none" src="" alt="" />
        <span id="page-title">Design System Extractor</span>
      </header>
      <div id="extract-state">
        <button id="extract-btn">Extract</button>
        <p id="status"></p>
      </div>
      <div id="loading-state" style="display:none"><p id="progress"></p></div>
      <div id="download-state" style="display:none"><button id="download-btn">Download</button></div>
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

  test('sets page title from active tab', () => {
    setupWithTab({ title: 'Example Domain', favIconUrl: '' });
    initPopup();
    expect(document.getElementById('page-title').textContent).toBe('Example Domain');
  });

  test('shows favicon image when tab has favIconUrl', () => {
    setupWithTab({ title: 'Example', favIconUrl: 'https://example.com/favicon.ico' });
    initPopup();
    const favicon = document.getElementById('page-favicon');
    expect(favicon.src).toBe('https://example.com/favicon.ico');
    expect(favicon.style.display).not.toBe('none');
  });

  test('hides placeholder when favicon is loaded', () => {
    setupWithTab({ title: 'Example', favIconUrl: 'https://example.com/favicon.ico' });
    initPopup();
    const placeholder = document.getElementById('favicon-placeholder');
    expect(placeholder.style.display).toBe('none');
  });

  test('does not change title when tab has no title', () => {
    setupWithTab({ title: '', favIconUrl: '' });
    initPopup();
    expect(document.getElementById('page-title').textContent).toBe('Design System Extractor');
  });

  test('keeps placeholder visible when tab has no favicon', () => {
    setupWithTab({ title: 'Example', favIconUrl: '' });
    initPopup();
    const favicon = document.getElementById('page-favicon');
    expect(favicon.style.display).toBe('none');
  });

  test('does not throw when chrome.tabs is unavailable', () => {
    delete globalThis.chrome.tabs;
    expect(() => initPopup()).not.toThrow();
  });

  test('does not throw when tabs array is empty', () => {
    globalThis.chrome.tabs.query = mock((_, cb) => { cb([]); });
    expect(() => initPopup()).not.toThrow();
  });
});
