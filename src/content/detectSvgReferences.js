/**
 * SVG reference detection — Spec: 4e6f0589 — Iconography and Asset Detection
 *
 * Detects SVG references via img[src], use[href], and CSS background-image.
 */

/**
 * Returns true if the given URL points to an SVG resource.
 *
 * @param {string|null} url
 * @returns {boolean}
 */
export function isSvgUrl(url) {
  if (!url) return false;
  if (url.startsWith('data:image/svg+xml')) return true;
  return /\.svg(\?|$)/i.test(url);
}

/**
 * Find img elements whose src points to an SVG.
 *
 * @param {Array<{ getAttribute: Function }>} imgEls
 * @returns {Array<{ src: string, type: 'img-src' }>}
 */
export function detectSvgImgRefs(imgEls) {
  const results = [];
  for (const el of imgEls) {
    const src = el.getAttribute('src');
    if (isSvgUrl(src)) {
      results.push({ src, type: 'img-src' });
    }
  }
  return results;
}

/**
 * Find use elements whose href/xlink:href points to an SVG or fragment.
 *
 * @param {Array<{ getAttribute: Function }>} useEls
 * @returns {Array<{ href: string, type: 'use-href' }>}
 */
export function detectSvgUseRefs(useEls) {
  const results = [];
  for (const el of useEls) {
    const href = el.getAttribute('href') ?? el.getAttribute('xlink:href');
    if (href) {
      results.push({ href, type: 'use-href' });
    }
  }
  return results;
}

/** Extract url() value from a CSS background-image string */
function extractUrlFromBackground(bg) {
  const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
  return match ? match[1] : null;
}

/**
 * Find elements with a CSS background-image pointing to an SVG.
 *
 * @param {Array<{ getPropertyValue: Function }>} computedStyles
 * @returns {Array<{ url: string, type: 'css-background' }>}
 */
export function detectSvgBackgroundRefs(computedStyles) {
  const results = [];
  for (const cs of computedStyles) {
    const bg = cs.getPropertyValue('background-image');
    if (!bg) continue;
    const url = extractUrlFromBackground(bg);
    if (url && isSvgUrl(url)) {
      results.push({ url, type: 'css-background' });
    }
  }
  return results;
}
