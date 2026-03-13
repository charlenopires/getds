/**
 * Task: 25a54b2b — Content script sends 7 chunked layer extraction messages to background
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { runExtraction } from './content.js';

const LAYERS = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

describe('Content script — 7-layer chunked extraction', () => {
  let mockSendMessage;
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;

    mockSendMessage = mock(() => Promise.resolve());
    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        lastError: null,
      },
    };
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.chrome;
  });

  test('sends exactly 7 messages to background', async () => {
    await runExtraction();

    expect(mockSendMessage).toHaveBeenCalledTimes(7);
  });

  test('each message has a layer identifier matching the 7 layers', async () => {
    await runExtraction();

    const sentLayers = mockSendMessage.mock.calls.map(([msg]) => msg.layer);
    expect(sentLayers).toEqual(LAYERS);
  });

  test('each message has type LAYER_DATA', async () => {
    await runExtraction();

    const types = mockSendMessage.mock.calls.map(([msg]) => msg.type);
    expect(types.every(t => t === 'LAYER_DATA')).toBe(true);
  });

  test('each message includes a data payload', async () => {
    await runExtraction();

    for (const [msg] of mockSendMessage.mock.calls) {
      expect(msg).toHaveProperty('data');
      expect(typeof msg.data).toBe('object');
    }
  });

  test('messages are sent in layer order', async () => {
    await runExtraction();

    const sentLayers = mockSendMessage.mock.calls.map(([msg]) => msg.layer);
    for (let i = 0; i < LAYERS.length; i++) {
      expect(sentLayers[i]).toBe(LAYERS[i]);
    }
  });
});
