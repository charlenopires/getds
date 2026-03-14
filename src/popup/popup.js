import { listReports, getReport, deleteReport, markDownloaded } from '../lib/dbStorage.js';

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

// ── Reports section state ─────────────────────────────────────────────────
const REPORTS_PER_PAGE = 4;
let reportsPage = 1;

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
  initReportsSection();

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
      if (message.type === 'REPORT_SAVED') {
        reportsPage = 1;
        renderReports();
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
  // Refresh the reports list — the background saved a new report
  reportsPage = 1;
  renderReports();

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

// ── Saved Reports Section ─────────────────────────────────────────────────

/**
 * Initialises the toggle, pagination buttons, and loads the first page.
 */
function initReportsSection() {
  const toggle   = document.getElementById('reports-toggle');
  const panel    = document.getElementById('reports-panel');
  const prevBtn  = document.getElementById('reports-prev');
  const nextBtn  = document.getElementById('reports-next');

  if (!toggle || !panel) return;

  // Toggle expand/collapse
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    panel.style.display = expanded ? 'none' : '';
    if (!expanded) renderReports(); // load on first open
  });

  prevBtn?.addEventListener('click', () => {
    if (reportsPage > 1) { reportsPage--; renderReports(); }
  });

  nextBtn?.addEventListener('click', () => {
    reportsPage++;
    renderReports();
  });

  // Show badge with count (without expanding the panel)
  updateReportsBadge();
}

/**
 * Fetches reports from IndexedDB and renders the current page.
 */
async function renderReports() {
  const list     = document.getElementById('reports-list');
  const prevBtn  = document.getElementById('reports-prev');
  const nextBtn  = document.getElementById('reports-next');
  const pageInfo = document.getElementById('reports-page-info');
  const badge    = document.getElementById('reports-badge');

  if (!list) return;

  list.innerHTML = '';

  let data;
  try {
    data = await listReports(reportsPage, REPORTS_PER_PAGE);
  } catch (err) {
    list.innerHTML = `<li class="reports-empty">Erro ao carregar relatórios.</li>`;
    console.error('[getds] listReports error:', err);
    return;
  }

  // Update badge
  if (badge) {
    badge.textContent = String(data.total);
    badge.style.display = data.total > 0 ? '' : 'none';
  }

  // Pagination controls
  if (pageInfo) pageInfo.textContent = `${data.page} / ${data.pages}`;
  if (prevBtn)  prevBtn.disabled  = data.page <= 1;
  if (nextBtn)  nextBtn.disabled  = data.page >= data.pages;

  if (data.reports.length === 0) {
    list.innerHTML = `<li class="reports-empty">Nenhum relatório salvo ainda.</li>`;
    return;
  }

  for (const report of data.reports) {
    const li = document.createElement('li');
    li.className = 'report-item';

    const typeLabel = report.type === 'full' ? 'Full' : 'Elemento';
    const date      = new Date(report.createdAt).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    const shortTitle = (report.title || 'Sem título').slice(0, 45);

    li.innerHTML = `
      <div class="report-info">
        <span class="report-type ${report.type}">${typeLabel}</span>
        <span class="report-title" title="${escAttr(report.title || '')}">${escText(shortTitle)}</span>
        <span class="report-date">${date}${report.downloaded ? ' · baixado' : ''}</span>
      </div>
      <div class="report-actions">
        <button class="report-btn dl" data-id="${report.id}" aria-label="Baixar relatório" title="Baixar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="report-btn del" data-id="${report.id}" aria-label="Excluir relatório" title="Excluir">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>`;

    li.querySelector('.dl').addEventListener('click', () => downloadReport(report.id));
    li.querySelector('.del').addEventListener('click', () => deleteReportAndRefresh(report.id));

    list.appendChild(li);
  }
}

/**
 * Refreshes the badge count without rendering the full list.
 */
async function updateReportsBadge() {
  const badge = document.getElementById('reports-badge');
  if (!badge) return;
  try {
    const data = await listReports(1, 1);
    badge.textContent   = String(data.total);
    badge.style.display = data.total > 0 ? '' : 'none';
  } catch { /* ignore */ }
}

/**
 * Downloads a report by id and marks it as downloaded.
 * @param {number} id
 */
async function downloadReport(id) {
  try {
    const report = await getReport(id);
    if (!report) return;

    const domain   = (() => { try { return new URL(report.url).hostname; } catch { return 'unknown'; } })();
    const date     = new Date(report.createdAt).toISOString().slice(0, 10);
    const slug     = report.type === 'element' ? 'element-crawl' : 'design-system';
    const filename = `${slug}-${domain}-${date}.md`;

    const base64  = btoa(unescape(encodeURIComponent(report.markdown)));
    const dataUrl = `data:text/markdown;base64,${base64}`;

    await chrome.downloads.download({ url: dataUrl, filename });
    await markDownloaded(id);
    renderReports();
  } catch (err) {
    console.error('[getds] downloadReport error:', err);
  }
}

/**
 * Deletes a report and refreshes the panel.
 * @param {number} id
 */
async function deleteReportAndRefresh(id) {
  try {
    await deleteReport(id);
    // Adjust page if the current page would now be empty
    const data = await listReports(reportsPage, REPORTS_PER_PAGE);
    if (data.reports.length === 0 && reportsPage > 1) reportsPage--;
    renderReports();
  } catch (err) {
    console.error('[getds] deleteReport error:', err);
  }
}

/** Escapes text for safe innerHTML insertion. */
function escText(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escapes a string for use inside an HTML attribute value. */
function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
