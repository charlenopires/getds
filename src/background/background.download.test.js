/**
 * Task: 30ffcf87 — Background creates Blob and triggers chrome.downloads.download
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage, resetState } from './background.js';

describe('Background — DOWNLOAD_REQUEST → chrome.downloads.download', () => {
  let mockDownload;
  let mockStorageGet;
  let mockCreateObjectURL;

  beforeEach(() => {
    mockDownload = mock(() => Promise.resolve());
    mockStorageGet = mock(() =>
      Promise.resolve({
        extractedMarkdown: '# Design System\n\n## tokens\n',
        extractionMeta: { storedAt: Date.now(), layers: ['tokens'] },
      })
    );
    mockCreateObjectURL = mock(() => 'blob:chrome-extension://fake/uuid');
    // Patch only createObjectURL, preserving the URL constructor
    globalThis._origCreateObjectURL = globalThis.URL?.createObjectURL;
    if (globalThis.URL) {
      globalThis.URL.createObjectURL = mockCreateObjectURL;
    } else {
      globalThis.URL = { createObjectURL: mockCreateObjectURL };
    }

    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => Promise.resolve()),
        lastError: null,
      },
      tabs: { query: mock(() => Promise.resolve([{ id: 1, url: 'https://example.com/page' }])) },
      scripting: { executeScript: mock(() => Promise.resolve()) },
      storage: {
        session: {
          set: mock(() => Promise.resolve()),
          get: mockStorageGet,
        },
      },
      downloads: {
        download: mockDownload,
      },
    };

    resetState();
  });

  afterEach(() => {
    delete globalThis.chrome;
    if (globalThis._origCreateObjectURL !== undefined) {
      globalThis.URL.createObjectURL = globalThis._origCreateObjectURL;
    }
    delete globalThis._origCreateObjectURL;
  });

  test('calls chrome.downloads.download on DOWNLOAD_REQUEST', async () => {
    await handleMessage({ type: 'DOWNLOAD_REQUEST', tabUrl: 'https://example.com/page' });

    expect(mockDownload).toHaveBeenCalledTimes(1);
  });

  test('reads extractedMarkdown from chrome.storage.session', async () => {
    await handleMessage({ type: 'DOWNLOAD_REQUEST', tabUrl: 'https://example.com' });

    expect(mockStorageGet).toHaveBeenCalledWith('extractedMarkdown');
  });

  test('creates object URL from Markdown Blob', async () => {
    await handleMessage({ type: 'DOWNLOAD_REQUEST', tabUrl: 'https://example.com' });

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
  });

  test('filename follows ds-{domain}-{date}-{time}.md format', async () => {
    const OrigDate = Date;
    globalThis.Date = class extends OrigDate {
      constructor(...args) { super(...(args.length ? args : ['2026-03-13T10:00:00Z'])); }
      toISOString() { return '2026-03-13T10:00:00.000Z'; }
    };

    await handleMessage({ type: 'DOWNLOAD_REQUEST', tabUrl: 'https://example.com/page' });

    const [{ filename }] = mockDownload.mock.calls[0];
    expect(filename).toMatch(/^ds-example\.com-\d{4}-\d{2}-\d{2}-\d{4}\.md$/);

    globalThis.Date = OrigDate;
  });

  test('uses blob URL as download url', async () => {
    await handleMessage({ type: 'DOWNLOAD_REQUEST', tabUrl: 'https://example.com' });

    const [{ url }] = mockDownload.mock.calls[0];
    expect(url).toBe('blob:chrome-extension://fake/uuid');
  });

  test('does not trigger download if no Markdown in storage', async () => {
    mockStorageGet = mock(() => Promise.resolve({}));
    globalThis.chrome.storage.session.get = mockStorageGet;

    await handleMessage({ type: 'DOWNLOAD_REQUEST', tabUrl: 'https://example.com' });

    expect(mockDownload).not.toHaveBeenCalled();
  });
});
