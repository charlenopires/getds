import { describe, test, expect } from 'bun:test';
import { classify3DAnimations } from './classify3DAnimations.js';

describe('classify3DAnimations', () => {
  test('returns an object with an animations3D array', () => {
    const result = classify3DAnimations();
    expect(result).toHaveProperty('animations3D');
    expect(Array.isArray(result.animations3D)).toBe(true);
  });

  test('returns empty array when no 3D animations exist', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        { name: 'fadeIn', stops: [{ key: '0%', styles: { opacity: '0' } }, { key: '100%', styles: { opacity: '1' } }] },
      ],
    });
    expect(animations3D).toHaveLength(0);
  });

  test('classifies rotateY keyframe as rotation-3d', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'card-flip',
          stops: [
            { key: '0%', styles: { transform: 'rotateY(0deg)' } },
            { key: '100%', styles: { transform: 'rotateY(180deg)' } },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].name).toBe('card-flip');
    expect(animations3D[0].type).toBe('rotation-3d');
    expect(animations3D[0].axes).toContain('Y');
    expect(animations3D[0].transforms).toContain('rotateY');
  });

  test('classifies translateZ as translation-3d', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'push-back',
          stops: [
            { key: '0%', styles: { transform: 'translateZ(0)' } },
            { key: '100%', styles: { transform: 'translateZ(-100px)' } },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].type).toBe('translation-3d');
  });

  test('classifies mixed rotation + translation as combined-3d', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'hero-spin',
          stops: [
            { key: '0%', styles: { transform: 'rotateX(0) translateZ(0)' } },
            { key: '100%', styles: { transform: 'rotateX(360deg) translateZ(50px)' } },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].type).toBe('combined-3d');
  });

  test('classifies perspective() function as perspective-shift', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'zoom',
          stops: [
            { key: '0%', styles: { transform: 'perspective(1000px)' } },
            { key: '100%', styles: { transform: 'perspective(500px)' } },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].type).toBe('perspective-shift');
  });

  test('classifies scaleZ as scale-3d', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'depth-scale',
          stops: [
            { key: '0%', styles: { transform: 'scaleZ(1)' } },
            { key: '100%', styles: { transform: 'scaleZ(2)' } },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].type).toBe('scale-3d');
  });

  test('classifies matrix3d as combined-3d', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'matrix-anim',
          stops: [
            { key: '0%', styles: { transform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)' } },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].type).toBe('combined-3d');
  });

  test('classifies web animations with 3D transforms', () => {
    const { animations3D } = classify3DAnimations({
      webAnimations: [
        {
          animationName: 'js-rotate',
          duration: 2000,
          easing: 'ease-out',
          keyframes: [
            { transform: 'rotateX(0deg)', offset: 0 },
            { transform: 'rotateX(180deg)', offset: 1 },
          ],
        },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].name).toBe('js-rotate');
    expect(animations3D[0].type).toBe('rotation-3d');
    expect(animations3D[0].duration).toBe('2000ms');
    expect(animations3D[0].easing).toBe('ease-out');
  });

  test('classifies static transforms with 3D functions', () => {
    const { animations3D } = classify3DAnimations({
      transforms: [
        { value: 'rotateY(45deg)', functions: ['rotateY'] },
      ],
    });

    expect(animations3D).toHaveLength(1);
    expect(animations3D[0].name).toBe('(static-transform)');
    expect(animations3D[0].type).toBe('rotation-3d');
  });

  test('ignores 2D-only transforms', () => {
    const { animations3D } = classify3DAnimations({
      transforms: [
        { value: 'translateX(10px) rotate(45deg)', functions: ['translateX', 'rotate'] },
      ],
    });

    expect(animations3D).toHaveLength(0);
  });

  test('extracts axes correctly', () => {
    const { animations3D } = classify3DAnimations({
      keyframes: [
        {
          name: 'multi-axis',
          stops: [
            { key: '0%', styles: { transform: 'rotateX(0) rotateY(0) translateZ(0)' } },
          ],
        },
      ],
    });

    expect(animations3D[0].axes).toContain('X');
    expect(animations3D[0].axes).toContain('Y');
    expect(animations3D[0].axes).toContain('Z');
  });

  test('handles empty input gracefully', () => {
    const { animations3D } = classify3DAnimations({});
    expect(animations3D).toHaveLength(0);
  });
});
