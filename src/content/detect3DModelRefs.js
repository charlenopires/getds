/**
 * 3D Model File References detection — Layer 5
 *
 * Scans the DOM for URLs pointing to 3D model files:
 * .glb, .gltf, .obj, .fbx, .dae, .ply, .stl, .usdz
 *
 * @returns {{ modelFiles: Array<{ url: string, format: string, source: string, element: string }> }}
 */

const MODEL_EXTENSIONS = /\.(glb|gltf|obj|fbx|dae|ply|stl|usdz)(\?[^"'\s]*)?$/i;

function extractFormat(url) {
  const match = url.match(/\.(glb|gltf|obj|fbx|dae|ply|stl|usdz)/i);
  return match ? match[1].toLowerCase() : 'unknown';
}

function buildElementLabel(el) {
  const tag = el.tagName.toLowerCase();
  if (el.id) return tag + '#' + el.id;
  return tag;
}

function checkModelUrl(el, attrName) {
  const url = el.getAttribute(attrName);
  return url && MODEL_EXTENSIONS.test(url) ? url : null;
}

/**
 * @returns {{ modelFiles: Array<{ url: string, format: string, source: string, element: string }> }}
 */
export function detect3DModelRefs() {
  const seen = new Set();
  const modelFiles = [];

  function add(url, source, element) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    modelFiles.push({
      url,
      format: extractFormat(url),
      source,
      element,
    });
  }

  // 1. <a href>, <link href>, <source src> tags
  for (const tag of ['a', 'link']) {
    for (const el of document.getElementsByTagName(tag)) {
      const url = checkModelUrl(el, 'href');
      if (url) add(url, tag + '[href]', buildElementLabel(el));
    }
  }
  for (const el of document.getElementsByTagName('source')) {
    const url = checkModelUrl(el, 'src');
    if (url) add(url, 'source[src]', buildElementLabel(el));
  }

  // 2. model-viewer, a-gltf-model, a-obj-model — check all elements by tag
  for (const el of document.getElementsByTagName('*')) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'model-viewer' || tag === 'a-gltf-model' || tag === 'a-obj-model') {
      const url = checkModelUrl(el, 'src');
      if (url) add(url, tag + '[src]', buildElementLabel(el));
    }
  }

  // 3. data-* attributes on all elements
  const allElements = document.getElementsByTagName('*');
  const maxElements = Math.min(allElements.length, 2000);
  for (let i = 0; i < maxElements; i++) {
    const el = allElements[i];
    if (!el.attributes) continue;
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-') && MODEL_EXTENSIONS.test(attr.value)) {
        add(attr.value, attr.name, buildElementLabel(el));
      }
    }
  }

  // 4. Inline <script> text content (first 50 scripts, 10K chars each)
  const scripts = document.getElementsByTagName('script');
  let scriptCount = 0;
  for (const script of scripts) {
    if (script.getAttribute('src')) continue; // skip external scripts
    if (scriptCount++ >= 50) break;
    const text = (script.textContent || '').slice(0, 10000);
    const urlRe = /["']([^"'\s]+\.(glb|gltf|obj|fbx|dae|ply|stl|usdz))(\?[^"'\s]*)?["']/gi;
    let match;
    while ((match = urlRe.exec(text)) !== null) {
      add(match[1], 'script inline', 'script');
    }
  }

  return { modelFiles };
}
