/**
 * Task: 4e57fe7a — Background assembles all 7 layer chunks and invokes Markdown generation
 * Spec: b169e77d — Extension Messaging and Lifecycle
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { handleMessage, resetState } from './background.js';

const LAYERS = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

async function sendAllLayers(overrides = {}) {
  for (const layer of LAYERS) {
    await handleMessage({
      type: 'LAYER_DATA',
      layer,
      data: overrides[layer] ?? { [layer]: true },
    });
  }
}

describe('Background — layer assembly + Markdown invocation', () => {
  beforeEach(() => {
    globalThis.chrome = {
      runtime: {
        sendMessage: mock(() => Promise.resolve()),
        lastError: null,
      },
      tabs: { query: mock(() => Promise.resolve([{ id: 1 }])) },
      scripting: { executeScript: mock(() => Promise.resolve()) },
    };
    resetState();
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  test('does not invoke Markdown generation until all 7 layers arrive', async () => {
    const { generateMarkdown } = await import('./background.js');

    // Send only 6 layers
    for (const layer of LAYERS.slice(0, 6)) {
      await handleMessage({ type: 'LAYER_DATA', layer, data: {} });
    }

    // generateMarkdown should not have been called — checked via EXTRACTION_COMPLETE absence
    const calls = globalThis.chrome.runtime.sendMessage.mock.calls;
    const completeCalls = calls.filter(([m]) => m.type === 'EXTRACTION_COMPLETE');
    expect(completeCalls).toHaveLength(0);
  });

  test('invokes Markdown generation after all 7 layers are received', async () => {
    await sendAllLayers();

    const calls = globalThis.chrome.runtime.sendMessage.mock.calls;
    const markdownCall = calls.find(([m]) => m.type === 'MARKDOWN_GENERATE');
    expect(markdownCall).toBeDefined();
  });

  test('assembled payload passed to Markdown generation contains all 7 layers', async () => {
    await sendAllLayers();

    const calls = globalThis.chrome.runtime.sendMessage.mock.calls;
    const markdownCall = calls.find(([m]) => m.type === 'MARKDOWN_GENERATE');
    const payload = markdownCall[0].payload;

    for (const layer of LAYERS) {
      expect(payload).toHaveProperty(layer);
    }
  });

  test('resets chunk accumulator after assembly so a new extraction can start', async () => {
    await sendAllLayers();
    resetState();

    // Send all layers again — should trigger Markdown generation a second time
    await sendAllLayers();

    const calls = globalThis.chrome.runtime.sendMessage.mock.calls;
    const markdownCalls = calls.filter(([m]) => m.type === 'MARKDOWN_GENERATE');
    expect(markdownCalls).toHaveLength(2);
  });

  test('duplicate layer chunks are overwritten, not accumulated', async () => {
    // Send tokens twice, then remaining layers
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: { v: 1 } });
    await handleMessage({ type: 'LAYER_DATA', layer: 'tokens', data: { v: 2 } });

    for (const layer of LAYERS.filter(l => l !== 'tokens')) {
      await handleMessage({ type: 'LAYER_DATA', layer, data: {} });
    }

    const calls = globalThis.chrome.runtime.sendMessage.mock.calls;
    const markdownCall = calls.find(([m]) => m.type === 'MARKDOWN_GENERATE');
    expect(markdownCall[0].payload.tokens).toEqual({ v: 2 });
  });
});
