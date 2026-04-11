import { describe, expect, it } from 'vitest';
import { getTouchSwipeDirection } from '../src/composables/swipe-navigation';

describe('touch swipe direction detection', () => {
  it('detects left swipe when horizontal distance exceeds threshold', () => {
    const direction = getTouchSwipeDirection({
      deltaX: -80,
      deltaY: 10,
    });

    expect(direction).toBe('left');
  });

  it('detects right swipe when horizontal distance exceeds threshold', () => {
    const direction = getTouchSwipeDirection({
      deltaX: 80,
      deltaY: 5,
    });

    expect(direction).toBe('right');
  });

  it('ignores short horizontal drags below the swipe threshold', () => {
    const direction = getTouchSwipeDirection({
      deltaX: 20,
      deltaY: 0,
    });

    expect(direction).toBeNull();
  });

  it('ignores gestures where vertical movement dominates', () => {
    const direction = getTouchSwipeDirection({
      deltaX: 60,
      deltaY: 55,
    });

    expect(direction).toBeNull();
  });
});
