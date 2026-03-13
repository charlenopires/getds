/**
 * Task: fb517496 — Background injects content script into active tab via chrome.scripting.executeScript
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage } from './background.js';

describe('Background — content script injection', () => {
  let mockExecuteScript;
  let mockGetActive;

  beforeEach(() => {
    mockExecuteScript = mock(() => Promise.resolve());
    mockGetActive = mock(() =>
      Promise.resolve([{ id: 42, url: 'https://example.com' }])
    );

    globalThis.chrome = {
      scripting: {
        executeScript: mockExecuteScript,
      },
      tabs: {
        query: mockGetActive,
      },
      runtime: {
        lastError: null,
      },
    };
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  test('calls executeScript with activeTab id on EXTRACT_START', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    expect(mockGetActive).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(mockExecuteScript).toHaveBeenCalledTimes(1);
    expect(mockExecuteScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ['src/content/content.js'],
    });
  });

  test('does not call executeScript for unknown message types', async () => {
    await handleMessage({ type: 'UNKNOWN' });

    expect(mockExecuteScript).not.toHaveBeenCalled();
  });

  test('does not call executeScript if no active tab found', async () => {
    mockGetActive = mock(() => Promise.resolve([]));
    globalThis.chrome.tabs.query = mockGetActive;

    await handleMessage({ type: 'EXTRACT_START' });

    expect(mockExecuteScript).not.toHaveBeenCalled();
  });
});
