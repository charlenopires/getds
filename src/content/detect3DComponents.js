/**
 * 3D Web Component detection — Layer 5
 *
 * Detects custom elements and iframes used for 3D content:
 * model-viewer, a-scene (A-Frame), spline-viewer, Spline iframes,
 * Sketchfab iframes, Rive canvases.
 *
 * @returns {{ components3D: Array<{ type: string, selector: string, src: string|null, attributes: object, modelUrl: string|null }> }}
 */

function buildSelector(el) {
  let label = el.tagName.toLowerCase();
  if (el.id) return label + '#' + el.id;
  if (el.classList && el.classList.length) {
    const cls = Array.from(el.classList).filter(c => /^[\w-]+$/.test(c)).slice(0, 2).join('.');
    if (cls) label += '.' + cls;
  }
  return label;
}

function getAttrs(el, names) {
  const attrs = {};
  for (const name of names) {
    const val = el.getAttribute(name);
    if (val != null) attrs[name] = val;
  }
  return attrs;
}

function collectDataAttrs(el) {
  const attrs = {};
  if (!el.attributes) return attrs;
  for (const a of el.attributes) {
    if (a.name.startsWith('data-')) attrs[a.name] = a.value;
  }
  return attrs;
}

/**
 * Find all elements matching a given tag name (case-insensitive).
 * Uses getElementsByTagName('*') to support custom elements in happy-dom.
 */
function findByTagName(tagName) {
  const target = tagName.toLowerCase();
  const results = [];
  for (const el of document.getElementsByTagName('*')) {
    if (el.tagName.toLowerCase() === target) results.push(el);
  }
  return results;
}

/**
 * @returns {{ components3D: Array<{ type: string, selector: string, src: string|null, attributes: object, modelUrl: string|null }> }}
 */
export function detect3DComponents() {
  const components3D = [];

  // model-viewer
  for (const el of findByTagName('model-viewer')) {
    const src = el.getAttribute('src') || null;
    const attrs = getAttrs(el, ['alt', 'ar', 'camera-controls', 'auto-rotate', 'poster', 'ios-src', 'environment-image']);
    components3D.push({
      type: 'model-viewer',
      selector: buildSelector(el),
      src,
      attributes: attrs,
      modelUrl: src,
    });
  }

  // A-Frame (a-scene)
  for (const scene of findByTagName('a-scene')) {
    const entities = findByTagName('a-entity');
    const gltfModels = findByTagName('a-gltf-model');
    const objModels = findByTagName('a-obj-model');

    const modelUrls = [];
    for (const m of gltfModels) {
      const src = m.getAttribute('src');
      if (src) modelUrls.push(src);
    }
    for (const m of objModels) {
      const src = m.getAttribute('src');
      if (src) modelUrls.push(src);
    }
    for (const e of entities) {
      const gltf = e.getAttribute('gltf-model');
      if (gltf) modelUrls.push(gltf);
    }

    components3D.push({
      type: 'a-scene',
      selector: buildSelector(scene),
      src: modelUrls[0] ?? null,
      attributes: { entityCount: entities.length, modelCount: gltfModels.length + objModels.length },
      modelUrl: modelUrls[0] ?? null,
    });
  }

  // Spline (spline-viewer + iframes)
  for (const el of findByTagName('spline-viewer')) {
    const url = el.getAttribute('url') || null;
    components3D.push({
      type: 'spline-viewer',
      selector: buildSelector(el),
      src: url,
      attributes: getAttrs(el, ['url', 'loading-anim']),
      modelUrl: url,
    });
  }

  // Iframes: Spline + Sketchfab
  for (const iframe of document.getElementsByTagName('iframe')) {
    const src = iframe.getAttribute('src') || '';
    if (/my\.spline\.design/i.test(src)) {
      components3D.push({
        type: 'spline-iframe',
        selector: buildSelector(iframe),
        src,
        attributes: {},
        modelUrl: src,
      });
    } else if (/sketchfab\.com/i.test(src)) {
      components3D.push({
        type: 'sketchfab-iframe',
        selector: buildSelector(iframe),
        src,
        attributes: {},
        modelUrl: src,
      });
    }
  }

  // Rive
  for (const el of findByTagName('rive-canvas')) {
    components3D.push({
      type: 'rive-canvas',
      selector: buildSelector(el),
      src: el.getAttribute('src') || null,
      attributes: collectDataAttrs(el),
      modelUrl: el.getAttribute('src') || null,
    });
  }
  for (const canvas of document.getElementsByTagName('canvas')) {
    if (canvas.hasAttribute('data-rive')) {
      components3D.push({
        type: 'rive-canvas',
        selector: buildSelector(canvas),
        src: canvas.getAttribute('data-rive') || null,
        attributes: collectDataAttrs(canvas),
        modelUrl: canvas.getAttribute('data-rive') || null,
      });
    }
  }

  return { components3D };
}
