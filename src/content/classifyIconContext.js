/**
 * Icon context classification — Spec: 4e6f0589 — Iconography and Asset Detection
 *
 * Classifies icon usage context based on DOM ancestry and ARIA attributes.
 */

export const ICON_CONTEXTS = {
  navigation: 'navigation',
  action:     'action',
  status:     'status',
  decorative: 'decorative',
};

const STATUS_ROLES = new Set(['alert', 'status', 'log', 'marquee', 'timer']);

/**
 * Classify the usage context of an icon element based on its DOM position and ARIA attributes.
 *
 * Priority order: decorative (aria-hidden) > navigation > action > status > decorative
 *
 * @param {Element} el
 * @returns {'navigation'|'action'|'status'|'decorative'}
 */
export function classifyIconContext(el) {
  // aria-hidden always wins — purely decorative
  if (el.getAttribute('aria-hidden') === 'true') return ICON_CONTEXTS.decorative;

  // Navigation context
  if (el.closest('nav')) return ICON_CONTEXTS.navigation;

  // Action context
  if (el.closest('button') || el.closest('a')) return ICON_CONTEXTS.action;

  // Status context via ARIA role
  const role = el.getAttribute('role');
  if (role && STATUS_ROLES.has(role)) return ICON_CONTEXTS.status;

  return ICON_CONTEXTS.decorative;
}
