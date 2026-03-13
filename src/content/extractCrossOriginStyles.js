/**
 * Cross-origin stylesheet resilience — Spec: 21d9e937 — Protected Page Resilience
 *
 * Attempts to read cssRules from a CSSStyleSheet. When the browser throws a
 * SecurityError (cross-origin stylesheet without CORS headers), returns an
 * empty rules array and a structured limitation descriptor so the caller can
 * fall back to getComputedStyle and surface the constraint to the user.
 */

/**
 * @typedef {{ rules: CSSRule[], blocked: boolean, href: string|null, limitation: object|null }} SafeRulesResult
 */

/**
 * Safely access cssRules on a stylesheet, catching cross-origin SecurityErrors.
 *
 * Re-throws any non-SecurityError exceptions so real bugs are not silently swallowed.
 *
 * @param {CSSStyleSheet} stylesheet
 * @returns {SafeRulesResult}
 */
export function safeGetCssRules(stylesheet) {
  const href = stylesheet.href ?? null;

  try {
    const rules = Array.from(stylesheet.cssRules);
    return { rules, blocked: false, href, limitation: null };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'SecurityError') {
      return {
        rules: [],
        blocked: true,
        href,
        limitation: {
          layer: 'visual-foundations',
          message: `Cross-origin stylesheet blocked: cssRules inaccessible for ${href ?? 'unknown'}. Falling back to getComputedStyle.`,
          element: href ?? 'unknown stylesheet',
        },
      };
    }
    throw err;
  }
}
