/**
 * Page template detection — Spec: 446634bf — Layout Pattern Detection
 *
 * Classifies the top-level page layout template from a list of landmark elements
 * (header, nav, main, aside, footer) and their bounding rectangles.
 *
 * Templates detected:
 *   header-content-footer — classic blog/marketing layout
 *   sidebar-content        — app layout with persistent side panel
 *   dashboard-grid         — admin/analytics layout with nav + content area
 *   full-width             — single-span content, no chrome
 *   unknown                — insufficient landmarks to classify
 */

/** @type {Record<string, string>} */
export const PAGE_TEMPLATES = {
  HEADER_CONTENT_FOOTER: 'header-content-footer',
  SIDEBAR_CONTENT:       'sidebar-content',
  DASHBOARD_GRID:        'dashboard-grid',
  FULL_WIDTH:            'full-width',
  UNKNOWN:               'unknown',
};

/**
 * Resolve the semantic role of a landmark element.
 * ARIA role overrides the tag name where applicable.
 *
 * @param {{ tag: string, role: string|null }} landmark
 * @returns {string} Normalised role name
 */
function resolveRole({ tag, role }) {
  const roleMap = {
    banner:      'header',
    main:        'main',
    contentinfo: 'footer',
    complementary: 'aside',
    navigation:  'nav',
  };
  return (role && roleMap[role]) ?? tag;
}

/**
 * Return the bounding rect for a landmark, or null if unavailable.
 *
 * @param {{ rect: object|null }} landmark
 * @returns {{ top: number, left: number, width: number, height: number, bottom: number, right: number }|null}
 */
function rect(landmark) {
  return landmark.rect ?? null;
}

/**
 * Classify the page template from landmark data.
 *
 * @param {Array<{ tag: string, role: string|null, rect: object|null }>} landmarks
 * @returns {{ template: string, confidence: number }}
 */
export function classifyPageTemplate(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return { template: PAGE_TEMPLATES.UNKNOWN, confidence: 0 };
  }

  // Group landmarks by resolved role
  const byRole = {};
  for (const lm of landmarks) {
    const role = resolveRole(lm);
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(lm);
  }

  const hasHeader = Boolean(byRole.header);
  const hasFooter = Boolean(byRole.footer);
  const hasMain   = Boolean(byRole.main);
  const hasAside  = Boolean(byRole.aside);
  const hasNav    = Boolean(byRole.nav);

  const mainLm   = hasMain  ? byRole.main[0]   : null;
  const asideLm  = hasAside ? byRole.aside[0]  : null;
  const mainRect = mainLm  ? rect(mainLm)  : null;
  const asideRect = asideLm ? rect(asideLm) : null;

  // ── Sidebar-content: aside and main share the same vertical band ──────────
  if (hasAside && hasMain && mainRect && asideRect) {
    const verticalOverlap =
      Math.max(0, Math.min(mainRect.bottom, asideRect.bottom) - Math.max(mainRect.top, asideRect.top));
    const minHeight = Math.min(mainRect.height, asideRect.height);
    if (minHeight > 0 && verticalOverlap / minHeight > 0.5) {
      return { template: PAGE_TEMPLATES.SIDEBAR_CONTENT, confidence: 0.9 };
    }
  }

  // ── Header-content-footer: header + main + footer stacked vertically ──────
  if (hasHeader && hasMain && hasFooter) {
    return { template: PAGE_TEMPLATES.HEADER_CONTENT_FOOTER, confidence: 0.9 };
  }

  // ── Dashboard-grid: persistent nav + main content area ───────────────────
  if (hasNav && hasMain) {
    const navLm = byRole.nav[0];
    const navRect = rect(navLm);
    if (navRect && mainRect) {
      // Nav and main share vertical space (side-by-side layout)
      const overlap =
        Math.max(0, Math.min(mainRect.bottom, navRect.bottom) - Math.max(mainRect.top, navRect.top));
      const minH = Math.min(mainRect.height, navRect.height);
      if (minH > 0 && overlap / minH > 0.5) {
        return { template: PAGE_TEMPLATES.DASHBOARD_GRID, confidence: 0.8 };
      }
    }
  }

  // ── Header-content: header + main (no footer) ────────────────────────────
  if (hasHeader && hasMain) {
    return { template: PAGE_TEMPLATES.HEADER_CONTENT_FOOTER, confidence: 0.7 };
  }

  // ── Full-width: main alone spans the layout ───────────────────────────────
  if (hasMain) {
    return { template: PAGE_TEMPLATES.FULL_WIDTH, confidence: 0.75 };
  }

  return { template: PAGE_TEMPLATES.UNKNOWN, confidence: 0 };
}

/**
 * Detect the top-level page template from the live DOM.
 *
 * @returns {{ template: string, confidence: number }}
 */
export function detectPageTemplate() {
  const LANDMARK_TAGS = ['header', 'nav', 'main', 'aside', 'footer', 'section', 'article'];
  const LANDMARK_ROLES = new Set(['banner', 'main', 'contentinfo', 'complementary', 'navigation']);

  const landmarks = [];

  for (const tag of LANDMARK_TAGS) {
    for (const el of document.getElementsByTagName(tag)) {
      const r = el.getBoundingClientRect();
      landmarks.push({
        tag,
        role: el.getAttribute('role'),
        rect: { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right },
      });
    }
  }

  // Also pick up divs/sections with explicit ARIA landmark roles
  for (const el of document.querySelectorAll('[role]')) {
    const role = el.getAttribute('role');
    if (LANDMARK_ROLES.has(role)) {
      const r = el.getBoundingClientRect();
      landmarks.push({
        tag: el.tagName.toLowerCase(),
        role,
        rect: { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right },
      });
    }
  }

  return classifyPageTemplate(landmarks);
}
