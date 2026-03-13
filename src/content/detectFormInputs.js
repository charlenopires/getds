/**
 * Form input component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects form input components including:
 * - Text-like inputs (text, email, password, number, search, tel, url)
 * - textarea and select elements
 * - Checkboxes and radios
 * - Range sliders, date pickers, file uploads
 * - Custom toggles (role=switch)
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

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

function makeEntry(el) {
  return {
    tag: el.tagName.toLowerCase(),
    type: el.getAttribute('type') ?? null,
    role: el.getAttribute('role') ?? null,
    classes: classArray(el),
  };
}

/**
 * @returns {{ inputs: Array<{ tag: string, type: string|null, role: string|null, classes: string[] }> }}
 */
export function detectFormInputs() {
  const results = [];

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
      results.push(makeEntry(el));
    }
  }

  return { inputs: results };
}
