/**
 * Form input component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects form input components including:
 * - Text-like inputs (text, email, password, number, search, tel, url)
 * - textarea and select elements
 * - Checkboxes and radios
 * - Range sliders, date pickers, file uploads
 * - Custom toggles (role=switch)
  * 
 * @example
 * // Usage of detectFormInputs
*/

/** input[type] values that classify as form inputs (excludes button types) */
const FORM_INPUT_TYPES = new Set([
  'text', 'email', 'password', 'number', 'search', 'tel', 'url',
  'checkbox', 'radio', 'range',
  'date', 'datetime-local', 'time', 'month', 'week',
  'file', 'color', 'hidden',
]);

/** Tags that are always form inputs regardless of type */
const FORM_INPUT_TAGS = new Set(['textarea', 'select']);

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

 * @returns {any} Result of makeEntry.

 * 

 * @example

 * makeEntry(el);

 */

function makeEntry(el, computed) {
  return {
    tag: el.tagName.toLowerCase(),
    type: el.getAttribute('type') ?? null,
    role: el.getAttribute('role') ?? null,
    classes: classArray(el),
    backgroundColor: computed.backgroundColor ?? null,
    border: computed.border ?? null,
    borderRadius: computed.borderRadius ?? null,
    padding: computed.padding ?? null,
    fontSize: computed.fontSize ?? null,
    color: computed.color ?? null,
  };
}

/**
 * @returns {{ inputs: Array<{ tag: string, type: string|null, role: string|null, classes: string[], backgroundColor: string|null, border: string|null, borderRadius: string|null, padding: string|null, fontSize: string|null, color: string|null, instanceCount: number }> }}
 */
export function detectFormInputs() {
  const visualVariants = new Map(); // signature → { entry, instanceCount }

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const tag = el.tagName.toLowerCase();
    const type = el.getAttribute('type');
    const role = el.getAttribute('role');

    const isFormTag = FORM_INPUT_TAGS.has(tag);
    const isInputTag = tag === 'input' && (type === null || FORM_INPUT_TYPES.has(type));
    const isCustomToggle = role === 'switch';

    if (isFormTag || isInputTag || isCustomToggle) {
      const entry = makeEntry(el, computed);
      const inputType = type ?? tag;
      const sig = `${inputType}|${entry.backgroundColor}|${entry.border}|${entry.borderRadius}`;
      if (!visualVariants.has(sig)) {
        visualVariants.set(sig, { ...entry, instanceCount: 0 });
      }
      visualVariants.get(sig).instanceCount++;
    }
  }

  return { inputs: Array.from(visualVariants.values()) };
}
