import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { useWheelScrollTuning } from '../src/composables/wheel-scroll-tuning';

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

describe('useWheelScrollTuning', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('normalizes line-mode wheel deltas for navigation sensitivity', () => {
    let downCalls = 0;

    const { handleWheelScroll } = useWheelScrollTuning({
      onScrollUp: () => {},
      onScrollDown: () => {
        downCalls += 1;
      },
      threshold: 60,
      cooldownMs: 0,
      pixelModeThresholdMultiplier: 1,
      pixelModeCooldownMultiplier: 1,
    });

    const didNavigate = handleWheelScroll(createWheelEvent({
      deltaY: 4,
      deltaMode: 1,
    }));

    expect(didNavigate).toBe(true);
    expect(downCalls).toBe(1);
  });

  it('drops accumulated momentum while cooldown is active', () => {
    vi.useFakeTimers();
    let downCalls = 0;

    const { handleWheelScroll } = useWheelScrollTuning({
      onScrollUp: () => {},
      onScrollDown: () => {
        downCalls += 1;
      },
      threshold: 10,
      cooldownMs: 100,
      pixelModeThresholdMultiplier: 1,
      pixelModeCooldownMultiplier: 1,
    });

    expect(handleWheelScroll(createWheelEvent({ deltaY: 12 }))).toBe(true);
    expect(downCalls).toBe(1);

    expect(handleWheelScroll(createWheelEvent({ deltaY: 12 }))).toBe(false);

    vi.advanceTimersByTime(120);
    expect(handleWheelScroll(createWheelEvent({ deltaY: 5 }))).toBe(false);
    expect(downCalls).toBe(1);

    expect(handleWheelScroll(createWheelEvent({ deltaY: 12 }))).toBe(true);
    expect(downCalls).toBe(2);
  });

  it('resets accumulated state when requested', () => {
    let downCalls = 0;

    const {
      handleWheelScroll,
      resetWheelScrollState,
    } = useWheelScrollTuning({
      onScrollUp: () => {},
      onScrollDown: () => {
        downCalls += 1;
      },
      threshold: 20,
      cooldownMs: 0,
      pixelModeThresholdMultiplier: 1,
      pixelModeCooldownMultiplier: 1,
    });

    expect(handleWheelScroll(createWheelEvent({ deltaY: 10 }))).toBe(false);
    expect(downCalls).toBe(0);

    resetWheelScrollState();

    expect(handleWheelScroll(createWheelEvent({ deltaY: 10 }))).toBe(false);
    expect(downCalls).toBe(0);
  });
});
