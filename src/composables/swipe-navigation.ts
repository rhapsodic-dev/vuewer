import type { Ref } from 'vue';
import { onBeforeUnmount, ref } from 'vue';

import { useTouchPointerLifecycle } from './touch-pointer-lifecycle';

export type TouchSwipeDirection = 'left' | 'right';

export interface TouchSwipeDirectionInput {
  deltaX: number;
  deltaY: number;
  thresholdPx?: number;
  horizontalToVerticalRatio?: number;
}

export interface UseSwipeNavigationOptions {
  viewerRef: Ref<HTMLElement | null>;
  imageRef: Ref<HTMLImageElement | null>;
  isSwipeEnabled: Ref<boolean>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

function getDefaultTouchSwipeThresholdPx(): number {
  return 48;
}

function getDefaultTouchSwipeHorizontalToVerticalRatio(): number {
  return 1.2;
}

export function getTouchSwipeDirection({
  deltaX,
  deltaY,
  thresholdPx = getDefaultTouchSwipeThresholdPx(),
  horizontalToVerticalRatio = getDefaultTouchSwipeHorizontalToVerticalRatio(),
}: TouchSwipeDirectionInput): TouchSwipeDirection | null {
  const absDeltaX = Math.abs(deltaX);
  if (absDeltaX < thresholdPx) {
    return null;
  }

  const absDeltaY = Math.abs(deltaY);
  if (absDeltaY > 0 && (absDeltaX / absDeltaY) < horizontalToVerticalRatio) {
    return null;
  }

  return deltaX < 0 ? 'left' : 'right';
}

export function useSwipeNavigation({
  viewerRef,
  imageRef,
  isSwipeEnabled,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeNavigationOptions) {
  const activeSwipePointerId = ref<number | null>(null);
  const swipeStartClientX = ref(0);
  const swipeStartClientY = ref(0);
  const touchPointerLifecycle = useTouchPointerLifecycle();

  function stopSwipeTracking(): void {
    const pointerId = activeSwipePointerId.value;
    if (pointerId === null) return;

    const viewer = viewerRef.value;
    if (viewer?.hasPointerCapture(pointerId)) {
      viewer.releasePointerCapture(pointerId);
    }

    activeSwipePointerId.value = null;
  }

  function clearSwipeState(): void {
    stopSwipeTracking();
    touchPointerLifecycle.clearPointers();
  }

  function canStartTouchSwipeFromPointer(event: PointerEvent): boolean {
    if (!isSwipeEnabled.value) {
      return false;
    }

    if (event.pointerType !== 'touch') {
      return false;
    }

    if (!onSwipeLeft && !onSwipeRight) {
      return false;
    }

    const image = imageRef.value;
    const eventTarget = event.target;
    if (!image || !(eventTarget instanceof Node)) {
      return false;
    }

    return image.contains(eventTarget);
  }

  function onViewerPointerDown(event: PointerEvent): void {
    touchPointerLifecycle.registerPointer(event.pointerType, event.pointerId);
    if (touchPointerLifecycle.hasMultiTouch(event.pointerType)) {
      stopSwipeTracking();
      return;
    }

    if (!canStartTouchSwipeFromPointer(event)) {
      return;
    }

    activeSwipePointerId.value = event.pointerId;
    swipeStartClientX.value = event.clientX;
    swipeStartClientY.value = event.clientY;

    const viewer = viewerRef.value;
    if (viewer && !viewer.hasPointerCapture(event.pointerId)) {
      viewer.setPointerCapture(event.pointerId);
    }
  }

  function onViewerPointerMove(event: PointerEvent): void {
    if (touchPointerLifecycle.hasMultiTouch(event.pointerType)) {
      stopSwipeTracking();
      return;
    }

    if (activeSwipePointerId.value === event.pointerId) {
      event.preventDefault();
    }
  }

  function onViewerPointerUp(event: PointerEvent): void {
    touchPointerLifecycle.unregisterPointer(event.pointerType, event.pointerId);

    if (activeSwipePointerId.value !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipeStartClientX.value;
    const deltaY = event.clientY - swipeStartClientY.value;
    const swipeDirection = getTouchSwipeDirection({ deltaX, deltaY });

    // Re-check at gesture end so we do not navigate if state switched to pannable.
    if (!isSwipeEnabled.value) {
      stopSwipeTracking();
      return;
    }

    if (swipeDirection === 'left') {
      onSwipeLeft?.();
    } else if (swipeDirection === 'right') {
      onSwipeRight?.();
    }

    stopSwipeTracking();
  }

  function onViewerPointerCancel(event: PointerEvent): void {
    touchPointerLifecycle.unregisterPointer(event.pointerType, event.pointerId);

    if (activeSwipePointerId.value === event.pointerId) {
      stopSwipeTracking();
    }
  }

  onBeforeUnmount(() => {
    clearSwipeState();
  });

  return {
    onViewerPointerDown,
    onViewerPointerMove,
    onViewerPointerUp,
    onViewerPointerCancel,
  };
}
