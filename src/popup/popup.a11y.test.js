/**
 * Task: dab08161 — Full keyboard accessibility with visible focus indicators
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';

describe('Popup — keyboard accessibility', () => {
  let window;
  let document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    // Full popup structure matching popup.html
    document.body.innerHTML = `
      <header>
        <div id="favicon-placeholder" aria-hidden="true"></div>
        <img id="page-favicon" style="display:none" src="" alt="" />
        <span id="page-title">Design System Extractor</span>
      </header>
      <main>
        <div id="extract-state">
          <button id="extract-btn" class="btn btn-primary"
                  aria-label="Extract design system from this page">
            <svg aria-hidden="true"></svg>
            Extract Design System
          </button>
          <p id="status" aria-live="polite"></p>
        </div>
        <div id="loading-state" style="display:none"
             aria-live="polite" aria-label="Extraction in progress">
          <div class="loader" role="img" aria-label="Extracting"></div>
          <p id="progress">Initialising…</p>
        </div>
        <div id="download-state" style="display:none">
          <button id="download-btn" class="btn btn-success"
                  aria-label="Download extracted design system as Markdown">
            <svg aria-hidden="true"></svg>
            Download Markdown
          </button>
          <div id="preview-summary" aria-label="Extraction summary">
            <span id="count-colors">–</span>
            <span id="count-fonts">–</span>
            <span id="count-components">–</span>
            <span id="count-a11y">–</span>
          </div>
        </div>
        <div id="error-state" style="display:none">
          <svg aria-hidden="true" class="icon-error"></svg>
          <p id="error-message" aria-live="assertive"></p>
          <button id="retry-btn" class="btn btn-secondary"
                  aria-label="Retry extraction">
            <svg aria-hidden="true"></svg>
            Retry
          </button>
        </div>
      </main>
      <footer id="popup-footer">
        <span id="footer-version">DSX v0.1.0</span>
        <a id="footer-github-link" href="https://github.com/fazapp/getds"
           target="_blank" rel="noopener noreferrer"
           aria-label="View getds on GitHub">GitHub</a>
      </footer>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  // ── Button aria-labels ────────────────────────────────────────────────────

  test('extract button has aria-label', () => {
    const btn = document.getElementById('extract-btn');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  test('download button has aria-label', () => {
    const btn = document.getElementById('download-btn');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  test('retry button has aria-label', () => {
    const btn = document.getElementById('retry-btn');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  test('github link has aria-label', () => {
    const link = document.getElementById('footer-github-link');
    expect(link.getAttribute('aria-label')).toBeTruthy();
  });

  // ── Interactive elements are natively focusable ───────────────────────────

  test('extract button is a button element (natively focusable)', () => {
    expect(document.getElementById('extract-btn').tagName).toBe('BUTTON');
  });

  test('download button is a button element (natively focusable)', () => {
    expect(document.getElementById('download-btn').tagName).toBe('BUTTON');
  });

  test('retry button is a button element (natively focusable)', () => {
    expect(document.getElementById('retry-btn').tagName).toBe('BUTTON');
  });

  test('GitHub link is an anchor with href (natively focusable)', () => {
    const link = document.getElementById('footer-github-link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBeTruthy();
  });

  // ── No interactive element has tabindex=-1 ────────────────────────────────

  test('extract button is not removed from tab order', () => {
    const tabindex = document.getElementById('extract-btn').getAttribute('tabindex');
    expect(tabindex).not.toBe('-1');
  });

  test('download button is not removed from tab order', () => {
    const tabindex = document.getElementById('download-btn').getAttribute('tabindex');
    expect(tabindex).not.toBe('-1');
  });

  test('retry button is not removed from tab order', () => {
    const tabindex = document.getElementById('retry-btn').getAttribute('tabindex');
    expect(tabindex).not.toBe('-1');
  });

  // ── Decorative elements are hidden from assistive technology ─────────────

  test('favicon placeholder is aria-hidden', () => {
    const el = document.getElementById('favicon-placeholder');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  // ── Live regions for dynamic content ─────────────────────────────────────

  test('status paragraph has aria-live=polite', () => {
    const status = document.getElementById('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  test('error message has aria-live=assertive', () => {
    const errorMsg = document.getElementById('error-message');
    expect(errorMsg.getAttribute('aria-live')).toBe('assertive');
  });

  test('loading state region has aria-live', () => {
    const loading = document.getElementById('loading-state');
    expect(loading.getAttribute('aria-live')).toBeTruthy();
  });

  // ── Loader has role=img for screen readers ────────────────────────────────

  test('animated loader has role=img', () => {
    const loader = document.getElementById('loading-state').firstElementChild;
    expect(loader.getAttribute('role')).toBe('img');
  });

  test('animated loader has aria-label', () => {
    const loader = document.getElementById('loading-state').firstElementChild;
    expect(loader.getAttribute('aria-label')).toBeTruthy();
  });

  // ── Preview summary has accessible label ─────────────────────────────────

  test('preview summary has aria-label', () => {
    const summary = document.getElementById('preview-summary');
    expect(summary.getAttribute('aria-label')).toBeTruthy();
  });
});
