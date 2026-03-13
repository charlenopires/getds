/**
 * Content script — 7-layer extraction engine
 * Spec: b169e77d
 * 
 * This module is injected into the target web page to extract design decisions.
 * It systematically scans the DOM and CSSOM to retrieve design foundations,
 * tokens, components, patterns, and accessibility metadata.
 * 
 * @example
 * // The script is automatically run when injected
 * // It fetches layer by layer and posts them to the background worker.
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

/**
 * Extracts design data for a specific layer from the current page.
 * 
 * @param {string} layer - The name of the design layer to extract (e.g., 'visual-foundations').
 * @returns {Object} Extracted data object containing the layer name and timestamp.
 * 
 * @example
 * const data = extractLayer('components');
 * console.log(data); // { layer: 'components', extractedAt: 1678123456789 }
 */
function extractLayer(layer) {
  // Stub extractors — each will be fleshed out in their own specs
  return { layer, extractedAt: Date.now() };
}

/**
 * Orchestrates the extraction of all predefined design layers sequentially.
 * 
 * Sends the extracted data progressively to the extension's background script
 * using Chrome's message passing API.
 * 
 * @async
 * @returns {Promise<void>} Resolves when all layers have been extracted and dispatched.
 * 
 * @example
 * await runExtraction();
 * // Dispatches { type: 'LAYER_DATA', layer: 'tokens', data: {...} } to background
 */
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
