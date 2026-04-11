import { describe, expect, it } from 'vitest';
import { getPanOffsetAtScaleChange } from '../src/composables/pan';

describe('getPanOffsetAtScaleChange', () => {
  it('keeps offset unchanged when scales are invalid', () => {
    const invalidPreviousScale = getPanOffsetAtScaleChange({
      previousScale: 0,
      nextScale: 2,
      currentOffsetX: 30,
      currentOffsetY: -15,
      focalOffsetFromViewerCenterX: 100,
      focalOffsetFromViewerCenterY: 80,
    });

    expect(invalidPreviousScale.offsetX).toBe(30);
    expect(invalidPreviousScale.offsetY).toBe(-15);
  });

  it('zooms in around viewer center without introducing pan offset', () => {
    const nextOffset = getPanOffsetAtScaleChange({
      previousScale: 1,
      nextScale: 2,
      currentOffsetX: 0,
      currentOffsetY: 0,
      focalOffsetFromViewerCenterX: 0,
      focalOffsetFromViewerCenterY: 0,
    });

    expect(nextOffset.offsetX).toBeCloseTo(0, 8);
    expect(nextOffset.offsetY).toBeCloseTo(0, 8);
  });

  it('zooms in around an off-center focal point and adjusts pan toward it', () => {
    const nextOffset = getPanOffsetAtScaleChange({
      previousScale: 1,
      nextScale: 2,
      currentOffsetX: 0,
      currentOffsetY: 0,
      focalOffsetFromViewerCenterX: 120,
      focalOffsetFromViewerCenterY: -60,
    });

    expect(nextOffset.offsetX).toBeCloseTo(-120, 8);
    expect(nextOffset.offsetY).toBeCloseTo(60, 8);
  });

  it('respects existing pan offset while scaling around a focal point', () => {
    const nextOffset = getPanOffsetAtScaleChange({
      previousScale: 2,
      nextScale: 3,
      currentOffsetX: 40,
      currentOffsetY: -20,
      focalOffsetFromViewerCenterX: -100,
      focalOffsetFromViewerCenterY: 50,
    });

    expect(nextOffset.offsetX).toBeCloseTo(110, 8);
    expect(nextOffset.offsetY).toBeCloseTo(-55, 8);
  });
});
