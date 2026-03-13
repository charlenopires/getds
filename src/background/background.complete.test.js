/**
 * Task: 498815b7 — Background sends EXTRACTION_COMPLETE message with summary metadata to popup
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage, resetState } from './background.js';

const SAMPLE_PAYLOAD = {
  'visual-foundations': { colors: ['#fff', '#000'] },
  'tokens': { spacing: [4, 8, 16] },
  'components': { button: true, input: true },
  'layout-patterns': { grid: true },
  'animations': { duration: '200ms' },
  'iconography': { icons: ['arrow', 'close'] },
  'accessibility': { contrast: 'AA' },
};

describe('Background — EXTRACTION_COMPLETE after storage', () => {
  let mockSendMessage;
  let mockStorageSet;

  beforeEach(() => {
    mockSendMessage = mock(() => Promise.resolve());
    mockStorageSet = mock(() => Promise.resolve());

    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        lastError: null,
      },
      tabs: { query: mock(() => Promise.resolve([{ id: 1 }])) },
      scripting: { executeScript: mock(() => Promise.resolve()) },
      storage: {
        session: {
          set: mockStorageSet,
          get: mock(() => Promise.resolve({})),
        },
      },
    };

    resetState();
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  test('sends EXTRACTION_COMPLETE after storing Markdown', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    const completeCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'EXTRACTION_COMPLETE'
    );
    expect(completeCalls).toHaveLength(1);
  });

  test('EXTRACTION_COMPLETE is sent after storage.session.set resolves', async () => {
    const order = [];
    mockStorageSet = mock(() => { order.push('storage'); return Promise.resolve(); });
    mockSendMessage = mock((msg) => { if (msg.type === 'EXTRACTION_COMPLETE') order.push('complete'); return Promise.resolve(); });
    globalThis.chrome.storage.session.set = mockStorageSet;
    globalThis.chrome.runtime.sendMessage = mockSendMessage;

    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    expect(order).toEqual(['storage', 'complete']);
  });

  test('EXTRACTION_COMPLETE includes layerCount in summary', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    const [msg] = mockSendMessage.mock.calls
      .map(([m]) => m)
      .filter(m => m.type === 'EXTRACTION_COMPLETE');

    expect(msg.summary).toHaveProperty('layerCount', 7);
  });

  test('EXTRACTION_COMPLETE includes completedAt timestamp', async () => {
    const before = Date.now();
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });
    const after = Date.now();

    const [msg] = mockSendMessage.mock.calls
      .map(([m]) => m)
      .filter(m => m.type === 'EXTRACTION_COMPLETE');

    expect(msg.summary.completedAt).toBeGreaterThanOrEqual(before);
    expect(msg.summary.completedAt).toBeLessThanOrEqual(after);
  });

  test('EXTRACTION_COMPLETE includes list of extracted layers', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    const [msg] = mockSendMessage.mock.calls
      .map(([m]) => m)
      .filter(m => m.type === 'EXTRACTION_COMPLETE');

    expect(msg.summary.layers).toEqual(Object.keys(SAMPLE_PAYLOAD));
  });

  test('does not send EXTRACTION_COMPLETE for other message types', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    const completeCalls = mockSendMessage.mock.calls.filter(
      ([m]) => m.type === 'EXTRACTION_COMPLETE'
    );
    expect(completeCalls).toHaveLength(0);
  });
});
