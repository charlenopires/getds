/**
 * Content script — 7-layer extraction engine
 * Spec: b169e77d
 */

const LAYERS = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

function extractLayer(layer) {
  // Stub extractors — each will be fleshed out in their own specs
  return { layer, extractedAt: Date.now() };
}

export async function runExtraction() {
  for (const layer of LAYERS) {
    const data = extractLayer(layer);
    await chrome.runtime.sendMessage({ type: 'LAYER_DATA', layer, data });
  }
}

// Auto-run when injected by background (not during tests)
if (typeof chrome !== 'undefined' && !globalThis.__TEST__) {
  runExtraction();
}
