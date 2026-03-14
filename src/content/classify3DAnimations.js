/**
 * 3D Animation Classification — Layer 5
 *
 * Pure function — no DOM access.
 * Filters animation data to entries using 3D transform functions and classifies them.
 *
 * @param {{ transforms?: Array, keyframes?: Array, webAnimations?: Array }} data
 * @returns {{ animations3D: Array<{ name: string, type: string, axes: string[], transforms: string[], duration: string|null, easing: string|null }> }}
 */

import { parseTransformFunctions } from './extractTransforms.js';

const ROTATION_3D = new Set(['rotateX', 'rotateY', 'rotateZ', 'rotate3d']);
const TRANSLATION_3D = new Set(['translateZ', 'translate3d']);
const SCALE_3D = new Set(['scaleZ', 'scale3d']);
const PERSPECTIVE_FN = new Set(['perspective']);

const ALL_3D_FNS = new Set([
  ...ROTATION_3D, ...TRANSLATION_3D, ...SCALE_3D, ...PERSPECTIVE_FN, 'matrix3d',
]);

function extractAxes(fns) {
  const axes = new Set();
  for (const fn of fns) {
    if (/X/i.test(fn)) axes.add('X');
    if (/Y/i.test(fn)) axes.add('Y');
    if (/Z/i.test(fn) || /3d/i.test(fn)) axes.add('Z');
  }
  if (axes.size === 0 && fns.some(f => ALL_3D_FNS.has(f))) axes.add('Z');
  return [...axes];
}

function classifyType(fns3d) {
  const hasRotation = fns3d.some(f => ROTATION_3D.has(f));
  const hasTranslation = fns3d.some(f => TRANSLATION_3D.has(f));
  const hasScale = fns3d.some(f => SCALE_3D.has(f));
  const hasPerspective = fns3d.some(f => PERSPECTIVE_FN.has(f));
  const hasMatrix = fns3d.includes('matrix3d');

  if (hasMatrix) return 'combined-3d';
  if (hasRotation && hasTranslation) return 'combined-3d';
  if (hasPerspective) return 'perspective-shift';
  if (hasRotation) return 'rotation-3d';
  if (hasTranslation) return 'translation-3d';
  if (hasScale) return 'scale-3d';
  return 'combined-3d';
}

/**
 * @param {{ transforms?: Array, keyframes?: Array, webAnimations?: Array }} data
 * @returns {{ animations3D: Array<{ name: string, type: string, axes: string[], transforms: string[], duration: string|null, easing: string|null }> }}
 */
export function classify3DAnimations(data = {}) {
  const animations3D = [];
  const { transforms = [], keyframes = [], webAnimations = [] } = data;

  // Classify keyframe-based 3D animations
  for (const kf of keyframes) {
    const all3dFns = new Set();
    for (const stop of (kf.stops ?? [])) {
      const transformVal = stop.styles?.transform ?? '';
      const fns = parseTransformFunctions(transformVal);
      for (const fn of fns) {
        if (ALL_3D_FNS.has(fn)) all3dFns.add(fn);
      }
    }
    if (all3dFns.size === 0) continue;

    const fns3d = [...all3dFns];
    animations3D.push({
      name: kf.name ?? '(keyframe)',
      type: classifyType(fns3d),
      axes: extractAxes(fns3d),
      transforms: fns3d,
      duration: null,
      easing: null,
    });
  }

  // Classify web animations with 3D transforms
  for (const wa of webAnimations) {
    const all3dFns = new Set();
    for (const kf of (wa.keyframes ?? [])) {
      const transformVal = kf.transform ?? '';
      const fns = parseTransformFunctions(transformVal);
      for (const fn of fns) {
        if (ALL_3D_FNS.has(fn)) all3dFns.add(fn);
      }
    }
    if (all3dFns.size === 0) continue;

    const fns3d = [...all3dFns];
    animations3D.push({
      name: wa.animationName ?? wa.id ?? '(web-animation)',
      type: classifyType(fns3d),
      axes: extractAxes(fns3d),
      transforms: fns3d,
      duration: typeof wa.duration === 'number' ? `${wa.duration}ms` : (wa.duration ?? null),
      easing: wa.easing ?? null,
    });
  }

  // Classify static transforms that use 3D functions
  for (const t of transforms) {
    const fns = t.functions ?? parseTransformFunctions(t.value ?? '');
    const fns3d = fns.filter(f => ALL_3D_FNS.has(f));
    if (fns3d.length === 0) continue;

    animations3D.push({
      name: '(static-transform)',
      type: classifyType(fns3d),
      axes: extractAxes(fns3d),
      transforms: fns3d,
      duration: null,
      easing: null,
    });
  }

  return { animations3D };
}
