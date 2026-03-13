/**
 * Button component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects button components by matching:
 * - Native HTML button/input[type=button|submit|reset] tags
 * - Anchor tags with role="button"
 * - Elements with button-signalling class patterns (btn, button, cta)
 * - Elements with cursor:pointer as an interactive style signal
 */

const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset']);

const BUTTON_CLASS_RE = /\bbtn\b|\bbutton\b|\bcta\b/i;

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

function makeEntry(el, computed) {
  return {
    tag: el.tagName.toLowerCase(),
    classes: classArray(el),
    role: el.getAttribute('role') ?? null,
    type: el.getAttribute('type') ?? null,
    cursor: computed.cursor ?? null,
  };
}

/**
 * @returns {{ buttons: Array<{ tag: string, classes: string[], role: string|null, type: string|null, cursor: string|null }> }}
 */
export function detectButtons() {
  const results = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const type = el.getAttribute('type');
    const classes = classArray(el);
    const classStr = classes.join(' ');

    const isNativeButton = tag === 'button';
    const isInputButton = tag === 'input' && BUTTON_INPUT_TYPES.has(type);
    const isRoleButton = tag === 'a' && role === 'button';
    const hasButtonClass = BUTTON_CLASS_RE.test(classStr);

    if (isNativeButton || isInputButton || isRoleButton || hasButtonClass) {
      results.push(makeEntry(el, computed));
    }
  }

  return { buttons: results };
}
