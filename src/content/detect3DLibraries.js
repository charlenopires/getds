/**
 * 3D Library detection — Layer 5
 *
 * Detects 3D rendering libraries present on the page via:
 * A. Page-world globals (injected micro-script → meta tag)
 * B. Script tag src scanning
 *
 * @returns {{ libraries3D: Array<{ name: string, version: string|null, detected: boolean, globalVar: string|null, scriptSrc: string|null }> }}
 */

const SCRIPT_PATTERNS = [
  { re: /three(\.min|\.module)?\.js/i, name: 'Three.js' },
  { re: /babylon(js)?\.js/i, name: 'Babylon.js' },
  { re: /aframe(\.min)?\.js/i, name: 'A-Frame' },
  { re: /@splinetool\/runtime|spline-viewer/i, name: 'Spline' },
  { re: /@rive-app|rive\.wasm/i, name: 'Rive' },
  { re: /model-viewer/i, name: 'model-viewer' },
  { re: /playcanvas|pc\.min\.js/i, name: 'PlayCanvas' },
  { re: /cesium(\.min)?\.js/i, name: 'CesiumJS' },
];

/**
 * Probe page-world 3D globals via background service worker.
 * Uses chrome.scripting.executeScript with world: 'MAIN' (MV3-compliant).
 */
async function probe3DGlobals() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      const result = await chrome.runtime.sendMessage({ type: 'PROBE_PAGE_GLOBALS', probe: '3d' });
      return result ?? {};
    }
  } catch { /* ignore — popup closed or test env */ }
  return {};
}

/**
 * Scan script tags for 3D library URLs.
 */
function scanScriptTags() {
  const found = [];
  for (const script of document.getElementsByTagName('script')) {
    const src = script.getAttribute('src') || '';
    if (!src) continue;
    for (const pat of SCRIPT_PATTERNS) {
      if (pat.re.test(src)) {
        found.push({ name: pat.name, scriptSrc: src });
        break;
      }
    }
  }
  return found;
}

const GLOBAL_TO_NAME = {
  three: 'Three.js',
  babylon: 'Babylon.js',
  playcanvas: 'PlayCanvas',
  aframe: 'A-Frame',
  cesium: 'CesiumJS',
};

/**
 * @returns {Promise<{ libraries3D: Array<{ name: string, version: string|null, detected: boolean, globalVar: string|null, scriptSrc: string|null }> }>}
 */
export async function detect3DLibraries() {
  const libraries3D = [];
  const seen = new Set();

  // A. Page-world globals
  const globals = await probe3DGlobals();
  for (const [key, info] of Object.entries(globals)) {
    const name = GLOBAL_TO_NAME[key] ?? key;
    seen.add(name);
    libraries3D.push({
      name,
      version: info.v ?? null,
      detected: true,
      globalVar: info.g ?? null,
      scriptSrc: null,
    });
  }

  // B. Script tag scanning
  const scriptHits = scanScriptTags();
  for (const hit of scriptHits) {
    if (seen.has(hit.name)) {
      // Merge scriptSrc into existing entry
      const existing = libraries3D.find(l => l.name === hit.name);
      if (existing && !existing.scriptSrc) existing.scriptSrc = hit.scriptSrc;
      continue;
    }
    seen.add(hit.name);
    libraries3D.push({
      name: hit.name,
      version: null,
      detected: true,
      globalVar: null,
      scriptSrc: hit.scriptSrc,
    });
  }

  return { libraries3D };
}
