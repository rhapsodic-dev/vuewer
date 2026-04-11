import { useTimeoutFn } from '@vueuse/core';
import { ref } from 'vue';
import {
  getNormalizedWheelDominantAxisDelta,
  isPixelModeWheelEvent,
} from '../utils/wheel-delta';

// Raw wheel scroll is noisy for gallery navigation: momentum and mixed-axis input
// can trigger accidental multi-skip. This composable converts wheel streams into
// deliberate "one-image" steps with accumulation, thresholding, and cooldown.
export interface UseWheelScrollTuningOptions {
  onScrollUp: () => void;
  onScrollDown: () => void;
  /**
   * Controls how much wheel movement is needed before switching images.
   * Increase to make switching harder, decrease to make it more responsive.
   * Example values:
   * - `50` for quicker switching.
   * - `100` for stricter switching.
   */
  threshold?: number;
  /**
   * Controls the minimum delay between image switches (milliseconds).
   * Increase to reduce momentum multi-skip, decrease for faster repeated switching.
   * Example values:
   * - `70` for snappier repeated navigation.
   * - `160` for stricter momentum control.
   */
  cooldownMs?: number;
  /**
   * Extra threshold multiplier for pixel-mode wheel events (`deltaMode === 0`).
   * Higher values make trackpad-like input less sensitive.
   * Example values:
   * - `1` to treat pixel-mode like non-pixel input.
   * - `1.35` for safer trackpad handling.
   */
  pixelModeThresholdMultiplier?: number;
  /**
   * Extra cooldown multiplier for pixel-mode wheel events (`deltaMode === 0`).
   * Higher values slow repeated switching on trackpad-like input.
   * Example values:
   * - `1` to keep cooldown unchanged.
   * - `1.25` for stronger momentum damping.
   */
  pixelModeCooldownMultiplier?: number;
}

function getDefaultThreshold(): number {
  return 60;
}

function getDefaultCooldownMs(): number {
  return 90;
}

function getDefaultPixelModeThresholdMultiplier(): number {
  return 1.35;
}

function getDefaultPixelModeCooldownMultiplier(): number {
  return 1.25;
}

export function useWheelScrollTuning({
  onScrollUp,
  onScrollDown,
  threshold = getDefaultThreshold(),
  cooldownMs = getDefaultCooldownMs(),
  pixelModeThresholdMultiplier = getDefaultPixelModeThresholdMultiplier(),
  pixelModeCooldownMultiplier = getDefaultPixelModeCooldownMultiplier(),
}: UseWheelScrollTuningOptions) {
  const effectiveCooldownMs = ref(cooldownMs);
  const {
    isPending: isCooldownActive,
    start: startCooldown,
    stop: stopCooldown,
  } = useTimeoutFn(() => {}, effectiveCooldownMs, { immediate: false });

  let accumulatedDelta = 0;

  function getEffectiveCooldownMs(event: WheelEvent): number {
    if (isPixelModeWheelEvent(event)) {
      return cooldownMs * pixelModeCooldownMultiplier;
    }

    return cooldownMs;
  }

  function getEffectiveThreshold(event: WheelEvent): number {
    if (isPixelModeWheelEvent(event)) {
      return threshold * pixelModeThresholdMultiplier;
    }

    return threshold;
  }

  function handleWheelScroll(event: WheelEvent): boolean {
    const navigationDelta = getNormalizedWheelDominantAxisDelta(event);
    const scrollDirection = Math.sign(navigationDelta);
    if (!scrollDirection) {
      return false;
    }

    // Reset accumulation when the gesture changes direction.
    if (accumulatedDelta !== 0 && Math.sign(accumulatedDelta) !== scrollDirection) {
      accumulatedDelta = 0;
    }

    // Build up wheel intent across events using the dominant axis.
    accumulatedDelta += navigationDelta;

    const effectiveThreshold = getEffectiveThreshold(event);

    // Do nothing until the gesture is strong enough.
    if (Math.abs(accumulatedDelta) < effectiveThreshold) {
      return false;
    }

    // Rate-limit navigation to avoid momentum-based multi-skip.
    if (isCooldownActive.value) {
      // Clear any carried momentum during cooldown so one gesture does not
      // trigger delayed extra navigation after cooldown expires.
      accumulatedDelta = 0;
      return false;
    }

    if (accumulatedDelta > 0) {
      onScrollDown();
    } else {
      onScrollUp();
    }

    accumulatedDelta = 0;
    effectiveCooldownMs.value = getEffectiveCooldownMs(event);
    startCooldown();
    return true;
  }

  function resetWheelScrollState(): void {
    accumulatedDelta = 0;
    stopCooldown();
  }

  return {
    handleWheelScroll,
    resetWheelScrollState,
  };
}
