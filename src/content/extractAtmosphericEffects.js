/**
 * Atmospheric Effects extraction — Gap 3 (Part A): Atmospheric Lighting
 *
 * Detects decorative blur/glow elements that create ambient atmosphere:
 * nebula/aurora effects, gradient overlays, frosted glass, ambient glows.
 *
 * @returns {{ atmosphericEffects: Array }}
 */

function buildSelector(el) {
  const tag = el.tagName?.toLowerCase() ?? 'div';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${tag}${id}${cls}`;
}

function parseBlurAmount(filterValue) {
  if (!filterValue || filterValue === 'none') return 0;
  const m = filterValue.match(/blur\(([\d.]+)px\)/);
  return m ? parseFloat(m[1]) : 0;
}

function hasGradient(bgImage) {
  return bgImage && /gradient/.test(bgImage);
}

function hasSaturatedColor(bg) {
  if (!bg) return false;
  // Check for vivid colors (not grays, whites, blacks)
  const rgbMatch = bg.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!rgbMatch) return false;
  const [, r, g, b] = rgbMatch.map(Number);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation > 0.3;
}

function classify(score, blur, opacity, bgImage, backdropFilter) {
  if (score < 4) return null;

  const hasBlur = blur > 0;
  const isGradient = hasGradient(bgImage);
  const hasBackdropBlur = backdropFilter && /blur/.test(backdropFilter);

  if (hasBackdropBlur) return 'frosted-glass';
  if (isGradient && hasBlur) return 'nebula-aurora';
  if (isGradient && opacity < 0.8 && !hasBlur) return 'gradient-overlay';
  if (hasBlur) return 'ambient-glow';
  return 'gradient-overlay';
}

export function extractAtmosphericEffects() {
  const atmosphericEffects = [];
  const allElements = Array.from(document.getElementsByTagName('*')).slice(0, 500);

  // Batch read bounding rects
  const rects = allElements.map(el => {
    try { return el.getBoundingClientRect(); }
    catch { return { width: 0, height: 0 }; }
  });

  const vpWidth = window.innerWidth || 1;
  const vpHeight = window.innerHeight || 1;
  const vpArea = vpWidth * vpHeight;

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const rect = rects[i];
    if (rect.width === 0 && rect.height === 0) continue;

    try {
      const cs = getComputedStyle(el);
      const filter = cs.getPropertyValue('filter').trim();
      const backdropFilter = cs.getPropertyValue('backdrop-filter').trim();
      const opacity = parseFloat(cs.getPropertyValue('opacity')) || 1;
      const pointerEvents = cs.getPropertyValue('pointer-events').trim();
      const bgColor = cs.getPropertyValue('background-color').trim();
      const bgImage = cs.getPropertyValue('background-image').trim();
      const ariaHidden = el.getAttribute('aria-hidden') === 'true';
      const textContent = (el.textContent ?? '').trim();
      const blur = parseBlurAmount(filter);
      const backdropBlur = parseBlurAmount(backdropFilter);

      // Compute atmospheric score
      let score = 0;
      if (blur > 40) score += 3;
      else if (blur > 10) score += 1;
      if (backdropBlur > 0) score += 2;
      if (opacity < 0.8) score += 1;
      if (pointerEvents === 'none') score += 2;
      if (ariaHidden) score += 1;
      if (!textContent) score += 1;
      const elArea = rect.width * rect.height;
      if (elArea > vpArea * 0.3) score += 2;
      if (hasSaturatedColor(bgColor)) score += 1;
      if (hasGradient(bgImage)) score += 1;

      const classification = classify(score, blur || backdropBlur, opacity, bgImage, backdropFilter);
      if (!classification) continue;

      atmosphericEffects.push({
        selector: buildSelector(el),
        classification,
        blurAmount: blur || backdropBlur,
        opacity,
        color: bgColor !== 'rgba(0, 0, 0, 0)' ? bgColor : null,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        pointerEvents,
        ariaHidden,
        backgroundImage: bgImage !== 'none' ? bgImage.slice(0, 100) : null,
      });
    } catch { continue; }
  }

  return { atmosphericEffects };
}
