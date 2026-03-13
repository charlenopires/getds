/**
 * Popup entry point — Extension Messaging and Lifecycle
 * Spec: b169e77d
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

/** Switch the visible state container (extract | loading | download | error). */
function showState(name) {
  const ids = ['extract-state', 'loading-state', 'download-state', 'error-state'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === `${name}-state` ? '' : 'none';
  });
}

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
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_REQUEST' });
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
      if (message.type === 'EXTRACTION_CANCELLED') {
        resetPopupState('Extraction cancelled — page navigated away.');
      }
      if (message.type === 'EXTRACTION_COMPLETE') {
        handleExtractionComplete(message);
      }
      if (message.type === 'PROGRESS_UPDATE') {
        updateProgress(message.layer);
      }
    });
  }
}

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

function startExtraction() {
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

  const port = chrome.runtime.connect({ name: 'extraction' });
  port.onDisconnect.addListener(() => {
    const retryBtn = document.getElementById('retry-btn');
    const status = document.getElementById('status');
    const errorMsg = document.getElementById('error-message');
    const msg = 'Connection lost — service worker terminated. Retry?';

    showState('error');

    if (retryBtn) retryBtn.style.display = '';
    if (status) status.textContent = msg;
    if (errorMsg) errorMsg.textContent = msg;
  });
}

function updateProgress(layer) {
  const progress = document.getElementById('progress');
  if (progress && layer) {
    progress.textContent = LAYER_LABELS[layer] ?? `Extracting ${layer}…`;
  }
}

function handleExtractionComplete(message) {
  showState('download');

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) downloadBtn.style.display = '';

  const { summary } = message;
  if (!summary) return;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val != null ? String(val) : '–';
  };

  set('count-colors',     summary.colors);
  set('count-fonts',      summary.fonts);
  set('count-components', summary.components);
  set('count-a11y',       summary.a11yIssues);
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
