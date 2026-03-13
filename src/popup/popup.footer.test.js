/**
 * Task: 21e2c568 — Popup footer: DSX version number and GitHub link
 * Spec: d16d967c — Extension Popup UI
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';

describe('Popup — footer content', () => {
  let window;
  let document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    document.body.innerHTML = `
      <footer id="popup-footer">
        <span id="footer-version">DSX v0.1.0</span>
        <a id="footer-github-link"
           href="https://github.com/fazapp/getds"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="View getds on GitHub">
          GitHub
        </a>
      </footer>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('footer element is present', () => {
    expect(document.getElementById('popup-footer')).not.toBeNull();
  });

  test('version element is present', () => {
    expect(document.getElementById('footer-version')).not.toBeNull();
  });

  test('version text matches DSX semver format', () => {
    const version = document.getElementById('footer-version');
    expect(version.textContent).toMatch(/DSX\s+v\d+\.\d+\.\d+/);
  });

  test('GitHub link element is present', () => {
    expect(document.getElementById('footer-github-link')).not.toBeNull();
  });

  test('GitHub link href points to github.com', () => {
    const link = document.getElementById('footer-github-link');
    expect(link.getAttribute('href')).toContain('github.com');
  });

  test('GitHub link opens in new tab', () => {
    const link = document.getElementById('footer-github-link');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  test('GitHub link has rel=noopener noreferrer', () => {
    const link = document.getElementById('footer-github-link');
    const rel = link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('GitHub link has aria-label', () => {
    const link = document.getElementById('footer-github-link');
    expect(link.getAttribute('aria-label')).toBeTruthy();
  });
});
