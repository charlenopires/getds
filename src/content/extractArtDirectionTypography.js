/**
 * Art Direction Typography extraction — Gap 2: Typography as Art Direction
 *
 * Detects intentional typographic choices: quirky case, tight leading,
 * negative tracking, display typography scoring, text effects, fluid expressions.
 *
 * @param {string[]} stylesheetTexts - Pre-collected CSS texts
 * @returns {{ artDirectedElements, fluidExpressions, summary }}
 */

function buildSelector(el) {
  const tag = el.tagName?.toLowerCase() ?? 'div';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${tag}${id}${cls}`;
}

const DISPLAY_FONT_PATTERNS = /display|poster|headline|banner|condensed|compressed|black|ultra|extra.*bold/i;

const TEXT_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a',
  'li', 'blockquote', 'figcaption', 'label', 'strong', 'em',
]);

function classifyLeading(ratio) {
  if (ratio < 0.9) return 'extreme-display';
  if (ratio <= 1.0) return 'tight-poster';
  if (ratio <= 1.4) return 'normal';
  return 'loose';
}

function classifyTracking(trackingEm) {
  if (trackingEm < -0.02) return 'tight';
  if (trackingEm < 0) return 'slightly-tight';
  if (trackingEm <= 0.05) return 'normal';
  return 'loose';
}

function detectQuirkyCase(text) {
  if (!text || text.length < 3) return false;
  // Mixed case: camelCase, PascalCase mid-word, or intentional alternating
  return /[A-Z][a-z]+[A-Z]/.test(text) || /[a-z][A-Z]/.test(text);
}

function computeDisplayScore(fontSize, leadingRatio, trackingEm, fontWeight, textTransform, fontFamily) {
  let score = 0;
  const fsPx = parseFloat(fontSize) || 0;

  if (fsPx > 72) score += 30;
  else if (fsPx > 48) score += 20;
  else if (fsPx > 32) score += 10;

  if (leadingRatio < 1.0) score += 20;
  if (trackingEm < -0.02) score += 15;
  if (parseInt(fontWeight, 10) >= 700) score += 10;
  if (textTransform === 'uppercase') score += 10;
  if (DISPLAY_FONT_PATTERNS.test(fontFamily)) score += 15;

  return Math.min(score, 100);
}

export function extractArtDirectionTypography(stylesheetTexts = []) {
  const artDirectedElements = [];
  const allElements = document.getElementsByTagName('*');

  let hasQuirkyCase = false;
  let hasTightLeading = false;
  let hasNegativeTracking = false;
  let displayTypographyCount = 0;
  let textEffectsCount = 0;

  for (const el of Array.from(allElements).slice(0, 500)) {
    try {
      const tag = el.tagName?.toLowerCase() ?? '';
      if (!TEXT_TAGS.has(tag)) continue;

      const cs = getComputedStyle(el);
      const fontSize = cs.getPropertyValue('font-size').trim();
      const fontWeight = cs.getPropertyValue('font-weight').trim();
      const lineHeight = cs.getPropertyValue('line-height').trim();
      const letterSpacing = cs.getPropertyValue('letter-spacing').trim();
      const textTransform = cs.getPropertyValue('text-transform').trim();
      const fontFamily = cs.getPropertyValue('font-family').trim();

      const fsPx = parseFloat(fontSize) || 16;
      if (fsPx < 14) continue; // Skip tiny text

      // Leading ratio
      let leadingRatio = 1.2;
      if (lineHeight && lineHeight !== 'normal') {
        const lhPx = parseFloat(lineHeight) || fsPx * 1.2;
        leadingRatio = lhPx / fsPx;
      }
      const leadingCategory = classifyLeading(leadingRatio);

      // Tracking
      let trackingEm = 0;
      if (letterSpacing && letterSpacing !== 'normal' && letterSpacing !== '0px') {
        const lsPx = parseFloat(letterSpacing) || 0;
        trackingEm = lsPx / fsPx;
      }
      const trackingCategory = classifyTracking(trackingEm);

      // Quirky case detection (only for display text)
      const text = (el.textContent ?? '').trim().slice(0, 60);
      const artDirectedCase = fsPx > 24 && textTransform === 'none' && detectQuirkyCase(text);

      // Display score
      const displayScore = computeDisplayScore(fsPx, leadingRatio, trackingEm, fontWeight, textTransform, fontFamily);

      // Text effects
      const textStroke = cs.getPropertyValue('-webkit-text-stroke').trim();
      const textShadow = cs.getPropertyValue('text-shadow').trim();
      const bgClip = cs.getPropertyValue('-webkit-background-clip').trim() || cs.getPropertyValue('background-clip').trim();
      const textFillColor = cs.getPropertyValue('-webkit-text-fill-color').trim();

      const hasTextStroke = textStroke && textStroke !== '0px' && textStroke !== '0px rgb(0, 0, 0)';
      const hasTextShadow = textShadow && textShadow !== 'none';
      const hasBackgroundClipText = bgClip === 'text';
      const hasTextFillColor = textFillColor && textFillColor !== 'rgb(0, 0, 0)' && textFillColor !== textFillColor; // non-default

      const textEffects = {
        textStroke: hasTextStroke ? textStroke : null,
        textShadow: hasTextShadow ? textShadow : null,
        backgroundClipText: hasBackgroundClipText,
        textFillColor: hasTextFillColor ? textFillColor : null,
      };

      const hasAnyEffect = hasTextStroke || hasTextShadow || hasBackgroundClipText || hasTextFillColor;

      // Only include if something interesting is happening
      // 'loose' leading is normal for body text — only flag tight/extreme
      const isInteresting =
        displayScore >= 30 ||
        leadingCategory === 'extreme-display' || leadingCategory === 'tight-poster' ||
        trackingCategory === 'tight' || trackingCategory === 'loose' ||
        artDirectedCase ||
        hasAnyEffect;

      if (!isInteresting) continue;

      // Update summary flags
      if (artDirectedCase) hasQuirkyCase = true;
      if (leadingRatio < 1.0) hasTightLeading = true;
      if (trackingEm < -0.02) hasNegativeTracking = true;
      if (displayScore >= 50) displayTypographyCount++;
      if (hasAnyEffect) textEffectsCount++;

      artDirectedElements.push({
        selector: buildSelector(el),
        text: text.slice(0, 40),
        fontSize,
        fontWeight,
        leadingRatio: Math.round(leadingRatio * 100) / 100,
        leadingCategory,
        trackingEm: Math.round(trackingEm * 1000) / 1000,
        trackingCategory,
        artDirectedCase,
        displayScore,
        textEffects,
      });
    } catch { continue; }
  }

  // Fluid typography expressions from CSSOM
  const fluidExpressions = [];
  const fluidRe = /([^{}]+)\{[^}]*font-size\s*:\s*([^;]*(?:clamp|calc|vw|vh|vmin|vmax)[^;]*);/gi;
  for (const text of stylesheetTexts) {
    let match;
    while ((match = fluidRe.exec(text)) !== null) {
      const selector = match[1].trim().split(',').pop().trim();
      const expression = match[2].trim();
      fluidExpressions.push({ selector, property: 'font-size', expression });
    }
  }

  return {
    artDirectedElements,
    fluidExpressions,
    summary: {
      hasQuirkyCase,
      hasTightLeading,
      hasNegativeTracking,
      displayTypographyCount,
      textEffectsCount,
    },
  };
}
