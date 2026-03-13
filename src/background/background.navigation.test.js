/**
 * Task: e4bf7ec5 — Handle tab navigation away during extraction — cancel gracefully and reset popup state
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage, handleTabUpdated, resetState, getExtractionState } from './background.js';

describe('Background — tab navigation cancels extraction', () => {
  let mockSendMessage;

  beforeEach(() => {
    mockSendMessage = mock(() => Promise.resolve());

    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        lastError: null,
      },
      tabs: {
        query: mock(() => Promise.resolve([{ id: 42, url: 'https://example.com' }])),
      },
      scripting: {
        executeScript: mock(() => Promise.resolve()),
      },
      storage: {
        session: {
          set: mock(() => Promise.resolve()),
          get: mock(() => Promise.resolve({})),
        },
      },
    };

    resetState();
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  test('tracks the active tab id when EXTRACT_START is received', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    const state = getExtractionState();
    expect(state.extractingTabId).toBe(42);
  });

  test('sends EXTRACTION_CANCELLED when tracked tab navigates away during extraction', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    // Simulate tab navigating away (url change = new navigation)
    await handleTabUpdated(42, { url: 'https://other.com' });

    const cancelCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'EXTRACTION_CANCELLED'
    );
    expect(cancelCalls).toHaveLength(1);
  });

  test('resets chunk state when tab navigates away', async () => {
    await handleMessage({ type: 'EXTRACT_START' });
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: { x: 1 } });

    await handleTabUpdated(42, { url: 'https://other.com' });

    const state = getExtractionState();
    expect(Object.keys(state.chunks)).toHaveLength(0);
    expect(state.extractingTabId).toBeNull();
  });

  test('does not send EXTRACTION_CANCELLED for untracked tab navigation', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    // Different tab navigates — should be ignored
    await handleTabUpdated(99, { url: 'https://other.com' });

    const cancelCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'EXTRACTION_CANCELLED'
    );
    expect(cancelCalls).toHaveLength(0);
  });

  test('does not send EXTRACTION_CANCELLED if no extraction is in progress', async () => {
    // No EXTRACT_START, so no tracked tab
    await handleTabUpdated(42, { url: 'https://other.com' });

    const cancelCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'EXTRACTION_CANCELLED'
    );
    expect(cancelCalls).toHaveLength(0);
  });

  test('does not cancel if tab update has no url change (e.g. loading state)', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    // Tab update without url property = not a navigation
    await handleTabUpdated(42, { status: 'loading' });

    const cancelCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'EXTRACTION_CANCELLED'
    );
    expect(cancelCalls).toHaveLength(0);
  });
});
