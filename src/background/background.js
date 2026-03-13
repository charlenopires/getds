/**
 * Background service worker — Extension Messaging and Lifecycle
 * Spec: b169e77d
 * 
 * Orchestrates extension processes, maintains the extraction state,
 * and handles messages passing between `content` scripts and the `popup` UI.
  * 
 * @example
 * // Usage of background
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

// Mutable extraction state — reset between extractions
let chunks = {};
let extractingTabId = null;

/**
 * Resets the extraction in progress.
 * Clears cached data chunks and the ID of the tab currently being extracted.
 * 
 * @example
 * resetState();
 * console.log(getExtractionState()); // { chunks: {}, extractingTabId: null }
 */
export function resetState() {
  chunks = {};
  extractingTabId = null;
}

/**
 * Returns a cloned copy of the current extraction state and active tab ID.
 * Useful for debugging and assertions.
 * 
 * @returns {{ chunks: Object, extractingTabId: number|null }}
 * 
 * @example
 * const state = getExtractionState();
 * if (state.extractingTabId === 1) { // Running on tab 1 }
 */
export function getExtractionState() {
  return { chunks: { ...chunks }, extractingTabId };
}

/**
 * Handles Chrome tab updates (like page navigations or refreshes).
 * If the current tab navigating away was the one being extracted,
 * the extraction is cancelled gracefully and state is reset.
 * 
 * @async
 * @param {number} tabId - The ID of the updated tab.
 * @param {Object} changeInfo - Metadata about the tab change (e.g. url).
 * 
 * @example
 * // Triggered internally by chrome.tabs.onUpdated
 * await handleTabUpdated(1, { url: 'https://new-url.com' });
 */
export async function handleTabUpdated(tabId, changeInfo) {
  if (!extractingTabId) return;
  if (tabId !== extractingTabId) return;
  if (!changeInfo.url) return;

  resetState();

  await chrome.runtime.sendMessage({ type: 'EXTRACTION_CANCELLED' });
}

/**
 * Main message broker for the extension.
 * Routes diverse messages (`EXTRACT_START`, `LAYER_DATA`, `MARKDOWN_GENERATE`, `DOWNLOAD_REQUEST`)
 * handling logic like injecting content scripts or computing markdown reports.
 * 
 * @async
 * @param {Object} message - Incoming message payload sent via the chrome runtime.
 * @param {string} message.type - Type describing the instruction logic path.
 * 
 * @example
 * // Initiate an extraction request via message passing
 * await handleMessage({ type: 'EXTRACT_START' });
 */
export async function handleMessage(message) {
  if (message.type === 'EXTRACT_START') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    extractingTabId = tab.id;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/content.js'],
    });
  }

  if (message.type === 'LAYER_DATA') {
    // Accumulate chunk (duplicate layer overwrites previous)
    chunks[message.layer] = message.data;

    // Send progress update
    const index = LAYERS.indexOf(message.layer);
    const position = index === -1 ? LAYERS.length : index + 1;
    const percent = Math.round((position / LAYERS.length) * 100);

    await chrome.runtime.sendMessage({
      type: 'PROGRESS_UPDATE',
      layer: message.layer,
      percent,
    });

    // When all 7 layers are received, invoke Markdown generation
    const receivedLayers = Object.keys(chunks);
    const allReceived = LAYERS.every(l => receivedLayers.includes(l));

    if (allReceived) {
      const payload = { ...chunks };
      resetState();

      await chrome.runtime.sendMessage({
        type: 'MARKDOWN_GENERATE',
        payload,
      });
    }
  }

  if (message.type === 'MARKDOWN_GENERATE') {
    // Stub Markdown generation — full implementation lives in MarkdownGeneration spec (b0d5a227)
    const markdown = buildMarkdownStub(message.payload);
    const layers = Object.keys(message.payload);
    const completedAt = Date.now();

    await chrome.storage.session.set({
      extractedMarkdown: markdown,
      extractionMeta: { storedAt: completedAt, layers },
    });

    const payload = message.payload;
    const vf = payload['visual-foundations'] ?? {};
    const comp = payload['components'] ?? {};
    const anim = payload['animations'] ?? {};
    const a11y = payload['accessibility'] ?? {};

    await chrome.runtime.sendMessage({
      type: 'EXTRACTION_COMPLETE',
      summary: {
        layerCount: layers.length,
        layers,
        completedAt,
        colors:     Array.isArray(vf.colors) ? vf.colors.length : 0,
        fonts:      Array.isArray(vf.fonts)  ? vf.fonts.length  : 0,
        components: Object.keys(comp).length,
        animations: Object.keys(anim).length,
        a11yIssues: Array.isArray(a11y.issues) ? a11y.issues.length : Object.keys(a11y).length,
      },
    });
  }

  if (message.type === 'DOWNLOAD_REQUEST') {
    const result = await chrome.storage.session.get('extractedMarkdown');
    const markdown = result.extractedMarkdown;
    if (!markdown) return;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const domain = extractDomain(message.tabUrl);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `design-system-${domain}-${date}.md`;

    await chrome.downloads.download({ url, filename });
  }
}

/**
 * Extracts and returns the domain hostname from a supplied absolute URL.
 * Falls back to returning `'unknown'` if the parsing fails.
 * 
 * @param {string} tabUrl - The URL of the tab processing the extraction.
 * @returns {string} The normalized hostname.
 * 
 * @example
 * const host = extractDomain('https://github.com/charlenopires/getds');
 * console.log(host); // "github.com"
 */
function extractDomain(tabUrl) {
  try {
    return new URL(tabUrl).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Stubs a Markdown file by stringifying JSON payload layers into sections.
 * (Production will feature sophisticated document generation mapping).
 * 
 * @param {Object} payload - Complete parsed payload aggregated from DOM extractions. 
 * @returns {string} Fully constructed markdown output ready for download.
 * 
 * @example
 * const md = buildMarkdownStub({ "tokens": { colors: [] } });
 */
function buildMarkdownStub(payload) {
  const layers = Object.keys(payload);
  const sections = layers
    .map(layer => `## ${layer}\n\n\`\`\`json\n${JSON.stringify(payload[layer], null, 2)}\n\`\`\``)
    .join('\n\n');

  return `# Design System Extract\n\n${sections}\n`;
}

// Register listener in extension context (not during tests)
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse);
    return true; // keep channel open for async response
  });
}
