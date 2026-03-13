/**
 * Focus style audit — Spec: 10ab6f26 — Accessibility Audit
 *
 * Detects whether interactive elements have a visible focus indicator by
 * inspecting computed style properties associated with :focus.
 *
 * A visible indicator can come from:
 *   - outline (non-none, non-0)
 *   - box-shadow (any value except none)
 *   - border-color change (non-transparent)
 */

const NONE_VALUES = new Set(['none', '0px', '0', '']);

/**
 * Determine whether a computed style object has a visible focus indicator.
 *
 * @param {CSSStyleDeclaration} cs
 * @returns {boolean}
 */
export function hasFocusIndicator(cs) {
  const outline      = cs.getPropertyValue('outline')        ?? '';
  const outlineStyle = cs.getPropertyValue('outline-style')  ?? '';
  const boxShadow    = cs.getPropertyValue('box-shadow')     ?? '';
  const borderColor  = cs.getPropertyValue('border-color')   ?? '';

  // Outline: present unless explicitly none/0
  const hasOutline = outline !== '' && !NONE_VALUES.has(outline) && outlineStyle !== 'none';

  // Box-shadow: present unless none/empty
  const hasBoxShadow = boxShadow !== '' && boxShadow !== 'none';

  // Border-color change (non-transparent, non-empty)
  const hasBorder = borderColor !== '' && borderColor !== 'transparent';

  return hasOutline || hasBoxShadow || hasBorder;
}

/**
 * Classify the quality of a focus indicator.
 *
 * @param {CSSStyleDeclaration} cs
 * @returns {'good'|'present'|'none'}
 */
export function classifyFocusStyle(cs) {
  if (!hasFocusIndicator(cs)) return 'none';

  const outline       = cs.getPropertyValue('outline')        ?? '';
  const outlineOffset = cs.getPropertyValue('outline-offset') ?? '';
  const outlineStyle  = cs.getPropertyValue('outline-style')  ?? '';

  const hasOutline = outline !== '' && !NONE_VALUES.has(outline) && outlineStyle !== 'none';
  const hasOffset  = outlineOffset !== '' && !NONE_VALUES.has(outlineOffset);

  if (hasOutline && hasOffset) return 'good';
  return 'present';
}
