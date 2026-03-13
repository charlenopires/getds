/**
 * Table component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects table components by:
 * 1. Native <table> elements
 * 2. ARIA role=grid or role=table
 * Marks tables as sortable when th[aria-sort] or th > button patterns exist.
 */

const TABLE_ROLES = new Set(['grid', 'table', 'treegrid']);

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

/**
 * Check if a table/grid element has sortable headers.
 * Looks for th[aria-sort] or th > button patterns inside the element.
 */
function checkSortable(el) {
  for (const child of el.getElementsByTagName('th')) {
    if (child.hasAttribute('aria-sort')) return true;
    // th containing a button (common sortable header pattern)
    if (child.getElementsByTagName('button').length > 0) return true;
  }
  return false;
}

/**
 * @returns {{ tables: Array<{ tag: string, role: string|null, classes: string[], isSortable: boolean, detectionMethod: string }> }}
 */
export function detectTables() {
  const results = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');

    if (tag === 'table') {
      results.push({
        tag,
        role: role ?? null,
        classes: classArray(el),
        isSortable: checkSortable(el),
        detectionMethod: 'native-table',
      });
      continue;
    }

    if (role && TABLE_ROLES.has(role)) {
      results.push({
        tag,
        role,
        classes: classArray(el),
        isSortable: checkSortable(el),
        detectionMethod: 'aria-role',
      });
    }
  }

  return { tables: results };
}
