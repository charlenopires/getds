/**
 * Font source detection — classifies each font's provider by scanning
 * DOM link/script tags and @font-face rule source URLs.
 */

const PROVIDER_PATTERNS = [
  { provider: 'google-fonts', patterns: ['fonts.googleapis.com', 'fonts.gstatic.com'] },
  { provider: 'adobe-fonts',  patterns: ['use.typekit.net'] },
  { provider: 'cdn',          patterns: ['cdnjs.cloudflare.com', 'unpkg.com', 'jsdelivr.net', 'fonts.bunny.net'] },
];

/**
 * Detect the provider for a URL string.
 * @param {string} url
 * @returns {string} provider name or null
 */
function matchProvider(url) {
  if (!url) return null;
  for (const { provider, patterns } of PROVIDER_PATTERNS) {
    if (patterns.some(p => url.includes(p))) return provider;
  }
  return null;
}

/**
 * Check if URL is same-origin (self-hosted).
 * @param {string} url
 * @returns {boolean}
 */
function isSameOrigin(url) {
  if (!url) return false;
  try {
    if (url.startsWith('/') && !url.startsWith('//')) return true;
    const parsed = new URL(url, location.origin);
    return parsed.origin === location.origin;
  } catch { return false; }
}

/**
 * Detect font sources from DOM and @font-face rules.
 *
 * @param {Array<object>} fontFaceRules — from parseFontFaceRules() / collectFontFaceFromSheets()
 * @returns {{ fontSources: Array<{
 *   family: string,
 *   provider: 'google-fonts'|'adobe-fonts'|'self-hosted'|'cdn'|'system',
 *   url: string|null,
 *   linkTag: string|null,
 *   importRule: string|null,
 * }> }}
 */
export function detectFontSources(fontFaceRules = []) {
  const sources = new Map(); // family → source info

  // 1. Scan <link> tags for font providers
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  for (const link of links) {
    const href = link.getAttribute('href') ?? '';
    const provider = matchProvider(href);
    if (!provider) continue;

    // For Google Fonts, extract family names from URL
    if (provider === 'google-fonts') {
      const familyMatch = href.match(/family=([^&]+)/);
      if (familyMatch) {
        const families = decodeURIComponent(familyMatch[1]).split('|');
        for (const fam of families) {
          const name = fam.split(':')[0].replace(/\+/g, ' ');
          if (!sources.has(name)) {
            sources.set(name, {
              family: name,
              provider,
              url: href,
              linkTag: `<link href="${href}" rel="stylesheet">`,
              importRule: null,
            });
          }
        }
      }
    }
  }

  // 2. Scan <script> tags for Adobe Fonts
  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src') ?? '';
    if (src.includes('use.typekit.net')) {
      // Adobe Fonts detected — we can't easily extract family names from the script
      // Mark as detected, families will be matched from @font-face rules below
      sources.set('__adobe_detected__', { provider: 'adobe-fonts', url: src });
    }
  }

  // 3. Scan @font-face rules for source URLs
  for (const rule of fontFaceRules) {
    const family = rule.fontFamily;
    if (sources.has(family)) continue; // already classified from <link>

    let provider = null;
    let url = null;

    for (const src of (rule.sources ?? [])) {
      provider = matchProvider(src.url);
      if (provider) { url = src.url; break; }
      if (isSameOrigin(src.url)) { provider = 'self-hosted'; url = src.url; break; }
      url = src.url;
    }

    // If we detected Adobe Fonts via script but didn't match from link
    if (!provider && sources.has('__adobe_detected__')) {
      provider = 'adobe-fonts';
      url = sources.get('__adobe_detected__').url;
    }

    if (!provider) provider = url ? 'self-hosted' : 'system';

    sources.set(family, {
      family,
      provider,
      url,
      linkTag: null,
      importRule: null,
    });
  }

  // Clean up internal markers
  sources.delete('__adobe_detected__');

  // 4. Scan @import rules in stylesheets for Google Fonts / Adobe Fonts
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type === CSSRule.IMPORT_RULE || (rule.cssText && rule.cssText.startsWith('@import'))) {
            const importUrl = rule.href ?? '';
            const provider = matchProvider(importUrl);
            if (provider === 'google-fonts') {
              const familyMatch = importUrl.match(/family=([^&"')]+)/);
              if (familyMatch) {
                const families = decodeURIComponent(familyMatch[1]).split('|');
                for (const fam of families) {
                  const name = fam.split(':')[0].replace(/\+/g, ' ');
                  if (!sources.has(name)) {
                    sources.set(name, {
                      family: name,
                      provider,
                      url: importUrl,
                      linkTag: null,
                      importRule: importUrl,
                    });
                  }
                }
              }
            }
          }
        }
      } catch { /* cross-origin */ }
    }
  } catch { /* ignore */ }

  return { fontSources: Array.from(sources.values()) };
}
