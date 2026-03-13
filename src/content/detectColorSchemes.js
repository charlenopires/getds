/**
 * Dark/light mode palette detection — Spec: fff645a0 — Color System Extraction
 *
 * Parses @media (prefers-color-scheme: dark|light) blocks from stylesheet text
 * and extracts color declarations found within them.
 */

/** CSS color properties to collect from within media blocks */
const COLOR_PROPS = [
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
];

/** Matches rgb(), rgba(), hsl(), hsla(), and #hex tokens */
const COLOR_VALUE_RE =
  /rgba?\(\s*[\d.,\s]+\)|hsla?\(\s*[\d.,%\s]+\)|#[0-9a-fA-F]{3,8}\b/;

/**
 * Extract color declarations from the text content of a single media block body.
 * Returns an array of { property, value, selector } objects (deduplicated by value).
 *
 * @param {string} blockBody — the CSS text between the outer braces of the @media rule
 * @returns {Array<{ property: string, value: string }>}
 */
function extractColorsFromBlock(blockBody) {
  const seen = new Set();
  const results = [];

  // Match property: value; declarations
  const declRe = /([\w-]+)\s*:\s*([^;}{]+)/g;
  let m;
  while ((m = declRe.exec(blockBody)) !== null) {
    const prop = m[1].trim().toLowerCase();
    const val  = m[2].trim();

    if (!COLOR_PROPS.includes(prop)) continue;
    if (!COLOR_VALUE_RE.test(val) && !val.startsWith('#')) continue;

    // For simple color values, take the first color token found (or the whole value for hex)
    const colorToken = val.match(COLOR_VALUE_RE)?.[0] ?? val;
    if (!colorToken || seen.has(colorToken)) continue;

    seen.add(colorToken);
    results.push({ property: prop, value: colorToken });
  }

  return results;
}

/**
 * Parse CSS text and extract color rules from prefers-color-scheme media blocks.
 *
 * @param {string} cssText
 * @returns {{ dark: Array<{ property: string, value: string }>, light: Array<{ property: string, value: string }> }}
 */
export function parseMediaColorRules(cssText) {
  const dark  = [];
  const light = [];
  const seenDark  = new Set();
  const seenLight = new Set();

  // Match @media (...prefers-color-scheme: dark|light...) { ... }
  // Uses a simple brace-depth scanner to handle nested rules.
  const mediaRe = /@media\s*\([^)]*prefers-color-scheme\s*:\s*(dark|light)[^)]*\)\s*\{/gi;
  let match;

  while ((match = mediaRe.exec(cssText)) !== null) {
    const scheme = match[1].toLowerCase(); // 'dark' | 'light'
    const start  = match.index + match[0].length;

    // Walk forward to find the matching closing brace
    let depth = 1;
    let i = start;
    while (i < cssText.length && depth > 0) {
      if (cssText[i] === '{') depth++;
      else if (cssText[i] === '}') depth--;
      i++;
    }
    const blockBody = cssText.slice(start, i - 1);
    const colors    = extractColorsFromBlock(blockBody);
    const seen      = scheme === 'dark' ? seenDark : seenLight;
    const target    = scheme === 'dark' ? dark      : light;

    for (const entry of colors) {
      if (!seen.has(entry.value)) {
        seen.add(entry.value);
        target.push(entry);
      }
    }
  }

  return { dark, light };
}

/**
 * Detect dark/light mode color palettes from an array of stylesheet text strings.
 * In a real browser context, callers should pass CSSStyleSheet cssText values.
 *
 * @param {string[]} stylesheetTexts
 * @returns {{ dark: Array<{ property: string, value: string }>, light: Array<{ property: string, value: string }> }}
 */
export function detectColorSchemes(stylesheetTexts) {
  const dark  = [];
  const light = [];
  const seenDark  = new Set();
  const seenLight = new Set();

  for (const text of stylesheetTexts) {
    const { dark: d, light: l } = parseMediaColorRules(text);

    for (const entry of d) {
      if (!seenDark.has(entry.value)) {
        seenDark.add(entry.value);
        dark.push(entry);
      }
    }
    for (const entry of l) {
      if (!seenLight.has(entry.value)) {
        seenLight.add(entry.value);
        light.push(entry);
      }
    }
  }

  return { dark, light };
}
