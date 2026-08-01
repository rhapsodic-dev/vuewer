import {
  describe,
  expect,
  it,
} from 'vitest';

import { isTouchDoubleTap } from '../src/composables/touch-double-tap';

describe('touch double tap detection', () => {
  it('recognizes two nearby taps within the allowed delay', () => {
    expect(isTouchDoubleTap({
      previousTap: { clientX: 100, clientY: 120, timestamp: 1000 },
      currentTap: { clientX: 112, clientY: 128, timestamp: 1250 },
      maxDelayMs: 300,
      maxDistancePx: 40,
    })).toBe(true);
  });

  it('rejects taps that are too far apart in time', () => {
    expect(isTouchDoubleTap({
      previousTap: { clientX: 100, clientY: 120, timestamp: 1000 },
      currentTap: { clientX: 100, clientY: 120, timestamp: 1400 },
      maxDelayMs: 300,
      maxDistancePx: 40,
    })).toBe(false);
  });

  it('rejects taps that are too far apart on screen', () => {
    expect(isTouchDoubleTap({
      previousTap: { clientX: 100, clientY: 120, timestamp: 1000 },
      currentTap: { clientX: 150, clientY: 120, timestamp: 1200 },
      maxDelayMs: 300,
      maxDistancePx: 40,
    })).toBe(false);
  });
});
