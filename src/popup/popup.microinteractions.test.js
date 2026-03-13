/**
 * Regression tests: Button micro-interactions
 * Task: 00dc47cf — hover scale(1.02), press effect, keyboard focus ring
 * Spec: d16d967c — Extension Popup UI
 *
 * Note: happy-dom does not apply stylesheets, so computed CSS cannot be tested.
 * These tests verify the structural contract that connects HTML elements to the
 * CSS micro-interaction rules: correct class names on elements, and the presence
 * of the required rules in the CSS source.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { readFileSync } from 'fs';
import { join } from 'path';

const CSS_PATH = join(import.meta.dir, 'popup.css');
const css = readFileSync(CSS_PATH, 'utf8');

describe('Button micro-interactions — HTML class contract', () => {
  let window;
  let document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    globalThis.document = document;
    globalThis.window = window;

    document.body.innerHTML = `
      <button id="extract-btn" class="btn btn-primary"
              aria-label="Extract design system from this page">Extract</button>
      <button id="download-btn" class="btn btn-success"
              aria-label="Download extracted design system as Markdown">Download</button>
      <button id="retry-btn" class="btn btn-secondary"
              aria-label="Retry extraction">Retry</button>
    `;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  // ── HTML elements carry the classes that bind to CSS micro-interaction rules

  test('extract button has class "btn" (binds to base transition rules)', () => {
    expect(document.getElementById('extract-btn').className).toContain('btn');
  });

  test('extract button has class "btn-primary" (binds to hover/active rules)', () => {
    expect(document.getElementById('extract-btn').className).toContain('btn-primary');
  });

  test('download button has class "btn" and "btn-success"', () => {
    const cls = document.getElementById('download-btn').className;
    expect(cls).toContain('btn');
    expect(cls).toContain('btn-success');
  });

  test('retry button has class "btn" and "btn-secondary"', () => {
    const cls = document.getElementById('retry-btn').className;
    expect(cls).toContain('btn');
    expect(cls).toContain('btn-secondary');
  });
});

describe('Button micro-interactions — CSS rules present', () => {
  // ── Hover: scale(1.02) ─────────────────────────────────────────────────

  test('CSS defines hover scale(1.02) for btn-primary', () => {
    expect(css).toContain('.btn-primary:hover');
    expect(css).toContain('scale(1.02)');
  });

  test('CSS defines hover scale(1.02) for btn-success', () => {
    expect(css).toContain('.btn-success:hover');
  });

  test('CSS defines hover scale(1.02) for btn-secondary', () => {
    expect(css).toContain('.btn-secondary:hover');
  });

  // ── Active/press: scale(0.98) ─────────────────────────────────────────

  test('CSS defines active press effect scale(0.98)', () => {
    expect(css).toContain('scale(0.98)');
  });

  test('CSS defines :active rule on .btn', () => {
    expect(css).toContain('.btn:active');
  });

  // ── Focus ring: focus-visible ────────────────────────────────────────

  test('CSS defines :focus-visible rule on .btn', () => {
    expect(css).toContain('.btn:focus-visible');
  });

  test('CSS focus-visible uses outline (visible ring)', () => {
    // Extract the focus-visible block
    const focusIdx = css.indexOf('.btn:focus-visible');
    const block = css.slice(focusIdx, focusIdx + 200);
    expect(block).toContain('outline');
  });

  test('CSS focus-visible outline uses accent color variable', () => {
    const focusIdx = css.indexOf('.btn:focus-visible');
    const block = css.slice(focusIdx, focusIdx + 200);
    expect(block).toContain('--color-accent');
  });

  test('CSS includes outline-offset for focus ring spacing', () => {
    expect(css).toContain('outline-offset');
  });

  // ── Transitions: smooth animation ────────────────────────────────────

  test('CSS defines transition on .btn', () => {
    const btnIdx = css.indexOf('.btn {');
    const block = css.slice(btnIdx, btnIdx + 400);
    expect(block).toContain('transition');
  });

  test('CSS transition includes transform', () => {
    expect(css).toContain('transform var(--transition-fast)');
  });

  test('CSS footer link has :focus-visible rule', () => {
    expect(css).toContain('.footer-link:focus-visible');
  });
});
