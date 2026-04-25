import type { Ref } from 'vue';
import {
  computed, onBeforeUnmount, ref, watch,
} from 'vue';

import { clamp } from '../utils/math';
import { useActivePointer } from './active-pointer';
import { useScheduledTransition } from './scheduled-transition';
import { useTouchPointerLifecycle } from './touch-pointer-lifecycle';

export interface DismissGestureInput {
  deltaX: number;
  deltaY: number;
  thresholdPx: number;
  dominanceRatio: number;
}

export interface DismissProgressInput {
  offsetY: number;
  viewerHeight: number;
  fullDistancePx: number;
  fullDistanceRatio: number;
}

export interface DismissDecisionInput {
  offsetY: number;
  viewerHeight: number;
  thresholdPx: number;
  thresholdRatio: number;
}

export interface UseTouchSwipeDismissOptions {
  viewerRef: Ref<HTMLElement | null>;
  isEnabled: Ref<boolean>;
  onDismiss?: () => void;
}

const dismissDefaults = {
  // Minimum vertical travel before the dismiss gesture can lock in.
  lockThresholdPx: 14,
  // Vertical travel must exceed horizontal travel by at least this ratio to lock the dismiss gesture.
  lockDominanceRatio: 1.15,
  // Minimum absolute travel used for the drag effect and dismiss threshold on short viewports.
  thresholdPx: 96,
  // Fraction of the viewer height used for the drag effect and dismiss threshold on tall viewports.
  thresholdRatio: 0.16,
  // Maximum amount the content scales down while the dismiss gesture progresses.
  maxScaleReduction: 0.12,
  // Duration used for snap-back and dismiss-release animations after finger lift.
  transitionDurationMs: 220,
  // Minimum off-screen travel distance used for the release animation on short viewports.
  exitDistancePx: 240,
  // Fraction of viewer height used for the release animation on taller viewports.
  exitDistanceRatio: 0.6,
} as const;

export function isVerticalDismissGesture(config: DismissGestureInput): boolean {
  const absDeltaX = Math.abs(config.deltaX);
  const absDeltaY = Math.abs(config.deltaY);

  const hasReachedVerticalThreshold = absDeltaY >= config.thresholdPx;
  if (!hasReachedVerticalThreshold) {
    return false;
  }

  const hasVerticalDominance = absDeltaX === 0 || (absDeltaY / absDeltaX) >= config.dominanceRatio;
  if (hasVerticalDominance) {
    return true;
  }

  return false;
}

export function getDismissProgress(config: DismissProgressInput): number {
  const progressDistance = Math.max(
    config.fullDistancePx,
    config.viewerHeight * config.fullDistanceRatio,
  );

  if (progressDistance <= 0) {
    return 0;
  }

  return clamp(Math.abs(config.offsetY) / progressDistance, 0, 1);
}

export function shouldDismissFromSwipe(config: DismissDecisionInput): boolean {
  const dismissThresholdPx = Math.max(config.thresholdPx, config.viewerHeight * config.thresholdRatio);

  return Math.abs(config.offsetY) >= dismissThresholdPx;
}

function getExitOffset(offsetY: number, viewerHeight: number): number {
  const swipeDirection = offsetY < 0 ? -1 : 1;
  const exitDistance = Math.max(
    dismissDefaults.exitDistancePx,
    viewerHeight * dismissDefaults.exitDistanceRatio,
  );

  return swipeDirection * exitDistance;
}

export function useTouchSwipeDismiss(options: UseTouchSwipeDismissOptions) {
  const startClientX = ref(0);
  const startClientY = ref(0);
  const offsetY = ref(0);
  const isVerticalGesture = ref(false);
  const isDismissDragging = ref(false);
  const isAnimating = ref(false);

  const pointer = useActivePointer();
  const touchPointerLifecycle = useTouchPointerLifecycle();
  const transition = useScheduledTransition({
    durationMs: dismissDefaults.transitionDurationMs,
  });

  const scaleProgress = computed(() => getDismissProgress({
    offsetY: offsetY.value,
    viewerHeight: getViewerHeight(),
    fullDistancePx: dismissDefaults.thresholdPx,
    fullDistanceRatio: dismissDefaults.thresholdRatio,
  }));
  const opacity = computed(() => (
    1 - getDismissProgress({
      offsetY: offsetY.value,
      viewerHeight: getViewerHeight(),
      fullDistancePx: dismissDefaults.exitDistancePx,
      fullDistanceRatio: dismissDefaults.exitDistanceRatio,
    })
  ));
  const scale = computed(() => (1 - (scaleProgress.value * dismissDefaults.maxScaleReduction)));
  const viewerStyle = computed<Record<string, string>>(() => ({
    '--vuewer__touch-dismiss-offset-y': `${Math.round(offsetY.value)}px`,
    '--vuewer__touch-dismiss-opacity': opacity.value.toFixed(3),
    '--vuewer__touch-dismiss-scale': scale.value.toFixed(3),
    '--vuewer__touch-dismiss-transition-duration': `${dismissDefaults.transitionDurationMs}ms`,
  }));

  function getViewerHeight(): number {
    return options.viewerRef.value?.clientHeight ?? 0;
  }

  function runTransition(nextOffsetY: number, onComplete?: () => void): void {
    isDismissDragging.value = false;
    isAnimating.value = true;

    transition.runTransition({
      onTransitionFrame: () => {
        offsetY.value = nextOffsetY;
      },
      onComplete: () => {
        isAnimating.value = false;
        onComplete?.();
      },
    });
  }

  function releasePointer(): void {
    pointer.deactivatePointer(options.viewerRef.value);
    isVerticalGesture.value = false;
  }

  function resetVisualState(): void {
    offsetY.value = 0;
  }

  function clearState(): void {
    transition.cancelTransition();
    releasePointer();
    touchPointerLifecycle.clearPointers();
    isDismissDragging.value = false;
    isAnimating.value = false;
    resetVisualState();
  }

  function canStartSwipe(event: PointerEvent): boolean {
    if (!options.isEnabled.value || isAnimating.value || event.pointerType !== 'touch') {
      return false;
    }

    return true;
  }

  function onViewerPointerDown(event: PointerEvent): void {
    touchPointerLifecycle.registerPointer(event.pointerType, event.pointerId);
    if (touchPointerLifecycle.hasMultiTouch(event.pointerType)) {
      clearState();
      return;
    }

    if (!canStartSwipe(event)) {
      return;
    }

    transition.cancelTransition();
    isAnimating.value = false;
    isDismissDragging.value = false;
    pointer.activatePointer(options.viewerRef.value, event.pointerId);
    isVerticalGesture.value = false;
    startClientX.value = event.clientX;
    startClientY.value = event.clientY;
    resetVisualState();
  }

  function onViewerPointerMove(event: PointerEvent): void {
    if (touchPointerLifecycle.hasMultiTouch(event.pointerType)) {
      clearState();
      return;
    }

    if (!pointer.hasActivePointer(event.pointerId)) {
      return;
    }

    if (!options.isEnabled.value) {
      clearState();
      return;
    }

    const deltaX = event.clientX - startClientX.value;
    const deltaY = event.clientY - startClientY.value;

    if (!isVerticalGesture.value) {
      isVerticalGesture.value = isVerticalDismissGesture({
        deltaX,
        deltaY,
        thresholdPx: dismissDefaults.lockThresholdPx,
        dominanceRatio: dismissDefaults.lockDominanceRatio,
      });
    }

    if (!isVerticalGesture.value) {
      return;
    }

    isDismissDragging.value = true;
    offsetY.value = deltaY;
    event.preventDefault();
  }

  function onViewerPointerUp(event: PointerEvent): void {
    touchPointerLifecycle.unregisterPointer(event.pointerType, event.pointerId);

    if (!pointer.hasActivePointer(event.pointerId)) {
      return;
    }

    const nextOffsetY = event.clientY - startClientY.value;
    const wasVerticalGesture = isVerticalGesture.value;
    const shouldDismiss = (
      wasVerticalGesture
      && options.isEnabled.value
      && shouldDismissFromSwipe({
        offsetY: nextOffsetY,
        viewerHeight: getViewerHeight(),
        thresholdPx: dismissDefaults.thresholdPx,
        thresholdRatio: dismissDefaults.thresholdRatio,
      })
    );

    releasePointer();

    if (shouldDismiss) {
      runTransition(
        getExitOffset(nextOffsetY, getViewerHeight()),
        () => options.onDismiss?.(),
      );
      return;
    }

    if (wasVerticalGesture || offsetY.value !== 0) {
      runTransition(0, () => {
        resetVisualState();
      });
      return;
    }

    isDismissDragging.value = false;
    resetVisualState();
  }

  function onViewerPointerCancel(event: PointerEvent): void {
    touchPointerLifecycle.unregisterPointer(event.pointerType, event.pointerId);

    if (!pointer.hasActivePointer(event.pointerId)) {
      return;
    }

    releasePointer();

    if (offsetY.value !== 0) {
      runTransition(0, () => {
        resetVisualState();
      });
      return;
    }

    isDismissDragging.value = false;
    resetVisualState();
  }

  watch(options.isEnabled, (isEnabled) => {
    if (!isEnabled) {
      clearState();
    }
  });

  onBeforeUnmount(() => {
    clearState();
  });

  return {
    viewerStyle,
    isDismissDragging,
    onViewerPointerDown,
    onViewerPointerMove,
    onViewerPointerUp,
    onViewerPointerCancel,
  };
}
