/**
 * Animation library detection — Layer 5
 *
 * Detects third-party animation libraries present on the page by scanning
 * DOM attributes, elements, and page-world globals (via injected micro-script).
 *
 * @returns {{ libraries: Array<{ name: string, version: string|null, detected: boolean, details: object }> }}
 */

const ATTR_DETECTORS = [
  {
    name: 'Framer Motion',
    attrs: ['data-framer-appear-id', 'data-framer-component-type'],
  },
  {
    name: 'AOS',
    attrs: ['data-aos'],
  },
  {
    name: 'Locomotive Scroll',
    attrs: ['data-scroll'],
  },
];

const SMIL_TAG_NAMES = new Set(['animate', 'animatetransform', 'animatemotion', 'set']);

/**
 * Safe querySelectorAll with fallback.
 */
function safeQSA(selector) {
  try { return Array.from(document.querySelectorAll(selector)); } catch { return []; }
}

/**
 * Find elements by attribute name using getElementsByTagName fallback.
 */
function findByAttribute(attr) {
  const results = [];
  for (const el of document.getElementsByTagName('*')) {
    if (el.hasAttribute && el.hasAttribute(attr)) results.push(el);
  }
  return results;
}

/**
 * Inject a micro-script into the page world to read globals that live outside
 * the content-script isolated world. Results are written to a hidden meta tag.
 */
function probePageWorldGlobals() {
  try {
    // Clean up any previous probe
    const existing = safeQSA('meta[data-getds-libs]')[0];
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.textContent = `
      (function() {
        var r = {};
        try { if (window.gsap) r.gsap = { v: (window.gsap.version || null), tweens: (window.gsap.globalTimeline ? window.gsap.globalTimeline.getChildren().length : 0) }; } catch(e) {}
        try { if (window.GreenSockGlobals) r.gsap = r.gsap || { v: null, tweens: 0 }; } catch(e) {}
        try { if (window.lottie || window.bodymovin) r.lottie = { v: (window.lottie && window.lottie.version) || null }; } catch(e) {}
        try { if (window.anime) r.anime = { v: (window.anime.version || null) }; } catch(e) {}
        try { if (window.LocomotiveScroll) r.locomotive = { v: null }; } catch(e) {}
        try { if (window.ScrollTrigger) r.scrollTrigger = { v: null, count: (window.ScrollTrigger.getAll ? window.ScrollTrigger.getAll().length : 0) }; } catch(e) {}
        var m = document.createElement('meta');
        m.setAttribute('data-getds-libs', JSON.stringify(r));
        document.head.appendChild(m);
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();

    const meta = safeQSA('meta[data-getds-libs]')[0];
    if (meta) {
      const data = JSON.parse(meta.getAttribute('data-getds-libs') || '{}');
      meta.remove();
      return data;
    }
  } catch { /* ignore */ }
  return {};
}

/**
 * @returns {{ libraries: Array<{ name: string, version: string|null, detected: boolean, details: object }> }}
 */
export function detectAnimationLibraries() {
  const libraries = [];
  const globals = probePageWorldGlobals();

  // GSAP
  if (globals.gsap) {
    libraries.push({
      name: 'GSAP',
      version: globals.gsap.v ?? null,
      detected: true,
      details: { tweenCount: globals.gsap.tweens ?? 0 },
    });
  }

  // ScrollTrigger (GSAP plugin)
  if (globals.scrollTrigger) {
    libraries.push({
      name: 'ScrollTrigger',
      version: globals.scrollTrigger.v ?? null,
      detected: true,
      details: { triggerCount: globals.scrollTrigger.count ?? 0 },
    });
  }

  // Lottie — detect via tag names
  let lottieCount = 0;
  for (const el of document.getElementsByTagName('*')) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'lottie-player' || tag === 'dotlottie-player') lottieCount++;
  }
  if (globals.lottie || lottieCount > 0) {
    libraries.push({
      name: 'Lottie',
      version: globals.lottie?.v ?? null,
      detected: true,
      details: { elementCount: lottieCount },
    });
  }

  // Anime.js
  if (globals.anime) {
    libraries.push({
      name: 'Anime.js',
      version: globals.anime.v ?? null,
      detected: true,
      details: {},
    });
  }

  // Locomotive Scroll (globals)
  if (globals.locomotive) {
    const existing = libraries.find(l => l.name === 'Locomotive Scroll');
    if (!existing) {
      libraries.push({
        name: 'Locomotive Scroll',
        version: null,
        detected: true,
        details: {},
      });
    }
  }

  // Attribute-based detections
  for (const det of ATTR_DETECTORS) {
    // Find elements with any of the detection attributes
    let els = [];
    for (const attr of det.attrs) {
      els = els.concat(findByAttribute(attr));
    }
    if (els.length === 0) continue;

    // Skip if already detected (e.g. Locomotive Scroll via globals)
    if (libraries.some(l => l.name === det.name)) continue;

    const details = { elementCount: els.length };

    // AOS: collect distinct animation types
    if (det.name === 'AOS') {
      const types = new Set();
      for (const el of els) {
        const val = el.getAttribute('data-aos');
        if (val) types.add(val);
      }
      details.animationTypes = [...types];
    }

    libraries.push({
      name: det.name,
      version: null,
      detected: true,
      details,
    });
  }

  // SMIL animations inside SVGs
  let smilCount = 0;
  for (const el of document.getElementsByTagName('*')) {
    if (SMIL_TAG_NAMES.has(el.tagName.toLowerCase())) smilCount++;
  }
  if (smilCount > 0) {
    libraries.push({
      name: 'SMIL',
      version: null,
      detected: true,
      details: { elementCount: smilCount },
    });
  }

  return { libraries };
}
