/**
 * Navigation pattern classification — Spec: 446634bf — Layout Pattern Detection
 *
 * Classifies navigation elements into structural patterns using geometric
 * position, ARIA semantics, and class/label heuristics.
 *
 * Patterns:
 *   top-bar         — full-width horizontal bar at the top of the viewport
 *   side-drawer     — tall vertical panel at the left or right edge
 *   tab-bar         — horizontal row of tabs (role=tablist)
 *   breadcrumb-trail — compact horizontal trail with separators
 *   pagination      — numbered page links or prev/next controls
 *   unknown         — insufficient signals to classify
 */

/** @type {Record<string, string>} */
export const NAV_PATTERNS = {
  TOP_BAR:          'top-bar',
  SIDE_DRAWER:      'side-drawer',
  TAB_BAR:          'tab-bar',
  BREADCRUMB_TRAIL: 'breadcrumb-trail',
  PAGINATION:       'pagination',
  UNKNOWN:          'unknown',
};

const BREADCRUMB_RE = /breadcrumb/i;
const PAGINATION_RE = /pagination/i;

/**
 * Test a string value against a pattern, returning false when value is falsy.
 *
 * @param {RegExp} re
 * @param {string|null|undefined} value
 * @returns {boolean}
 */
function matches(re, value) {
  return value ? re.test(value) : false;
}

/**
 * Classify a single navigation element descriptor into a nav pattern.
 *
 * @param {{
 *   tag: string,
 *   role: string|null,
 *   ariaLabel: string|null,
 *   classes: string[],
 *   rect: { top: number, left: number, width: number, height: number }|null,
 *   isFixed: boolean,
 *   viewport: { width: number, height: number }
 * }} descriptor
 * @returns {{ pattern: string, confidence: number }}
 */
export function classifyNavPattern(descriptor) {
  const {
    role       = null,
    ariaLabel  = null,
    classes    = [],
    rect       = null,
    viewport   = { width: 1440, height: 900 },
  } = descriptor ?? {};

  const classStr = classes.join(' ');

  // ── 1. Label/class-based signals take highest priority ───────────────────
  if (matches(BREADCRUMB_RE, ariaLabel) || matches(BREADCRUMB_RE, classStr)) {
    return { pattern: NAV_PATTERNS.BREADCRUMB_TRAIL, confidence: 0.95 };
  }
  if (matches(PAGINATION_RE, ariaLabel) || matches(PAGINATION_RE, classStr)) {
    return { pattern: NAV_PATTERNS.PAGINATION, confidence: 0.95 };
  }

  // ── 2. ARIA role signals ──────────────────────────────────────────────────
  if (role === 'tablist') {
    return { pattern: NAV_PATTERNS.TAB_BAR, confidence: 0.95 };
  }

  // ── 3. Geometric classification ───────────────────────────────────────────
  if (!rect) {
    return { pattern: NAV_PATTERNS.UNKNOWN, confidence: 0 };
  }

  const vpW = viewport.width  || 1440;
  const vpH = viewport.height || 900;

  const widthRatio  = rect.width  / vpW;
  const heightRatio = rect.height / vpH;
  const isNearTop   = rect.top <= vpH * 0.15;
  const isNearLeft  = rect.left <= 50;
  const isNearRight = rect.right >= vpW - 50;

  // Side drawer: tall (>50% viewport height) and anchored to left or right edge
  if (heightRatio >= 0.5 && widthRatio < 0.35 && (isNearLeft || isNearRight)) {
    return { pattern: NAV_PATTERNS.SIDE_DRAWER, confidence: 0.9 };
  }

  // Top bar: wide (>60% viewport width) and near the top
  if (widthRatio >= 0.6 && isNearTop) {
    return { pattern: NAV_PATTERNS.TOP_BAR, confidence: 0.9 };
  }

  // Fallback top-bar: any nav within top 15% of viewport
  if (isNearTop && rect.height < vpH * 0.15) {
    return { pattern: NAV_PATTERNS.TOP_BAR, confidence: 0.7 };
  }

  return { pattern: NAV_PATTERNS.UNKNOWN, confidence: 0.3 };
}

/**
 * Detect navigation patterns in the live DOM.
 *
 * @returns {Array<{ tag: string, role: string|null, ariaLabel: string|null, pattern: string, confidence: number }>}
 */
export function detectNavPatterns() {
  const NAV_TAGS  = new Set(['nav', 'header', 'aside']);
  const NAV_ROLES = new Set(['banner', 'navigation', 'complementary', 'tablist']);
  const BREADCRUMB_CLS = /breadcrumb/i;
  const PAGINATION_CLS = /pagination/i;

  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const viewport = { width: vpW, height: vpH };

  const results = [];

  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;

    const tag       = el.tagName.toLowerCase();
    const role      = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label') ?? null;
    const classStr  = el.className ? String(el.className) : '';
    const classes   = classStr.trim().split(/\s+/).filter(Boolean);

    const isNavTag  = NAV_TAGS.has(tag);
    const isNavRole = role && NAV_ROLES.has(role);
    const isBreadcrumb = BREADCRUMB_CLS.test(ariaLabel ?? '') || BREADCRUMB_CLS.test(classStr);
    const isPagination = PAGINATION_CLS.test(ariaLabel ?? '') || PAGINATION_CLS.test(classStr);

    if (!isNavTag && !isNavRole && !isBreadcrumb && !isPagination) continue;

    const r         = el.getBoundingClientRect();
    const rect      = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
    const isFixed   = cs.position === 'fixed' || cs.position === 'sticky';
    const linkCount = el.querySelectorAll('a, button').length;

    const { pattern, confidence } = classifyNavPattern({ tag, role, ariaLabel, classes, rect, isFixed, viewport });

    results.push({ tag, role, ariaLabel, classes, linkCount, pattern, confidence });
  }

  return results;
}
