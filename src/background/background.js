/**
 * Background service worker — Extension Messaging and Lifecycle
 * Spec: b169e77d
 *
 * Orchestrates extension processes, maintains the extraction state,
 * and handles messages passing between `content` scripts and the `popup` UI.
 */

import { assembleReport } from '../content/assembleReport.js';

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
let extractingTabUrl = '';
let extractingTabTitle = '';
let extractionStartTime = 0;

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
  extractingTabUrl = '';
  extractingTabTitle = '';
  extractionStartTime = 0;
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
 * Generates the Markdown report from the collected layer payload and sends
 * EXTRACTION_COMPLETE to the popup. Called directly (not via message-passing)
 * because service workers do not receive their own chrome.runtime.sendMessage.
 */
async function generateAndSendMarkdown(payload, tabUrl, tabTitle, startTime) {
  console.log('[getds:bg] generating markdown for layers:', Object.keys(payload));

  const completedAt = Date.now();
  const duration    = startTime ? completedAt - startTime : 0;

  const meta = {
    url:         tabUrl   || 'unknown',
    title:       tabTitle || 'Untitled',
    extractedAt: new Date(completedAt).toISOString(),
    dsx_version: '0.1.0',
    duration,
  };

  let markdown;
  try {
    markdown = assembleReport(payload, meta);
  } catch (err) {
    console.error('[getds:bg] assembleReport failed, falling back to stub:', err.message);
    markdown = buildMarkdownStub(payload);
  }

  const layers = Object.keys(payload);

  await chrome.storage.session.set({
    extractedMarkdown: markdown,
    extractionMeta: { storedAt: completedAt, layers },
  });

  const vf   = payload['visual-foundations'] ?? {};
  const comp = payload['components'] ?? {};
  const anim = payload['animations'] ?? {};
  const a11y = payload['accessibility'] ?? {};

  console.log('[getds:bg] sending EXTRACTION_COMPLETE');
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
  console.log('[getds:bg] handleMessage:', message.type);

  if (message.type === 'EXTRACT_START') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { console.warn('[getds:bg] EXTRACT_START: no active tab'); return; }

    extractingTabId    = tab.id;
    extractingTabUrl   = tab.url   ?? '';
    extractingTabTitle = tab.title ?? '';
    extractionStartTime = Date.now();
    console.log('[getds:bg] injecting content.js into tab', tab.id, tab.url);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dist/content.js'],
      });
      console.log('[getds:bg] content.js injected');
    } catch (err) {
      console.error('[getds:bg] script injection failed:', err.message);
      await chrome.runtime.sendMessage({ type: 'EXTRACTION_CANCELLED' });
    }
  }

  if (message.type === 'STEP_UPDATE') {
    await chrome.runtime.sendMessage({ type: 'STEP_UPDATE', text: message.text });
  }

  if (message.type === 'LAYER_DATA') {
    console.log('[getds:bg] LAYER_DATA received:', message.layer);
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
      console.log('[getds:bg] all 7 layers received, generating markdown');
      const payload   = { ...chunks };
      const tabUrl    = extractingTabUrl;
      const tabTitle  = extractingTabTitle;
      const startTime = extractionStartTime;
      resetState();

      await generateAndSendMarkdown(payload, tabUrl, tabTitle, startTime);
    }
  }

  if (message.type === 'DOWNLOAD_REQUEST') {
    const result = await chrome.storage.session.get(['extractedMarkdown', 'extractionMeta']);
    const markdown = result.extractedMarkdown;
    if (!markdown) return;

    const domain = extractDomain(message.tabUrl);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `design-system-${domain}-${date}.md`;

    // URL.createObjectURL is not available in MV3 service workers — use data URL instead
    const base64 = btoa(unescape(encodeURIComponent(markdown)));
    const dataUrl = `data:text/markdown;base64,${base64}`;

    await chrome.downloads.download({ url: dataUrl, filename });
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

// Register listeners in extension context (not during tests)
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  // Keep service worker alive while popup port is open (MV3 requirement)
  // Heartbeat ping every 20s prevents Chrome from terminating the SW mid-extraction
  chrome.runtime.onConnect.addListener((port) => {
    console.log('[getds:bg] port connected:', port.name);
    if (port.name === 'extraction') {
      const keepAlive = setInterval(() => {
        try {
          port.postMessage({ type: 'ping' });
        } catch {
          clearInterval(keepAlive);
        }
      }, 20_000);

      port.onDisconnect.addListener(() => {
        clearInterval(keepAlive);
        console.log('[getds:bg] extraction port disconnected');
      });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender) => {
    handleMessage(message).catch(err => console.error('[getds:bg] message error:', err));
  });
}
