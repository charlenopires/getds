/**
 * Navigation component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects navigation components by matching:
 * - Semantic HTML: nav, header, aside
 * - ARIA landmarks: role=banner, role=navigation, role=complementary
 * - Tablist: role=tablist
 * - Breadcrumbs: aria-label/class containing "breadcrumb"
 * - Pagination: aria-label/class containing "pagination"
  * 
 * @example
 * // Usage of detectNavigation
*/

const NAV_TAGS = new Set(['nav', 'header', 'aside']);

const NAV_ROLES = new Set(['banner', 'navigation', 'complementary', 'tablist']);

const BREADCRUMB_RE = /breadcrumb/i;
const PAGINATION_RE = /pagination/i;

/**

 * Executes the isVisible functionality.

 * 

 * @param {any} computed - The computed parameter.

 * @returns {any} Result of isVisible.

 * 

 * @example

 * isVisible(computed);

 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**

 * Executes the classArray functionality.

 * 

 * @param {any} el - The el parameter.

 * @returns {any} Result of classArray.

 * 

 * @example

 * classArray(el);

 */

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

/**

 * Executes the resolveNavType functionality.

 * 

 * @param {any} tag - The tag parameter.

 * @param {any} role - The role parameter.

 * @param {any} classes - The classes parameter.

 * @param {any} ariaLabel - The ariaLabel parameter.

 * @returns {any} Result of resolveNavType.

 * 

 * @example

 * resolveNavType(tag, role, classes, ariaLabel);

 */

function resolveNavType(tag, role, classes, ariaLabel) {
  const classStr = classes.join(' ');

  if (BREADCRUMB_RE.test(ariaLabel) || BREADCRUMB_RE.test(classStr)) return 'breadcrumb';
  if (PAGINATION_RE.test(ariaLabel) || PAGINATION_RE.test(classStr)) return 'pagination';
  if (role === 'tablist') return 'tabs';
  if (tag === 'header' || role === 'banner') return 'header';
  if (tag === 'aside' || role === 'complementary') return 'sidebar';
  return 'nav';
}

/**
 * @returns {{ navComponents: Array<{ tag: string, role: string|null, classes: string[], navType: string }> }}
 */
export function detectNavigation() {
  const results = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label') ?? '';
    const classes = classArray(el);
    const classStr = classes.join(' ');

    const isNavTag = NAV_TAGS.has(tag);
    const isNavRole = role && NAV_ROLES.has(role);
    const isBreadcrumb = !isNavTag && !isNavRole && BREADCRUMB_RE.test(classStr);
    const isPagination = !isNavTag && !isNavRole && PAGINATION_RE.test(classStr);

    if (isNavTag || isNavRole || isBreadcrumb || isPagination) {
      results.push({
        tag,
        role: role ?? null,
        classes,
        navType: resolveNavType(tag, role, classes, ariaLabel),
        backgroundColor: computed.backgroundColor ?? null,
        borderBottom: computed.borderBottom ?? null,
        position: computed.position ?? null,
        height: computed.height ?? null,
      });
    }
  }

  return { navComponents: results };
}
