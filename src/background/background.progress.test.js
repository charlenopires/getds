/**
 * Task: 47bdc879 — Background sends PROGRESS_UPDATE messages to popup after each layer chunk received
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage } from './background.js';

const LAYERS = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

describe('Background — PROGRESS_UPDATE on LAYER_DATA', () => {
  let mockSendMessage;
  let mockTabsQuery;

  beforeEach(() => {
    mockSendMessage = mock(() => Promise.resolve());
    mockTabsQuery = mock(() => Promise.resolve([{ id: 1, url: 'https://example.com' }]));

    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        lastError: null,
      },
      tabs: {
        query: mockTabsQuery,
      },
      scripting: {
        executeScript: mock(() => Promise.resolve()),
      },
    };
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  test('sends PROGRESS_UPDATE when receiving LAYER_DATA', async () => {
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: {} });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0][0].type).toBe('PROGRESS_UPDATE');
  });

  test('PROGRESS_UPDATE includes the current layer name', async () => {
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: {} });

    const msg = mockSendMessage.mock.calls[0][0];
    expect(msg.layer).toBe('tokens');
  });

  test('PROGRESS_UPDATE percentage reflects position in 7-layer sequence', async () => {
    // visual-foundations is layer 1/7 → ~14%
    await handleMessage({ type: 'LAYER_DATA', layer: 'visual-foundations', data: {} });
    expect(mockSendMessage.mock.calls[0][0].percent).toBe(Math.round((1 / 7) * 100));

    // tokens is layer 2/7 → ~29%
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: {} });
    expect(mockSendMessage.mock.calls[1][0].percent).toBe(Math.round((2 / 7) * 100));
  });

  test('sends correct percent for each of the 7 layers', async () => {
    for (let i = 0; i < LAYERS.length; i++) {
      await handleMessage({ type: 'LAYER_DATA', layer: LAYERS[i], data: {} });
    }

    const progressCalls = mockSendMessage.mock.calls.filter(([msg]) => msg.type === 'PROGRESS_UPDATE');
    const percents = progressCalls.map(([msg]) => msg.percent);
    const expected = LAYERS.map((_, i) => Math.round(((i + 1) / 7) * 100));
    expect(percents).toEqual(expected);
  });

  test('does not send PROGRESS_UPDATE for non-LAYER_DATA messages', async () => {
    await handleMessage({ type: 'EXTRACT_START' });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
