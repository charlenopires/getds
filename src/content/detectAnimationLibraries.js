/**
 * Animation library detection — Layer 5
 *
 * Detects third-party animation libraries present on the page by scanning
 * DOM attributes, elements, and page-world globals (via background service worker).
 *
 * @returns {{ libraries: Array<{ name: string, version: string|null, detected: boolean, details: object }> }}
 */

const ATTR_DETECTORS = [
  {
    name: 'Framer Motion',
    attrs: ['data-framer-appear-id', 'data-framer-component-type', 'data-framer-name'],
  },
  {
    name: 'AOS',
    attrs: ['data-aos'],
  },
  {
    name: 'Locomotive Scroll',
    attrs: ['data-scroll'],
  },
  {
    name: 'React Spring',
    attrs: ['data-rspring-id', 'data-rspring-key'],
  },
  {
    name: 'Barba.js',
    attrs: ['data-barba', 'data-barba-namespace'],
  },
  {
    name: 'Alpine.js',
    attrs: ['x-transition', 'x-show'],
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
 * Probe page-world globals via background service worker.
 * Uses chrome.scripting.executeScript with world: 'MAIN' (MV3-compliant).
 * Falls back to empty object if messaging is unavailable (e.g. in tests).
 */
async function probePageWorldGlobals() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      const result = await chrome.runtime.sendMessage({ type: 'PROBE_PAGE_GLOBALS', probe: 'animation' });
      return result ?? {};
    }
  } catch { /* ignore — popup closed or test env */ }
  return {};
}

/**
 * @returns {Promise<{ libraries: Array<{ name: string, version: string|null, detected: boolean, details: object }> }>}
 */
export async function detectAnimationLibraries() {
  const libraries = [];
  const globals = await probePageWorldGlobals();

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

  // GSAP Legacy (TweenMax/TweenLite)
  if (globals.gsapLegacy && !libraries.some(l => l.name === 'GSAP')) {
    libraries.push({ name: 'GSAP (Legacy)', version: null, detected: true, details: {} });
  }

  // Motion One
  if (globals.motionOne) {
    libraries.push({ name: 'Motion One', version: null, detected: true, details: {} });
  }

  // Popmotion
  if (globals.popmotion) {
    libraries.push({ name: 'Popmotion', version: null, detected: true, details: {} });
  }

  // Barba.js (globals)
  if (globals.barba) {
    libraries.push({ name: 'Barba.js', version: globals.barba.v ?? null, detected: true, details: {} });
  }

  // Swiper
  if (globals.swiper) {
    libraries.push({ name: 'Swiper', version: globals.swiper.v ?? null, detected: true, details: {} });
  }

  // Splide
  if (globals.splide) {
    libraries.push({ name: 'Splide', version: null, detected: true, details: {} });
  }

  // Pixi.js
  if (globals.pixi) {
    libraries.push({ name: 'Pixi.js', version: globals.pixi.v ?? null, detected: true, details: {} });
  }

  // Konva
  if (globals.konva) {
    libraries.push({ name: 'Konva', version: globals.konva.v ?? null, detected: true, details: {} });
  }

  // Velocity.js
  if (globals.velocity) {
    libraries.push({ name: 'Velocity.js', version: null, detected: true, details: {} });
  }

  // jQuery animate
  if (globals.jqueryAnimate) {
    libraries.push({ name: 'jQuery (animate)', version: globals.jqueryAnimate.v ?? null, detected: true, details: {} });
  }

  // Framer Motion (globals)
  if (globals.framerMotionGlobal && !libraries.some(l => l.name === 'Framer Motion')) {
    libraries.push({ name: 'Framer Motion', version: null, detected: true, details: {} });
  }

  // Swiper — tag-based detection
  let swiperCount = 0;
  for (const el of document.getElementsByTagName('*')) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'swiper-container' || tag === 'swiper-slide') swiperCount++;
  }
  if (swiperCount > 0 && !libraries.some(l => l.name === 'Swiper')) {
    libraries.push({ name: 'Swiper', version: null, detected: true, details: { elementCount: swiperCount } });
  }

  // Splide — class-based detection
  let splideCount = 0;
  try { splideCount = safeQSA('.splide, .splide__track, .splide__slide').length; } catch { /* ignore */ }
  if (splideCount > 0 && !libraries.some(l => l.name === 'Splide')) {
    libraries.push({ name: 'Splide', version: null, detected: true, details: { elementCount: splideCount } });
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
