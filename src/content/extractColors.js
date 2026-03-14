/**
 * Color extraction — Layer 1 (visual-foundations)
 * Spec: fff645a0 — Color System Extraction
 *
 * Extracts all unique, visible color values from computed styles
 * across every visible DOM element.
  * 
 * @example
 * // Usage of extractColors
*/

import { normalizeColor } from './normalizeColor.js';

/** Simple CSS properties whose entire value IS a color */
const DIRECT_COLOR_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
];

/** Properties whose value contains embedded color tokens that need parsing */
const PARSED_COLOR_PROPERTIES = [
  'box-shadow',
  'text-shadow',
  'background-image',
];

/** Matches rgb(), rgba(), hsl(), hsla(), oklch(), lch(), oklab(), lab(), color-mix(), and #hex colors inside a larger string */
const EMBEDDED_COLOR_RE =
  /color-mix\([^)]*\)|oklch\([^)]*\)|lch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|rgba?\(\s*[\d.%\s,/]+\)|hsla?\(\s*[\d.%\s,/]+\)|#[0-9a-fA-F]{3,8}\b/g;

/**
 * Extract all color tokens embedded inside a CSS value string.
 * Used for box-shadow, text-shadow, and gradient values.
 *
 * @param {string} value
 * @returns {string[]}
 */
export function parseColorsFromValue(value) {
  return value.match(EMBEDDED_COLOR_RE) ?? [];
}

/** Values that represent no colour and should be ignored */
const SKIP_VALUES = new Set([
  '',
  'transparent',
  'rgba(0, 0, 0, 0)',
  'initial',
  'inherit',
  'unset',
  'currentcolor',
  'currentColor',
]);

/**

 * Executes the isVisible functionality.

 * 

 * @param {any} el - The el parameter.

 * @param {any} computed - The computed parameter.

 * @returns {any} Result of isVisible.

 * 

 * @example

 * isVisible(el, computed);

 */

function isVisible(el, computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**

 * Executes the gatherElements functionality.

 * 

 * @returns {any} Result of gatherElements.

 * 

 * @example

 * gatherElements();

 */

function gatherElements() {
  return Array.from(document.getElementsByTagName('*'));
}

/**

 * Executes the makeEntry functionality.

 * 

 * @param {any} raw - The raw parameter.

 * @param {any} property - The property parameter.

 * @returns {any} Result of makeEntry.

 * 

 * @example

 * makeEntry(raw, property);

 */

function makeEntry(raw, property) {
  const normalized = normalizeColor(raw);
  return { raw, property, ...(normalized ?? {}) };
}

/**
 * @returns {{ colors: Array<{ raw: string, property: string, hex?: string, rgb?: string, hsl?: string, count: number, properties: string[], tags: string[] }> }}
 */
export function extractColors() {
  const seen = new Map(); // raw value → entry with count, properties, tags

  for (const el of gatherElements()) {
    const computed = getComputedStyle(el);
    if (!isVisible(el, computed)) continue;
    const tag = el.tagName.toLowerCase();

    for (const prop of DIRECT_COLOR_PROPERTIES) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || SKIP_VALUES.has(value)) continue;
      if (!seen.has(value)) {
        seen.set(value, { ...makeEntry(value, prop), count: 0, properties: new Set(), tags: new Set() });
      }
      const entry = seen.get(value);
      entry.count++;
      entry.properties.add(prop);
      entry.tags.add(tag);
    }

    for (const prop of PARSED_COLOR_PROPERTIES) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || value === 'none') continue;
      for (const color of parseColorsFromValue(value)) {
        if (SKIP_VALUES.has(color)) continue;
        if (!seen.has(color)) {
          seen.set(color, { ...makeEntry(color, prop), count: 0, properties: new Set(), tags: new Set() });
        }
        const entry = seen.get(color);
        entry.count++;
        entry.properties.add(prop);
        entry.tags.add(tag);
      }
    }
  }

  return {
    colors: Array.from(seen.values()).map(e => ({
      ...e,
      properties: Array.from(e.properties),
      tags: Array.from(e.tags),
    })),
  };
}
