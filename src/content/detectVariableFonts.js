/**
 * Variable font detection — detects variable fonts from @font-face rules
 * and font-variation-settings in computed styles.
 */

/** Standard registered axes with known metadata */
const REGISTERED_AXES = {
  wght: { name: 'Weight', min: 1, max: 1000, default: 400 },
  wdth: { name: 'Width', min: 25, max: 200, default: 100 },
  slnt: { name: 'Slant', min: -90, max: 90, default: 0 },
  ital: { name: 'Italic', min: 0, max: 1, default: 0 },
  opsz: { name: 'Optical Size', min: 6, max: 144, default: 14 },
};

/**
 * Parse a font-weight range like "100 900" into { min, max }.
 * @param {string|null} val
 * @returns {{ min: number, max: number }|null}
 */
function parseRange(val) {
  if (!val) return null;
  const parts = val.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
  if (parts.length === 2 && parts[0] < parts[1]) return { min: parts[0], max: parts[1] };
  return null;
}

/**
 * Parse font-variation-settings string into axis entries.
 * e.g. '"wght" 700, "slnt" -5' → [{ tag: 'wght', value: 700 }, ...]
 * @param {string} settings
 * @returns {Array<{ tag: string, value: number }>}
 */
function parseVariationSettings(settings) {
  if (!settings || settings === 'normal') return [];
  const entries = [];
  const re = /["'](\w{4})["']\s+([\d.-]+)/g;
  let m;
  while ((m = re.exec(settings)) !== null) {
    entries.push({ tag: m[1], value: parseFloat(m[2]) });
  }
  return entries;
}

/**
 * Detect variable fonts from @font-face rules and DOM computed styles.
 *
 * @param {Array<object>} fontFaceRules — from parseFontFaceRules()
 * @returns {{ variableFonts: Array<{
 *   family: string,
 *   axes: Array<{ tag: string, name: string, min: number, max: number, isRegistered: boolean }>,
 *   usedSettings: string[],
 *   source: string|null,
 * }> }}
 */
export function detectVariableFonts(fontFaceRules = []) {
  const fontMap = new Map(); // family → { axes, usedSettings, source }

  // 1. Detect from @font-face rules
  for (const rule of fontFaceRules) {
    const family = rule.fontFamily;
    let isVariable = false;
    const axes = [];

    // Check format hints for "variations"
    for (const src of (rule.sources ?? [])) {
      if (src.isVariable) { isVariable = true; break; }
    }

    // Check weight range (e.g., "100 900")
    const weightRange = parseRange(rule.fontWeight);
    if (weightRange) {
      isVariable = true;
      axes.push({
        tag: 'wght',
        name: REGISTERED_AXES.wght.name,
        min: weightRange.min,
        max: weightRange.max,
        isRegistered: true,
      });
    }

    // Check font-stretch range
    const stretchRange = parseRange(rule.fontStretch);
    if (stretchRange) {
      isVariable = true;
      axes.push({
        tag: 'wdth',
        name: REGISTERED_AXES.wdth.name,
        min: stretchRange.min,
        max: stretchRange.max,
        isRegistered: true,
      });
    }

    // Check font-style oblique range (e.g., "oblique -12deg 12deg")
    if (rule.fontStyle && /oblique\s+[\d.-]+deg\s+[\d.-]+deg/i.test(rule.fontStyle)) {
      isVariable = true;
      const degMatch = rule.fontStyle.match(/([\d.-]+)deg\s+([\d.-]+)deg/);
      if (degMatch) {
        axes.push({
          tag: 'slnt',
          name: REGISTERED_AXES.slnt.name,
          min: parseFloat(degMatch[1]),
          max: parseFloat(degMatch[2]),
          isRegistered: true,
        });
      }
    }

    // Check font-variation-settings in @font-face
    if (rule.fontVariationSettings) {
      const parsed = parseVariationSettings(rule.fontVariationSettings);
      for (const { tag } of parsed) {
        if (!axes.some(a => a.tag === tag)) {
          const reg = REGISTERED_AXES[tag];
          axes.push({
            tag,
            name: reg?.name ?? tag,
            min: reg?.min ?? 0,
            max: reg?.max ?? 0,
            isRegistered: !!reg,
          });
        }
        isVariable = true;
      }
    }

    if (!isVariable) continue;

    const source = rule.sources?.[0]?.url ?? null;

    if (fontMap.has(family)) {
      const existing = fontMap.get(family);
      // Merge axes
      for (const axis of axes) {
        const existingAxis = existing.axes.find(a => a.tag === axis.tag);
        if (existingAxis) {
          existingAxis.min = Math.min(existingAxis.min, axis.min);
          existingAxis.max = Math.max(existingAxis.max, axis.max);
        } else {
          existing.axes.push(axis);
        }
      }
      if (!existing.source && source) existing.source = source;
    } else {
      fontMap.set(family, { family, axes, usedSettings: [], source });
    }
  }

  // 2. Scan DOM for font-variation-settings usage
  const TEXT_TAGS = new Set([
    'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'li', 'td', 'th', 'label', 'button', 'input', 'textarea',
    'code', 'pre', 'blockquote', 'figcaption', 'caption', 'dt', 'dd',
    'strong', 'em', 'b', 'i', 'small', 'mark', 'cite', 'q',
  ]);

  const usedSettingsSet = new Map(); // family → Set of unique settings strings

  try {
    for (const el of document.getElementsByTagName('*')) {
      const tag = el.tagName.toLowerCase();
      if (!TEXT_TAGS.has(tag)) continue;

      const cs = getComputedStyle(el);
      const settings = cs.fontVariationSettings;
      if (!settings || settings === 'normal') continue;

      const fontFamily = cs.fontFamily?.split(',')[0]?.replace(/['"]/g, '').trim() ?? '';
      if (!fontFamily) continue;

      if (!usedSettingsSet.has(fontFamily)) usedSettingsSet.set(fontFamily, new Set());
      usedSettingsSet.get(fontFamily).add(settings);

      // If we haven't seen this font from @font-face, add it
      if (!fontMap.has(fontFamily)) {
        const parsed = parseVariationSettings(settings);
        const axes = parsed.map(({ tag }) => {
          const reg = REGISTERED_AXES[tag];
          return {
            tag,
            name: reg?.name ?? tag,
            min: reg?.min ?? 0,
            max: reg?.max ?? 0,
            isRegistered: !!reg,
          };
        });
        fontMap.set(fontFamily, { family: fontFamily, axes, usedSettings: [], source: null });
      }
    }
  } catch { /* ignore DOM access errors */ }

  // Merge used settings into font entries
  for (const [family, settings] of usedSettingsSet) {
    if (fontMap.has(family)) {
      fontMap.get(family).usedSettings = Array.from(settings);
    }
  }

  return { variableFonts: Array.from(fontMap.values()) };
}
