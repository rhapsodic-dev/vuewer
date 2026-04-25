import { describe, expect, it } from 'vitest';

import {
  getDismissProgress,
  isVerticalDismissGesture,
  shouldDismissFromSwipe,
} from '../src/composables/touch-swipe-dismiss';

describe('touch swipe dismiss gesture', () => {
  it('detects a vertical gesture when vertical travel dominates', () => {
    const isDismissGesture = isVerticalDismissGesture({
      deltaX: 24,
      deltaY: 96,
      thresholdPx: 14,
      dominanceRatio: 1.15,
    });

    expect(isDismissGesture).toBe(true);
  });

  it('does not treat a horizontal gesture as a vertical dismiss gesture', () => {
    const isDismissGesture = isVerticalDismissGesture({
      deltaX: 96,
      deltaY: 20,
      thresholdPx: 14,
      dominanceRatio: 1.15,
    });

    expect(isDismissGesture).toBe(false);
  });

  it('keeps the gesture undecided for small or ambiguous movement', () => {
    const isShortGesture = isVerticalDismissGesture({
      deltaX: 8,
      deltaY: 10,
      thresholdPx: 14,
      dominanceRatio: 1.15,
    });
    const isDiagonalGesture = isVerticalDismissGesture({
      deltaX: 48,
      deltaY: 45,
      thresholdPx: 14,
      dominanceRatio: 1.15,
    });

    expect(isShortGesture).toBe(false);
    expect(isDiagonalGesture).toBe(false);
  });

  it('maps swipe distance to a clamped dismiss progress', () => {
    const midProgress = getDismissProgress({
      offsetY: 90,
      viewerHeight: 600,
      fullDistancePx: 180,
      fullDistanceRatio: 0.2,
    });
    const maxProgress = getDismissProgress({
      offsetY: 400,
      viewerHeight: 600,
      fullDistancePx: 180,
      fullDistanceRatio: 0.2,
    });

    expect(midProgress).toBe(0.5);
    expect(maxProgress).toBe(1);
  });

  it('dismisses only after the swipe crosses the threshold', () => {
    const shouldStayVisible = shouldDismissFromSwipe({
      offsetY: 90,
      viewerHeight: 800,
      thresholdPx: 96,
      thresholdRatio: 0.16,
    });
    const shouldDismiss = shouldDismissFromSwipe({
      offsetY: 144,
      viewerHeight: 800,
      thresholdPx: 96,
      thresholdRatio: 0.16,
    });

    expect(shouldStayVisible).toBe(false);
    expect(shouldDismiss).toBe(true);
  });
});
