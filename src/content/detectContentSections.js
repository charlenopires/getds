/**
 * Content section pattern detection — Spec: 446634bf — Layout Pattern Detection
 *
 * Classifies page sections into structural content patterns using DOM signals:
 *   hero           — large top-of-page section with heading, image/video, and CTA
 *   feature-grid   — repeating icon+heading+text items in a grid
 *   testimonials   — repeating quote/review items
 *   pricing-table  — columns with feature lists and CTA buttons + pricing signals
 *   faq-accordion  — expandable question/answer pairs
 *   unknown        — no recognised pattern
 */

/** @type {Record<string, string>} */
export const CONTENT_PATTERNS = {
  HERO:          'hero',
  FEATURE_GRID:  'feature-grid',
  TESTIMONIALS:  'testimonials',
  PRICING_TABLE: 'pricing-table',
  FAQ_ACCORDION: 'faq-accordion',
  UNKNOWN:       'unknown',
};

const CLASS_PATTERNS = {
  hero:          /\bhero\b/i,
  'feature-grid': /\bfeature(s|[-_]grid)?\b/i,
  testimonials:  /\btestimonial/i,
  'pricing-table': /\bpric(ing|e)/i,
  'faq-accordion': /\b(faq|accordion)\b/i,
};

/**
 * Classify a content section from structural signals.
 *
 * @param {{
 *   classes?: string[],
 *   ariaLabel?: string|null,
 *   hasHeading?: boolean,
 *   hasLargeImage?: boolean,
 *   hasVideo?: boolean,
 *   hasCta?: boolean,
 *   repeatingItemCount?: number,
 *   hasBlockquotes?: boolean,
 *   hasDetails?: boolean,
 *   hasExpandable?: boolean,
 *   hasPricingSignals?: boolean,
 *   hasIcons?: boolean,
 *   isAtPageTop?: boolean,
 *   viewportCoverage?: number
 * }|null} input
 * @returns {{ pattern: string, confidence: number }}
 */
export function classifyContentSection(input) {
  if (!input) return { pattern: CONTENT_PATTERNS.UNKNOWN, confidence: 0 };

  const {
    classes             = [],
    ariaLabel           = null,
    hasHeading          = false,
    hasLargeImage       = false,
    hasVideo            = false,
    hasCta              = false,
    repeatingItemCount  = 0,
    hasBlockquotes      = false,
    hasDetails          = false,
    hasExpandable       = false,
    hasPricingSignals   = false,
    hasIcons            = false,
    isAtPageTop         = false,
    viewportCoverage    = 0,
  } = input;

  const classStr = classes.join(' ');
  const labelStr = ariaLabel ?? '';

  // ── 1. Class/label name match (high confidence shortcut) ─────────────────
  for (const [pattern, re] of Object.entries(CLASS_PATTERNS)) {
    if (re.test(classStr) || re.test(labelStr)) {
      return { pattern, confidence: 0.9 };
    }
  }

  // ── 2. Hero — must be at page top with visual dominance + CTA ────────────
  const hasVisualAnchor = hasLargeImage || hasVideo;
  if (isAtPageTop && hasVisualAnchor && hasCta) {
    return { pattern: CONTENT_PATTERNS.HERO, confidence: 0.9 };
  }
  if (isAtPageTop && viewportCoverage >= 0.7 && (hasHeading || hasCta)) {
    return { pattern: CONTENT_PATTERNS.HERO, confidence: 0.8 };
  }

  // ── 3. FAQ accordion ─────────────────────────────────────────────────────
  if (hasDetails || hasExpandable) {
    return { pattern: CONTENT_PATTERNS.FAQ_ACCORDION, confidence: 0.9 };
  }

  // ── 4. Pricing table ─────────────────────────────────────────────────────
  if (hasPricingSignals && hasCta) {
    return { pattern: CONTENT_PATTERNS.PRICING_TABLE, confidence: 0.9 };
  }

  // ── 5. Testimonials ───────────────────────────────────────────────────────
  if (hasBlockquotes && repeatingItemCount >= 2) {
    return { pattern: CONTENT_PATTERNS.TESTIMONIALS, confidence: 0.88 };
  }

  // ── 6. Feature grid ───────────────────────────────────────────────────────
  if (hasIcons && repeatingItemCount >= 3) {
    return { pattern: CONTENT_PATTERNS.FEATURE_GRID, confidence: 0.85 };
  }

  return { pattern: CONTENT_PATTERNS.UNKNOWN, confidence: 0.2 };
}

/**
 * Detect content section patterns in the live DOM.
 *
 * @returns {Array<{ selector: string, pattern: string, confidence: number }>}
 */
export function detectContentSections() {
  const results = [];
  const vpH = window.innerHeight;

  const candidates = document.querySelectorAll(
    'section, article, [role="region"], .section, .hero, .features, .testimonials, .pricing, .faq'
  );

  for (const el of candidates) {
    const r     = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const classArr = el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
    const ariaLabel = el.getAttribute('aria-label') ?? null;

    const signals = {
      classes:            classArr,
      ariaLabel,
      hasHeading:         el.querySelector('h1,h2,h3') !== null,
      hasLargeImage:      el.querySelector('img[src]') !== null || getComputedStyle(el).backgroundImage !== 'none',
      hasVideo:           el.querySelector('video, iframe') !== null,
      hasCta:             el.querySelector('a.btn,a.button,button,.cta,[class*="btn"],[class*="cta"]') !== null,
      repeatingItemCount: el.children.length,
      hasBlockquotes:     el.querySelector('blockquote') !== null,
      hasDetails:         el.querySelector('details') !== null,
      hasExpandable:      el.querySelector('[aria-expanded]') !== null,
      hasPricingSignals:  /\$|£|€|price|plan|month|year/i.test(el.textContent ?? ''),
      hasIcons:           el.querySelector('svg, [class*="icon"]') !== null,
      isAtPageTop:        r.top + window.scrollY < vpH * 0.2,
      viewportCoverage:   Math.min(1, r.height / vpH),
    };

    const { pattern, confidence } = classifyContentSection(signals);
    const tag = el.tagName.toLowerCase();
    const cls = classArr.slice(0, 2).join('.');
    const selector = `${tag}${cls ? '.' + cls : ''}`.slice(0, 60);

    results.push({ selector, pattern, confidence });
  }

  return results;
}
