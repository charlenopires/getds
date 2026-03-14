/**
 * IndexedDB storage for getds reports.
 * Works in both the background service worker and the popup (same extension origin).
 *
 * Schema: reports store
 *   id          – auto-increment primary key
 *   title       – string
 *   url         – string
 *   markdown    – string (full markdown content)
 *   type        – 'full' | 'element'
 *   selector    – string (for element-crawl reports)
 *   createdAt   – number (Date.now())
 *   downloaded  – boolean
 */

const DB_NAME    = 'getds-reports';
const DB_VERSION = 1;
const STORE      = 'reports';

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('downloaded', 'downloaded', { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Saves a new report to IndexedDB.
 * @param {{ title: string, url: string, markdown: string, type: 'full'|'element', selector?: string }} report
 * @returns {Promise<number>} The auto-generated record id.
 */
export async function saveReport(report) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.add({ ...report, createdAt: Date.now(), downloaded: false });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Returns a paginated list of reports, newest first.
 * @param {number} page    - 1-based page number
 * @param {number} perPage - items per page
 * @returns {Promise<{ reports: Array, total: number, pages: number, page: number }>}
 */
export async function listReports(page = 1, perPage = 5) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const all   = [];
    const req   = store.openCursor(null, 'prev'); // descending by key = newest first

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        all.push(cursor.value);
        cursor.continue();
      } else {
        const total = all.length;
        const start = (page - 1) * perPage;
        resolve({
          reports : all.slice(start, start + perPage),
          total,
          pages   : Math.max(1, Math.ceil(total / perPage)),
          page,
        });
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Returns the count of reports that have not been downloaded yet.
 * @returns {Promise<number>}
 */
export async function countPendingReports() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    let count   = 0;
    const req   = store.openCursor();

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (!cursor.value.downloaded) count++;
        cursor.continue();
      } else {
        resolve(count);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Retrieves a single report by id.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getReport(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.get(id);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Marks a report as downloaded.
 * @param {number} id
 */
export async function markDownloaded(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = (e) => {
      const record = e.target.result;
      if (!record) { resolve(); return; }
      record.downloaded = true;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror   = (e2) => reject(e2.target.error);
    };
    getReq.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Finds the most recent element-type report for a given URL.
 * @param {string} url
 * @returns {Promise<Object|null>}
 */
export async function findElementReportByUrl(url) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    let   newest = null;
    const req   = store.openCursor(null, 'prev');

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const r = cursor.value;
        if (r.type === 'element' && r.url === url) {
          newest = r; // cursor is descending, first match is newest
          resolve(newest);
          return;
        }
        cursor.continue();
      } else {
        resolve(newest);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Appends a new element section block to an existing report's markdown.
 * @param {number} id
 * @param {string} additionalMarkdown
 */
export async function appendToReport(id, additionalMarkdown) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = (e) => {
      const record = e.target.result;
      if (!record) { resolve(); return; }
      record.markdown += '\n\n---\n\n' + additionalMarkdown;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror   = (e2) => reject(e2.target.error);
    };
    getReq.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Permanently deletes a report by id.
 * @param {number} id
 */
export async function deleteReport(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}
