/**
 * Task: 26b6fbf5 — Background stores generated Markdown in chrome.storage.session
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage, resetState } from './background.js';

const SAMPLE_PAYLOAD = {
  'visual-foundations': { colors: ['#fff'] },
  'tokens': { spacing: [4, 8] },
  'components': { button: true },
  'layout-patterns': { grid: true },
  'animations': { duration: '200ms' },
  'iconography': { icons: [] },
  'accessibility': { contrast: 'AA' },
};

describe('Background — store Markdown in chrome.storage.session', () => {
  let mockStorageSet;
  let mockStorageGet;

  beforeEach(() => {
    mockStorageSet = mock(() => Promise.resolve());
    mockStorageGet = mock(() => Promise.resolve({}));

    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => Promise.resolve()),
        lastError: null,
      },
      tabs: { query: mock(() => Promise.resolve([{ id: 1 }])) },
      scripting: { executeScript: mock(() => Promise.resolve()) },
      storage: {
        session: {
          set: mockStorageSet,
          get: mockStorageGet,
        },
      },
    };

    resetState();
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  test('calls chrome.storage.session.set when MARKDOWN_GENERATE is received', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    expect(mockStorageSet).toHaveBeenCalledTimes(1);
  });

  test('stores markdown string under the key "extractedMarkdown"', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    const [storedObj] = mockStorageSet.mock.calls[0];
    expect(storedObj).toHaveProperty('extractedMarkdown');
    expect(typeof storedObj.extractedMarkdown).toBe('string');
  });

  test('stored Markdown is non-empty', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    const [storedObj] = mockStorageSet.mock.calls[0];
    expect(storedObj.extractedMarkdown.length).toBeGreaterThan(0);
  });

  test('does not write to storage for other message types', async () => {
    await handleMessage({ type: 'EXTRACT_START' });
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: {} });

    expect(mockStorageSet).not.toHaveBeenCalled();
  });

  test('stores domain metadata alongside the Markdown', async () => {
    await handleMessage({ type: 'MARKDOWN_GENERATE', payload: SAMPLE_PAYLOAD });

    const [storedObj] = mockStorageSet.mock.calls[0];
    expect(storedObj).toHaveProperty('extractionMeta');
    expect(storedObj.extractionMeta).toHaveProperty('storedAt');
  });
});
