/**
 * Button component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects button components by matching:
 * - Native HTML button/input[type=button|submit|reset] tags
 * - Anchor tags with role="button"
 * - Elements with button-signalling class patterns (btn, button, cta)
 * - Elements with cursor:pointer as an interactive style signal
  * 
 * @example
 * // Usage of detectButtons
*/

const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset']);

const BUTTON_CLASS_RE = /\bbtn\b|\bbutton\b|\bcta\b/i;

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

 * Executes the makeEntry functionality.

 * 

 * @param {any} el - The el parameter.

 * @param {any} computed - The computed parameter.

 * @returns {any} Result of makeEntry.

 * 

 * @example

 * makeEntry(el, computed);

 */

function makeEntry(el, computed) {
  return {
    tag: el.tagName.toLowerCase(),
    classes: classArray(el),
    role: el.getAttribute('role') ?? null,
    type: el.getAttribute('type') ?? null,
    cursor: computed.cursor ?? null,
    backgroundColor: computed.backgroundColor ?? null,
    color: computed.color ?? null,
    border: computed.border ?? null,
    borderRadius: computed.borderRadius ?? null,
    padding: computed.padding ?? null,
    fontSize: computed.fontSize ?? null,
    fontWeight: computed.fontWeight ?? null,
    boxShadow: computed.boxShadow ?? null,
  };
}

/**
 * @returns {{ buttons: Array<{ tag: string, classes: string[], role: string|null, type: string|null, cursor: string|null, backgroundColor: string|null, color: string|null, border: string|null, borderRadius: string|null, padding: string|null, fontSize: string|null, fontWeight: string|null, boxShadow: string|null, instanceCount: number }> }}
 */
export function detectButtons() {
  const visualVariants = new Map(); // visual signature → { entry, instanceCount }

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
      const entry = makeEntry(el, computed);
      const sig = `${entry.tag}|${entry.role}|${entry.type}|${entry.classes.join(',')}|${entry.backgroundColor}|${entry.color}|${entry.borderRadius}|${entry.border}|${entry.padding}`;
      if (!visualVariants.has(sig)) {
        visualVariants.set(sig, { ...entry, instanceCount: 0 });
      }
      visualVariants.get(sig).instanceCount++;
    }
  }

  return { buttons: Array.from(visualVariants.values()) };
}
