import { onBeforeUnmount } from 'vue';

export interface RunScheduledTransitionOptions {
  onTransitionFrame: () => void;
  onComplete?: () => void;
}

export interface UseScheduledTransitionOptions {
  durationMs: number;
}

/**
 * Schedules a state mutation for the next animation frame and resolves it after
 * a known CSS transition duration.
 *
 * This is useful when CSS owns the actual interpolation, but JS still needs to:
 * - re-arm the transition by waiting one frame before mutating reactive state
 * - cancel in-flight transitions when a new gesture interrupts the previous one
 * - run cleanup logic after the CSS transition duration has elapsed
 */
export function useScheduledTransition(options: UseScheduledTransitionOptions) {
  let transitionFrameId: number | undefined;
  let transitionTimeoutId: ReturnType<typeof setTimeout> | undefined;

  /**
   * Cancels any pending frame or completion callback for the active transition.
   */
  function cancelTransition(): void {
    if (transitionFrameId !== undefined) {
      cancelAnimationFrame(transitionFrameId);
      transitionFrameId = undefined;
    }

    if (transitionTimeoutId !== undefined) {
      clearTimeout(transitionTimeoutId);
      transitionTimeoutId = undefined;
    }
  }

  /**
   * Starts a new scheduled transition.
   *
   * The caller provides the state mutation that should happen on the next frame,
   * plus an optional completion callback that runs after the CSS duration ends.
   */
  function runTransition(config: RunScheduledTransitionOptions): void {
    cancelTransition();

    transitionFrameId = requestAnimationFrame(() => {
      transitionFrameId = undefined;
      config.onTransitionFrame();

      transitionTimeoutId = setTimeout(() => {
        transitionTimeoutId = undefined;
        config.onComplete?.();
      }, options.durationMs);
    });
  }

  onBeforeUnmount(() => {
    cancelTransition();
  });

  return {
    cancelTransition,
    runTransition,
  };
}
