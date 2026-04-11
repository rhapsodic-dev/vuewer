import { describe, expect, it } from 'vitest';
import {
  getNormalizedWheelDominantAxisDelta,
  isPixelModeWheelEvent,
  normalizeWheelDelta,
  normalizeWheelDeltaY,
} from '../src/utils/wheel-delta';

interface WheelEventInput {
  deltaX?: number;
  deltaY?: number;
  deltaMode?: number;
}

function createWheelEvent({
  deltaX = 0,
  deltaY = 0,
  deltaMode = 0,
}: WheelEventInput): WheelEvent {
  return {
    deltaX,
    deltaY,
    deltaMode,
  } as WheelEvent;
}

describe('wheel-delta utils', () => {
  it('normalizes deltas by wheel delta mode', () => {
    expect(normalizeWheelDelta(2, 0)).toBe(2);
    expect(normalizeWheelDelta(2, 1)).toBe(32);
    expect(normalizeWheelDelta(2, 2)).toBe(1600);
  });

  it('normalizes deltaY from wheel events', () => {
    expect(normalizeWheelDeltaY(createWheelEvent({
      deltaY: 3,
      deltaMode: 1,
    }))).toBe(48);
  });

  it('picks dominant axis and keeps event mode semantics', () => {
    expect(getNormalizedWheelDominantAxisDelta(createWheelEvent({
      deltaX: 6,
      deltaY: 4,
      deltaMode: 1,
    }))).toBe(96);

    expect(getNormalizedWheelDominantAxisDelta(createWheelEvent({
      deltaX: 1,
      deltaY: -5,
      deltaMode: 0,
    }))).toBe(-5);
  });

  it('detects pixel mode wheel events', () => {
    expect(isPixelModeWheelEvent(createWheelEvent({ deltaMode: 0 }))).toBe(true);
    expect(isPixelModeWheelEvent(createWheelEvent({ deltaMode: 1 }))).toBe(false);
  });
});
