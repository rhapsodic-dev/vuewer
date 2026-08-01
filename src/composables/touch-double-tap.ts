import type { Ref } from 'vue';
import { ref } from 'vue';

export interface TouchTap {
  clientX: number;
  clientY: number;
  timestamp: number;
}

export interface TouchDoubleTapOptions {
  imageRef: Ref<HTMLImageElement | null>;
  onDoubleTap?: (tap: TouchTap) => void;
  maxDelayMs?: number;
  maxDistancePx?: number;
  moveTolerancePx?: number;
}

export interface TouchDoubleTapInput {
  previousTap: TouchTap;
  currentTap: TouchTap;
  maxDelayMs: number;
  maxDistancePx: number;
}

const defaultMaxDelayMs = 300;
const defaultMaxDistancePx = 40;
const defaultMoveTolerancePx = 12;

function getPointDistance(
  firstPoint: Pick<TouchTap, 'clientX' | 'clientY'>,
  secondPoint: Pick<TouchTap, 'clientX' | 'clientY'>,
): number {
  return Math.hypot(
    secondPoint.clientX - firstPoint.clientX,
    secondPoint.clientY - firstPoint.clientY,
  );
}

export function isTouchDoubleTap({
  previousTap,
  currentTap,
  maxDelayMs,
  maxDistancePx,
}: TouchDoubleTapInput): boolean {
  const elapsedTime = currentTap.timestamp - previousTap.timestamp;

  return (
    elapsedTime >= 0
    && elapsedTime <= maxDelayMs
    && getPointDistance(previousTap, currentTap) <= maxDistancePx
  );
}

export function useTouchDoubleTap({
  imageRef,
  onDoubleTap,
  maxDelayMs = defaultMaxDelayMs,
  maxDistancePx = defaultMaxDistancePx,
  moveTolerancePx = defaultMoveTolerancePx,
}: TouchDoubleTapOptions) {
  const activePointerId = ref<number>();
  const tapStartClientX = ref(0);
  const tapStartClientY = ref(0);
  const pointerMoved = ref(false);
  const previousTap = ref<TouchTap>();

  function resetActivePointer(): void {
    activePointerId.value = undefined;
    pointerMoved.value = false;
  }

  function isTargetInsideImage(target: EventTarget | null): boolean {
    const image = imageRef.value;

    return Boolean(image && target instanceof Node && image.contains(target));
  }

  function onViewerPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') {
      return;
    }

    if (activePointerId.value !== undefined || !isTargetInsideImage(event.target)) {
      resetActivePointer();
      previousTap.value = undefined;
      return;
    }

    activePointerId.value = event.pointerId;
    tapStartClientX.value = event.clientX;
    tapStartClientY.value = event.clientY;
    pointerMoved.value = false;
  }

  function onViewerPointerMove(event: PointerEvent): void {
    if (activePointerId.value !== event.pointerId || pointerMoved.value) {
      return;
    }

    pointerMoved.value = getPointDistance(
      {
        clientX: tapStartClientX.value,
        clientY: tapStartClientY.value,
      },
      event,
    ) > moveTolerancePx;
  }

  function onViewerPointerUp(event: PointerEvent): void {
    if (activePointerId.value !== event.pointerId) {
      return;
    }

    const hasMoved = pointerMoved.value || getPointDistance(
      {
        clientX: tapStartClientX.value,
        clientY: tapStartClientY.value,
      },
      event,
    ) > moveTolerancePx;
    resetActivePointer();

    if (hasMoved) {
      previousTap.value = undefined;
      return;
    }

    const currentTap: TouchTap = {
      clientX: event.clientX,
      clientY: event.clientY,
      timestamp: event.timeStamp,
    };

    if (previousTap.value && isTouchDoubleTap({
      previousTap: previousTap.value,
      currentTap,
      maxDelayMs,
      maxDistancePx,
    })) {
      previousTap.value = undefined;
      event.preventDefault();
      onDoubleTap?.(currentTap);
      return;
    }

    previousTap.value = currentTap;
  }

  function onViewerPointerCancel(event: PointerEvent): void {
    if (activePointerId.value !== event.pointerId) {
      return;
    }

    resetActivePointer();
    previousTap.value = undefined;
  }

  return {
    onViewerPointerDown,
    onViewerPointerMove,
    onViewerPointerUp,
    onViewerPointerCancel,
  };
}
