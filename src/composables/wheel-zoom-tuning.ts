import { normalizeWheelDeltaY } from '../utils/wheel-delta';
import { clamp } from '../utils/math';

import type { ZoomFocalPoint } from './zoom';

// Wheel zoom feels inconsistent across devices if we use raw wheel deltas directly:
// trackpads often emit many small events, while mouse wheels can emit fewer/larger steps.
// This composable normalizes wheel intent into stable zoom deltas and clamps spikes.
export interface UseWheelZoomTuningOptions {
  onScale: (delta: number, focalPoint?: ZoomFocalPoint) => void;
  /**
   * Controls how strong each wheel step changes zoom.
   * Increase for faster zoom, decrease for smoother zoom.
   * Example values:
   * - `0.003` for slower/trackpad-friendly zoom.
   * - `0.01` for faster/mouse-wheel-friendly zoom.
   */
  wheelScaleFactor?: number;
  /**
   * Limits the maximum zoom change from a single wheel event.
   * Prevents sudden jumps caused by momentum spikes.
   * Example values:
   * - `0.08` for stricter smoothing.
   * - `0.2` for more aggressive zoom steps.
   */
  wheelMaxStep?: number;
}

function getDefaultWheelScaleFactor(): number {
  return 0.01;
}

function getDefaultWheelMaxStep(): number {
  return 0.1;
}

export function useWheelZoomTuning({
  onScale,
  wheelScaleFactor = getDefaultWheelScaleFactor(),
  wheelMaxStep = getDefaultWheelMaxStep(),
}: UseWheelZoomTuningOptions) {
  function handleWheelZoom(event: WheelEvent): boolean {
    const scaleDelta = getWheelScaleDelta(event);
    if (!scaleDelta) {
      return false;
    }

    onScale(scaleDelta, {
      clientX: event.clientX ?? 0,
      clientY: event.clientY ?? 0,
    });
    return true;
  }

  function getWheelScaleDelta(event: WheelEvent): number {
    const normalizedDeltaY = normalizeWheelDeltaY(event);
    const rawScaleDelta = -normalizedDeltaY * wheelScaleFactor;

    return clamp(rawScaleDelta, -wheelMaxStep, wheelMaxStep);
  }

  return {
    handleWheelZoom,
  };
}
