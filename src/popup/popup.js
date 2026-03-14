/**
 * Popup entry point — Extension Messaging and Lifecycle
 * Spec: b169e77d
 * 
 * Manages the UI lifecycle of the Chrome extension popup.
 * Handles the logic for starting extraction, tracking progress,
 * handling failures, and providing download capabilities for the extracted markdown.
  * 
 * @example
 * // Usage of popup
*/

const LAYER_LABELS = {
  'visual-foundations': 'Extracting colors & visual foundations…',
  'tokens':             'Generating design tokens…',
  'components':         'Detecting components…',
  'layout-patterns':    'Analysing layout patterns…',
  'animations':         'Capturing animations…',
  'iconography':        'Scanning iconography…',
  'accessibility':      'Checking accessibility…',
};

/**
 * Switches the visible state container of the popup UI.
 * 
 * Hides all possible state containers and displays only the one
 * matching the specified `name`.
 * 
 * @param {('extract'|'loading'|'download'|'error')} name - The state name to display.
 * 
 * @example
 * showState('loading');
 * // Displays <div id="loading-state"> and hides the others
 */
function showState(name) {
  const ids = ['extract-state', 'loading-state', 'download-state', 'error-state'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === `${name}-state` ? '' : 'none';
  });
}

/**
 * Initializes the popup logic by attaching event listeners to buttons
 * and listening for runtime messages from the background service worker.
 * 
 * @example
 * document.addEventListener('DOMContentLoaded', initPopup);
 */
export function initPopup() {
  // Load page favicon and title into the header
  loadPageMeta();

  const extractBtn = document.getElementById('extract-btn');
  if (extractBtn) {
    extractBtn.addEventListener('click', () => {
      startExtraction();
    });
  }

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabUrl = tabs?.[0]?.url ?? '';
        chrome.runtime.sendMessage({ type: 'DOWNLOAD_REQUEST', tabUrl });
      });
    });
  }

  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      retryBtn.style.display = 'none';
      startExtraction();
    });
  }

  if (chrome.runtime.onMessage?.addListener) {
    chrome.runtime.onMessage.addListener((message) => {
      console.log('[getds] popup received message:', message.type, message);
      if (message.type === 'EXTRACTION_CANCELLED') {
        resetPopupState('Extraction cancelled — page navigated away.');
      }
      if (message.type === 'EXTRACTION_COMPLETE') {
        handleExtractionComplete(message);
      }
      if (message.type === 'PROGRESS_UPDATE') {
        updateProgress(message.layer);
      }
      if (message.type === 'STEP_UPDATE') {
        const progress = document.getElementById('progress');
        if (progress && message.text) progress.textContent = message.text;
      }
    });
  }
}

/**
 * Reads metadata (title and faviconURL) from the active Chrome tab
 * and displays it inside the popup header elements.
 */
function loadPageMeta() {
  if (!chrome.tabs?.query) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab) return;

    const titleEl = document.getElementById('page-title');
    const faviconEl = document.getElementById('page-favicon');
    const placeholderEl = document.getElementById('favicon-placeholder');

    if (titleEl && tab.title) titleEl.textContent = tab.title;

    if (faviconEl && tab.favIconUrl) {
      faviconEl.src = tab.favIconUrl;
      faviconEl.alt = '';
      faviconEl.style.display = '';
      if (placeholderEl) placeholderEl.style.display = 'none';
    }
  });
}

/**
 * Starts the extraction process by emitting the `EXTRACT_START` message
 * to the background worker and putting the popup into the loading state.
 */
function startExtraction() {
  console.log('[getds] startExtraction: sending EXTRACT_START');
  chrome.runtime.sendMessage({ type: 'EXTRACT_START' });

  // Transition to loading state
  showState('loading');

  // Legacy: hide extract btn + show progress for flat-DOM tests
  const extractBtn = document.getElementById('extract-btn');
  const progress = document.getElementById('progress');
  if (extractBtn) extractBtn.style.display = 'none';
  if (progress) {
    progress.style.display = '';
    progress.textContent = 'Initialising…';
  }

  // Open a long-lived port to detect service worker termination
  if (!chrome.runtime.connect) return;

  let extractionDone = false;

  const port = chrome.runtime.connect({ name: 'extraction' });
  console.log('[getds] port connected to service worker');

  // Respond to keepalive pings from the background
  port.onMessage.addListener((msg) => {
    if (msg.type === 'ping') {
      try { port.postMessage({ type: 'pong' }); } catch { /* port closing */ }
    }
  });

  port.onDisconnect.addListener(() => {
    if (extractionDone) return; // Normal disconnect after a successful extraction
    console.warn('[getds] port disconnected — service worker may have terminated');
    const retryBtn = document.getElementById('retry-btn');
    const status = document.getElementById('status');
    const errorMsg = document.getElementById('error-message');
    const msg = 'Connection lost — service worker terminated. Retry?';

    showState('error');

    if (retryBtn) retryBtn.style.display = '';
    if (status) status.textContent = msg;
    if (errorMsg) errorMsg.textContent = msg;
  });

  // Mark done when the extraction completes so a late disconnect doesn't re-show the error
  const doneListener = (message) => {
    if (message.type === 'EXTRACTION_COMPLETE' || message.type === 'EXTRACTION_CANCELLED') {
      extractionDone = true;
      chrome.runtime.onMessage.removeListener(doneListener);
    }
  };
  chrome.runtime.onMessage.addListener(doneListener);
}

/**
 * Updates the text progress indicator based on the current layer being extracted.
 * 
 * @param {string} layer - The key representing the current abstraction layer.
 * 
 * @example
 * updateProgress('tokens');
 * // Updates UI to show "Generating design tokens…"
 */
function updateProgress(layer) {
  const progress = document.getElementById('progress');
  if (progress && layer) {
    progress.textContent = LAYER_LABELS[layer] ?? `Extracting ${layer}…`;
  }
}

/**
 * Transitions the popup to the "download" state and populates the summary statistics
 * when the extraction is finished successfully.
 * 
 * @param {Object} message - The completion message from the background worker.
 * @param {Object} message.summary - The extraction summary payload.
 */
function handleExtractionComplete(message) {
  showState('download');

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) downloadBtn.style.display = '';

  const { summary } = message;
  if (!summary) return;

  /**

   * Helper function set.

   * 

   * @param {any} id - Parameter id.

   * @param {any} val - Parameter val.

   * 

   * @example

   * set(id, val);

   */

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val != null ? String(val) : '–';
  };

  set('count-colors',     summary.colors);
  set('count-fonts',      summary.fonts);
  set('count-components', summary.components);
  set('count-a11y',       summary.a11yIssues);

  const limitations = message.limitations ?? [];
  const badge = document.getElementById('warnings-badge');
  if (badge) {
    if (limitations.length > 0) {
      badge.textContent = `${limitations.length} warning${limitations.length === 1 ? '' : 's'}`;
      badge.setAttribute('aria-label', `${limitations.length} warning${limitations.length === 1 ? '' : 's'} encountered during extraction`);
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * Resets the popup UI to the original starting state (prior to extraction).
 * Used typically when extraction is aborted (like tab navigation).
 * 
 * @param {string} [statusText] - Optional status message describing the failure reason.
 */
// Auto-init when loaded in browser context (not during tests)
if (typeof document !== 'undefined' && !globalThis.__TEST__) {
  document.addEventListener('DOMContentLoaded', initPopup);
}

function resetPopupState(statusText) {
  showState('extract');

  // Legacy: restore individual elements for flat-DOM tests
  const progress = document.getElementById('progress');
  const extractBtn = document.getElementById('extract-btn');
  const status = document.getElementById('status');

  if (progress) progress.style.display = 'none';
  if (extractBtn) extractBtn.style.display = '';
  if (status) status.textContent = statusText ?? '';
}
