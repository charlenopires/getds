/**
 * Animation-to-element mapping — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Provides utilities to attach element context (tag, classes, role, component type)
 * to animation/transition descriptors.
  * 
 * @example
 * // Usage of mapAnimationToElement
*/

const BUTTON_CLASS_RE = /\bbtn\b|\bbutton\b|\bcta\b/i;
const CARD_CLASS_RE   = /\bcard\b/i;
const MODAL_CLASS_RE  = /\bmodal\b|\bdialog\b|\boverlay\b/i;

const COMPONENT_TAGS = {
  button: 'button',
  input:  'input',
  select: 'input',
  textarea: 'input',
  nav:    'nav',
  header: 'header',
  aside:  'sidebar',
  table:  'table',
  dialog: 'modal',
};

const ROLE_MAP = {
  button:         'button',
  dialog:         'modal',
  alertdialog:    'modal',
  navigation:     'nav',
  banner:         'header',
  complementary:  'sidebar',
  grid:           'table',
  table:          'table',
};

/**
 * Infer the component type of a DOM element based on tag, role, and class signals.
 *
 * @param {{ tagName: string, className: string, getAttribute: (attr: string) => string|null }} el
 * @returns {string}
 */
export function inferComponentType(el) {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const classStr = el.className ?? '';

  // Role takes priority after tag-level checks
  if (COMPONENT_TAGS[tag]) return COMPONENT_TAGS[tag];
  if (role && ROLE_MAP[role]) return ROLE_MAP[role];

  // Class-based heuristics
  if (BUTTON_CLASS_RE.test(classStr)) return 'button';
  if (CARD_CLASS_RE.test(classStr))   return 'card';
  if (MODAL_CLASS_RE.test(classStr))  return 'modal';

  return 'unknown';
}

/**
 * Build an elementContext object from a DOM element.
 *
 * @param {{ tagName: string, className: string, getAttribute: (attr: string) => string|null }} el
 * @returns {{ tag: string, classes: string[], role: string|null, componentType: string }}
 */
export function buildElementContext(el) {
  const classes = el.className
    ? String(el.className).trim().split(/\s+/).filter(Boolean)
    : [];

  return {
    tag: el.tagName.toLowerCase(),
    classes,
    role: el.getAttribute('role') ?? null,
    componentType: inferComponentType(el),
  };
}
