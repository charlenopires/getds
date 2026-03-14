/**
 * Color Application extraction — Gap 3 (Part B): Semantic Color Roles
 *
 * Detects typographic accent colors and builds a color function map
 * showing how each color is used across the page.
 *
 * @returns {{ accentColors, colorFunctionMap }}
 */

function buildSelector(el) {
  const tag = el.tagName?.toLowerCase() ?? 'div';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${tag}${id}${cls}`;
}

function normalizeColor(color) {
  if (!color) return '';
  return color.replace(/\s+/g, ' ').trim().toLowerCase();
}

const INLINE_TAGS = new Set(['span', 'em', 'strong', 'a', 'b', 'i', 'mark', 'code', 'abbr', 'cite', 'q']);

export function extractColorApplication() {
  const accentColors = [];
  const colorMap = {};
  const allElements = Array.from(document.getElementsByTagName('*')).slice(0, 500);

  for (const el of allElements) {
    try {
      const cs = getComputedStyle(el);
      const tag = el.tagName?.toLowerCase() ?? '';

      // Track all color usages
      const textColor = normalizeColor(cs.getPropertyValue('color'));
      const bgColor = normalizeColor(cs.getPropertyValue('background-color'));
      const borderColor = normalizeColor(cs.getPropertyValue('border-color'));
      const shadowColor = normalizeColor(cs.getPropertyValue('box-shadow'));

      // Text color
      if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
        if (!colorMap[textColor]) colorMap[textColor] = { contexts: new Set(), count: 0 };
        colorMap[textColor].contexts.add('text');
        colorMap[textColor].count++;
      }

      // Background color
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        if (!colorMap[bgColor]) colorMap[bgColor] = { contexts: new Set(), count: 0 };
        colorMap[bgColor].contexts.add('background');
        colorMap[bgColor].count++;
      }

      // Border color
      if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'rgb(0, 0, 0)') {
        if (!colorMap[borderColor]) colorMap[borderColor] = { contexts: new Set(), count: 0 };
        colorMap[borderColor].contexts.add('border');
        colorMap[borderColor].count++;
      }

      // Shadow color (extract from box-shadow value)
      if (shadowColor && shadowColor !== 'none') {
        const colorMatch = shadowColor.match(/(rgba?\([^)]+\)|#[0-9a-f]{3,8})/i);
        if (colorMatch) {
          const sc = normalizeColor(colorMatch[1]);
          if (!colorMap[sc]) colorMap[sc] = { contexts: new Set(), count: 0 };
          colorMap[sc].contexts.add('shadow');
          colorMap[sc].count++;
        }
      }

      // Typographic accent detection — inline elements differing from parent
      if (INLINE_TAGS.has(tag) && el.parentElement) {
        const parentColor = normalizeColor(getComputedStyle(el.parentElement).getPropertyValue('color'));
        if (textColor && parentColor && textColor !== parentColor) {
          const textSnippet = (el.textContent ?? '').trim().slice(0, 30);
          accentColors.push({
            color: textColor,
            parentColor,
            selector: buildSelector(el),
            parentSelector: buildSelector(el.parentElement),
            textSnippet,
          });

          // Mark accent context
          if (!colorMap[textColor]) colorMap[textColor] = { contexts: new Set(), count: 0 };
          colorMap[textColor].contexts.add('accent');
        }
      }
    } catch { continue; }
  }

  // Convert Sets to arrays for serialization
  const colorFunctionMap = {};
  for (const [color, data] of Object.entries(colorMap)) {
    colorFunctionMap[color] = {
      contexts: [...data.contexts],
      count: data.count,
    };
  }

  // Deduplicate accent colors by color+parentColor
  const seenAccents = new Set();
  const dedupedAccents = [];
  for (const ac of accentColors) {
    const key = `${ac.color}|${ac.parentColor}`;
    if (!seenAccents.has(key)) {
      seenAccents.add(key);
      dedupedAccents.push(ac);
    }
  }

  return { accentColors: dedupedAccents, colorFunctionMap };
}
