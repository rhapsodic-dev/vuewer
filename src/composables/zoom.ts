import type { Ref } from 'vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { clamp } from '../utils/math';

export interface ZoomFocalPoint {
  clientX: number;
  clientY: number;
}

export interface ZoomScaleChange {
  previousScale: number;
  nextScale: number;
  focalPoint?: ZoomFocalPoint;
}

export interface UseVuewerZoomOptions {
  zoomableElementRef: Ref<HTMLElement | null>;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  /**
   * Called whenever a scale update is applied.
   *
   * Consumers (for example pan logic) can use this signal to:
   * - keep the zoom anchored to the pointer/touch focal point
   * - recompute pan bounds for the new scale
   *
   * Can be replaced later via `setOnScaleChange()`.
   */
  onScaleChange?: (scaleChange: ZoomScaleChange) => void;
  /**
   * Listener options for touch/gesture events used by zoom handling.
   * Keep `passive: false` so handlers can call `event.preventDefault()`
   * and stop native page scroll/zoom during pinch interactions.
   */
  touchListenerOptions?: AddEventListenerOptions;
}

interface WebKitGestureEvent extends Event {
  scale?: number;
  clientX?: number;
  clientY?: number;
}

function getDefaultInitialScale(): number {
  return 1;
}

function getDefaultMinScale(): number {
  return 0.3;
}

function getDefaultMaxScale(): number {
  return 10;
}

function getDefaultTouchListenerOptions(): AddEventListenerOptions {
  // Required for `preventDefault()` inside touch/gesture handlers.
  return { passive: false };
}

export function useVuewerZoom({
  zoomableElementRef,
  initialScale = getDefaultInitialScale(),
  minScale = getDefaultMinScale(),
  maxScale = getDefaultMaxScale(),
  onScaleChange,
  touchListenerOptions = getDefaultTouchListenerOptions(),
}: UseVuewerZoomOptions) {
  const imageScale = ref(initialScale);
  const pinchStartDistance = ref<number | null>(null);
  const pinchStartScale = ref(initialScale);
  const gestureStartScale = ref<number | null>(null);
  const scaleChangeHandlerRef = ref<typeof onScaleChange>(onScaleChange);

  function handleScale(delta: number, focalPoint?: ZoomFocalPoint) {
    // Apply wheel delta as a relative change, so zoom speed feels consistent
    // across small and large scale values.
    setScale(imageScale.value * Math.exp(delta), focalPoint);
  }

  function setScale(scale: number, focalPoint?: ZoomFocalPoint): void {
    const previousScale = imageScale.value;
    const clampedScale = clampScale(scale);
    const nextScale = Math.round(clampedScale * 100) / 100;

    if (nextScale === previousScale) {
      return;
    }

    imageScale.value = nextScale;
    scaleChangeHandlerRef.value?.({
      previousScale,
      nextScale,
      focalPoint,
    });
  }

  function setOnScaleChange(scaleChangeHandler: ((scaleChange: ZoomScaleChange) => void) | null): void {
    // Allows wiring/rewiring scale side effects (like pan synchronization)
    // after composables are created.
    scaleChangeHandlerRef.value = scaleChangeHandler ?? undefined;
  }

  function clampScale(scale: number): number {
    return clamp(scale, minScale, maxScale);
  }

  function resetScale(): void {
    imageScale.value = initialScale;
  }

  function getTouchDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;

    const firstTouch = touches.item(0);
    const secondTouch = touches.item(1);

    if (!firstTouch || !secondTouch) return 0;

    const horizontalDistance = secondTouch.clientX - firstTouch.clientX;
    const verticalDistance = secondTouch.clientY - firstTouch.clientY;

    // Euclidean distance between two touch points (used as the pinch span).
    return Math.hypot(horizontalDistance, verticalDistance);
  }

  function getTouchCenter(touches: TouchList): ZoomFocalPoint | null {
    if (touches.length < 2) return null;

    const firstTouch = touches.item(0);
    const secondTouch = touches.item(1);

    if (!firstTouch || !secondTouch) return null;

    return {
      clientX: (firstTouch.clientX + secondTouch.clientX) / 2,
      clientY: (firstTouch.clientY + secondTouch.clientY) / 2,
    };
  }

  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length < 2) return;

    event.preventDefault();

    const distance = getTouchDistance(event.touches);
    if (!distance) return;

    pinchStartDistance.value = distance;
    pinchStartScale.value = imageScale.value;
  }

  function onTouchMove(event: TouchEvent): void {
    if (event.touches.length < 2 || pinchStartDistance.value === null) return;

    event.preventDefault();

    const distance = getTouchDistance(event.touches);
    if (!distance) return;

    const scaleFactor = distance / pinchStartDistance.value;
    const touchCenter = getTouchCenter(event.touches);

    setScale(
      pinchStartScale.value * scaleFactor,
      touchCenter ?? undefined,
    );
  }

  function onTouchEnd(event: TouchEvent): void {
    if (event.touches.length < 2) {
      pinchStartDistance.value = null;
      pinchStartScale.value = imageScale.value;
    }
  }

  function onTouchCancel(): void {
    pinchStartDistance.value = null;
    pinchStartScale.value = imageScale.value;
  }

  function getGestureFocalPoint(event: WebKitGestureEvent): ZoomFocalPoint | undefined {
    if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
      return undefined;
    }

    return {
      clientX: event.clientX,
      clientY: event.clientY,
    };
  }

  function getGestureScale(event: WebKitGestureEvent): number | null {
    if (typeof event.scale !== 'number') return null;
    if (!Number.isFinite(event.scale) || event.scale <= 0) return null;

    return event.scale;
  }

  function onGestureStart(event: Event): void {
    event.preventDefault();

    // When a real touch pinch is active, touch handlers already own zoom math.
    if (pinchStartDistance.value !== null) return;

    const webKitGestureEvent = event as WebKitGestureEvent;
    gestureStartScale.value = imageScale.value;

    const scale = getGestureScale(webKitGestureEvent);
    if (scale === null) return;

    setScale(
      gestureStartScale.value * scale,
      getGestureFocalPoint(webKitGestureEvent),
    );
  }

  // `gesture*` events are a non-standard WebKit API (mainly Safari on iOS/iPadOS,
  // and Safari on macOS with trackpad gestures). Chromium/Firefox usually do not
  // emit them, so these listeners are effectively ignored there.
  function onGestureChange(event: Event): void {
    event.preventDefault();

    // Avoid double-applying scale when touch pinch is active on WebKit browsers.
    if (pinchStartDistance.value !== null) return;

    const webKitGestureEvent = event as WebKitGestureEvent;
    const scale = getGestureScale(webKitGestureEvent);
    if (scale === null) return;

    const baseScale = gestureStartScale.value ?? imageScale.value;

    setScale(
      baseScale * scale,
      getGestureFocalPoint(webKitGestureEvent),
    );
  }

  function onGestureEnd(event: Event): void {
    event.preventDefault();
    gestureStartScale.value = null;
  }

  function mountZoomListeners(): void {
    const zoomableElement = zoomableElementRef.value;

    if (zoomableElement) {
      zoomableElement.addEventListener('touchstart', onTouchStart, touchListenerOptions);
      zoomableElement.addEventListener('touchmove', onTouchMove, touchListenerOptions);
      zoomableElement.addEventListener('touchend', onTouchEnd, touchListenerOptions);
      zoomableElement.addEventListener('touchcancel', onTouchCancel, touchListenerOptions);
    }

    document.addEventListener('gesturestart', onGestureStart, touchListenerOptions);
    document.addEventListener('gesturechange', onGestureChange, touchListenerOptions);
    document.addEventListener('gestureend', onGestureEnd, touchListenerOptions);
  }

  function unmountZoomListeners(): void {
    const zoomableElement = zoomableElementRef.value;

    if (zoomableElement) {
      zoomableElement.removeEventListener('touchstart', onTouchStart, touchListenerOptions);
      zoomableElement.removeEventListener('touchmove', onTouchMove, touchListenerOptions);
      zoomableElement.removeEventListener('touchend', onTouchEnd, touchListenerOptions);
      zoomableElement.removeEventListener('touchcancel', onTouchCancel, touchListenerOptions);
    }

    document.removeEventListener('gesturestart', onGestureStart, touchListenerOptions);
    document.removeEventListener('gesturechange', onGestureChange, touchListenerOptions);
    document.removeEventListener('gestureend', onGestureEnd, touchListenerOptions);
  }

  onMounted(() => {
    mountZoomListeners();
  });

  onBeforeUnmount(() => {
    unmountZoomListeners();
  });

  return {
    imageScale,
    handleScale,
    resetScale,
    setOnScaleChange,
  };
}
